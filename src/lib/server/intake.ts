import type { Database, Supplier } from './schema';

/*
 * Intake — turn a raw request (an email, a Slack paste, a sentence) into a
 * structured requisition with no human form-filling. Deterministic heuristics,
 * same philosophy as the quote extractor: parse what is really there, never
 * invent what isn't, and report what's missing so the gap is visible instead
 * of silently wrong. LLM-ready: swap the parser, keep the contract.
 */
export type IntakeItem = { itemName: string; quantity: number; unit?: string; notes?: string };
export type IntakeParse = {
  title: string;
  items: IntakeItem[];
  neededBy?: string;
  deliveryLocation?: string;
  missing: string[]; // named gaps a human may want to fill — not a review step
};

const UNITS = ['ea', 'pcs', 'pc', 'units', 'unit', 'boxes', 'box', 'sets', 'set', 'kg', 'lbs', 'ft', 'm', 'rolls', 'roll', 'sheets', 'sheet', 'pairs', 'pair'];
const MONTHS: Record<string, number> = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };

function parseNeededBy(text: string): string | undefined {
  // ISO date anywhere
  const iso = text.match(/\b(20\d{2})-(\d{1,2})-(\d{1,2})\b/);
  if (iso) return `${iso[1]}-${iso[2].padStart(2, '0')}-${iso[3].padStart(2, '0')}`;
  // "by Aug 1", "before September 12th", "needed by aug 1st"
  const monthName = text.match(/\b(?:by|before|due|needed by|deliver(?:y)? by)\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(\d{1,2})(?:st|nd|rd|th)?\b/i);
  if (monthName) {
    const month = MONTHS[monthName[1].toLowerCase()];
    const day = Number(monthName[2]);
    const nowDate = new Date();
    let year = nowDate.getFullYear();
    if (month < nowDate.getMonth() + 1 || (month === nowDate.getMonth() + 1 && day < nowDate.getDate())) year += 1;
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }
  // "by 8/1" or "by 8/1/2026"
  const slash = text.match(/\b(?:by|before|due|needed by)\s+(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/i);
  if (slash) {
    const year = slash[3] ? (slash[3].length === 2 ? `20${slash[3]}` : slash[3]) : String(new Date().getFullYear());
    return `${year}-${slash[1].padStart(2, '0')}-${slash[2].padStart(2, '0')}`;
  }
  return undefined;
}

// Words that end an item name when the request is written as prose
// ("20 guard brackets AND 50 bolts FOR the rebuild BY Aug 1").
const BOUNDARY = 'and|or|by|before|due|for|needed|need|deliver|delivery|ship|to|when|asap|thanks|please|at|in|on';

function cleanName(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ').replace(new RegExp(`\\s+(?:${BOUNDARY})$`, 'i'), '').trim();
}

function parseItems(text: string): IntakeItem[] {
  const items: IntakeItem[] = [];
  const seen = new Set<string>();
  const unitPattern = UNITS.join('|');
  // "20 guard brackets", "- 12 boxes nitrile gloves", "qty 20 of guard brackets"
  // Number must not be part of a date or a part-code (no word char, / or - before it).
  const qtyFirst = new RegExp(
    `(?<![\\w/-])(?:qty:?\\s*)?(\\d{1,6})\\s*(?:x\\s*)?(?:(${unitPattern})\\.?\\s+)?(?:of\\s+)?([a-zA-Z][\\w .\\/'()-]{2,60}?)(?=\\s*(?:,|;|\\.(?!\\d)|\\n|$|\\b(?:${BOUNDARY})\\b))`,
    'gi',
  );
  // "Steel shims x40"
  const nameFirst = new RegExp(`(?:^|\\n|,|;)\\s*(?:[-*•]\\s*)?([a-zA-Z][\\w .\\/'()-]{2,60}?)\\s*[x×]\\s*(\\d{1,6})\\b`, 'gi');

  let match: RegExpExecArray | null;
  while ((match = qtyFirst.exec(text)) !== null) {
    const name = cleanName(match[3]);
    // Reject non-item captures: too short, or starting with a connective —
    // catches date fragments like "Aug 1 for maintenance" parsing as an item.
    if (name.length < 3 || new RegExp(`^(?:${BOUNDARY}|the|days?|weeks?|months?)\\b`, 'i').test(name)) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    items.push({ itemName: name, quantity: Number(match[1]), unit: match[2]?.toLowerCase() });
  }
  while ((match = nameFirst.exec(text)) !== null) {
    const name = cleanName(match[1]);
    const key = name.toLowerCase();
    if (name.length < 3 || seen.has(key)) continue;
    seen.add(key);
    items.push({ itemName: name, quantity: Number(match[2]) });
  }
  return items;
}

export function parseIntakeRequest(text: string): IntakeParse {
  const clean = text.trim();
  const items = parseItems(clean);
  const neededBy = parseNeededBy(clean);
  const delivery = clean.match(/\b(?:deliver(?:y)?|ship)\s+to[:\s]+([^\n.;]{3,120})/i);
  const firstLine = clean.split('\n').map((l) => l.trim()).find(Boolean) ?? 'Purchase request';
  const title = items.length && firstLine.length > 90 ? `Purchase request — ${items[0].itemName}` : firstLine.slice(0, 90);

  const missing: string[] = [];
  if (!items.length) missing.push('No line items could be parsed — add what you need and the quantity.');
  if (!neededBy) missing.push('No need-by date found.');
  if (!delivery) missing.push('No delivery location found.');

  return { title, items, neededBy, deliveryLocation: delivery?.[1]?.trim(), missing };
}

/**
 * Pick suppliers for a request by matching item words against each supplier's
 * declared categories and typical items. Deterministic and explainable —
 * returns the matched suppliers so the requester can see why they were chosen.
 */
export function matchSuppliers(db: Database, workspaceId: string, items: IntakeItem[]): Supplier[] {
  const words = new Set(items.flatMap((item) => item.itemName.toLowerCase().split(/[^a-z]+/)).filter((w) => w.length > 3));
  if (!words.size) return [];
  return db.suppliers.filter((supplier) => {
    if (supplier.workspaceId !== workspaceId || supplier.archivedAt || supplier.status !== 'active') return false;
    const haystack = `${supplier.name} ${supplier.category ?? ''} ${supplier.typicalItems ?? ''}`.toLowerCase();
    return [...words].some((word) => haystack.includes(word));
  });
}
