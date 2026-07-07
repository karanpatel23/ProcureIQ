/*
 * AI RFQ advisor. Reviews a draft RFQ and returns editable, explained
 * suggestions that raise quote quality: missing structural fields, vague
 * requirements, and specification prompts by commodity category.
 *
 * This heuristic engine runs with no external service so the feature always
 * works and is fully deterministic for tests. When a hosted LLM is configured
 * it can be layered on top (same output shape); the heuristics remain the
 * fallback so AI unavailability never blocks the user.
 */
export type RfqAdvisorItem = { itemName?: string; description?: string; quantity?: number; unit?: string };
export type RfqAdvisorInput = {
  title?: string;
  description?: string;
  neededBy?: string;
  deliveryLocation?: string;
  items?: RfqAdvisorItem[];
  supplierCount?: number;
};
export type RfqSuggestion = {
  code: string;
  severity: 'info' | 'warning';
  field: string;
  message: string;
  /** Optional ready-to-use text the user can accept into the RFQ. */
  suggestion?: string;
};
export type RfqAdvice = { score: number; readyToSend: boolean; suggestions: RfqSuggestion[] };

const VAGUE = /\b(etc|tbd|as (needed|required|discussed)|various|standard|normal|good quality|asap|some|misc|miscellaneous|and so on)\b/i;

// Specification prompts by rough commodity family, keyed off item wording.
const SPEC_HINTS: Array<{ match: RegExp; specs: string }> = [
  { match: /steel|metal|aluminum|alloy|stainless|bracket|plate|bar|sheet/i, specs: 'grade/alloy, dimensions and tolerances, finish/coating, and any certification (e.g. mill test report)' },
  { match: /pump|motor|valve|bearing|gearbox|actuator/i, specs: 'flow/pressure or power rating, voltage/phase, port/mount size, duty cycle, and required certifications' },
  { match: /pipe|fitting|tube|hose|conduit/i, specs: 'material, schedule/pressure class, diameter, length, and connection type' },
  { match: /pcb|electronic|sensor|controller|cable|connector/i, specs: 'part/manufacturer number, operating range, connector/pinout, and RoHS/compliance' },
  { match: /packaging|carton|pallet|crate|label/i, specs: 'dimensions, material/wall, print/artwork, and stacking or weight limits' },
  { match: /chemical|resin|coating|adhesive|lubricant/i, specs: 'grade/spec, concentration, pack size, SDS, and shelf-life requirements' },
];

function daysUntil(date?: string): number | null {
  if (!date) return null;
  const parsed = Date.parse(date);
  if (Number.isNaN(parsed)) return null;
  return Math.round((parsed - Date.now()) / 86_400_000);
}

export function analyzeRfq(input: RfqAdvisorInput): RfqAdvice {
  const suggestions: RfqSuggestion[] = [];
  const items = input.items ?? [];

  if (!input.title || input.title.trim().length < 4) {
    suggestions.push({ code: 'title_missing', severity: 'warning', field: 'title', message: 'Give the RFQ a clear, specific title so suppliers and your team can identify it at a glance.', suggestion: items[0]?.itemName ? `${items[0].itemName} — request for quote` : undefined });
  }
  if (!input.neededBy) {
    suggestions.push({ code: 'needed_by_missing', severity: 'warning', field: 'neededBy', message: 'Add a needed-by date. Without a deadline, suppliers quote conservative lead times and responses drift.' });
  } else {
    const days = daysUntil(input.neededBy);
    if (days !== null && days >= 0 && days < 5) {
      suggestions.push({ code: 'needed_by_tight', severity: 'info', field: 'neededBy', message: `Your needed-by date is ${days} day(s) out. Flag urgency in the request and confirm expedite options and any rush fees.` });
    }
  }
  if (!input.deliveryLocation) {
    suggestions.push({ code: 'delivery_missing', severity: 'info', field: 'deliveryLocation', message: 'Add a delivery location so suppliers can quote accurate freight instead of excluding it.' });
  }
  if (!input.description || input.description.trim().length < 20) {
    suggestions.push({ code: 'context_thin', severity: 'info', field: 'description', message: 'Add a sentence of context (application, environment, or quality expectations). Better context yields more comparable quotes.' });
  } else if (VAGUE.test(input.description)) {
    suggestions.push({ code: 'context_vague', severity: 'warning', field: 'description', message: 'The description contains vague language ("standard", "TBD", "as needed"). Replace it with measurable requirements to avoid inconsistent quotes.' });
  }

  if (items.length === 0) {
    suggestions.push({ code: 'no_items', severity: 'warning', field: 'items', message: 'Add at least one line item with a quantity and unit so suppliers can price the request.' });
  }
  items.forEach((item, index) => {
    const label = item.itemName || `Item ${index + 1}`;
    if (!item.quantity || item.quantity <= 0) {
      suggestions.push({ code: 'item_quantity', severity: 'warning', field: `items[${index}].quantity`, message: `"${label}" is missing a quantity. Suppliers need quantities to quote unit pricing and price breaks.` });
    }
    if (!item.unit) {
      suggestions.push({ code: 'item_unit', severity: 'info', field: `items[${index}].unit`, message: `Specify a unit of measure for "${label}" (ea, kg, m, box) to prevent quantity ambiguity.` });
    }
    if (!item.description || item.description.trim().length < 6) {
      const hint = SPEC_HINTS.find((h) => h.match.test(label));
      suggestions.push({ code: 'item_spec', severity: 'info', field: `items[${index}].description`, message: `Add specifications for "${label}"${hint ? `: include ${hint.specs}.` : '. Include the details a supplier needs to quote exactly what you require.'}`, suggestion: hint ? `${label}: specify ${hint.specs}.` : undefined });
    } else if (VAGUE.test(item.description)) {
      suggestions.push({ code: 'item_vague', severity: 'warning', field: `items[${index}].description`, message: `"${label}" uses vague wording. Replace it with concrete, measurable requirements.` });
    }
  });

  if ((input.supplierCount ?? 0) > 0 && (input.supplierCount ?? 0) < 3) {
    suggestions.push({ code: 'coverage_low', severity: 'info', field: 'suppliers', message: 'Invite at least three suppliers. Two quotes is a coin flip; three or more gives you a real basis for comparison.' });
  }

  const warnings = suggestions.filter((s) => s.severity === 'warning').length;
  const infos = suggestions.length - warnings;
  const score = Math.max(0, Math.min(100, 100 - warnings * 18 - infos * 6));
  return { score, readyToSend: warnings === 0, suggestions };
}
