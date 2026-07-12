/*
 * Supplier CSV import — accepts a QuickBooks vendor export (or any CSV with a
 * name column) and returns row-level results. Same honesty contract as quote
 * extraction: rows that can't be mapped are reported with reasons, never
 * silently dropped or guessed.
 */
export type CsvSupplierRow = { name: string; email?: string; phone?: string; website?: string; category?: string; paymentTerms?: string; preferred?: boolean };
export type CsvParseResult = { rows: CsvSupplierRow[]; skipped: Array<{ line: number; reason: string }>; headerMap: Record<string, string> };

/** Minimal RFC-4180 CSV parser: quoted fields, embedded commas/newlines, CRLF. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], field = '', inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some((cell) => cell.trim() !== '')) rows.push(row);
      row = [];
    } else field += c;
  }
  row.push(field);
  if (row.some((cell) => cell.trim() !== '')) rows.push(row);
  return rows;
}

// Header aliases: QuickBooks vendor exports use "Vendor"/"Company"/"Main Email"…
const HEADER_ALIASES: Record<string, string[]> = {
  name: ['name', 'vendor', 'vendor name', 'company', 'company name', 'supplier', 'supplier name', 'display name', 'full name'],
  email: ['email', 'main email', 'e-mail', 'email address'],
  phone: ['phone', 'main phone', 'phone number', 'work phone', 'mobile'],
  website: ['website', 'web site', 'url'],
  category: ['category', 'type', 'vendor type', 'account'],
  paymentTerms: ['payment terms', 'terms'],
  preferred: ['preferred', 'preferred vendor'],
};

export function parseSupplierCsv(text: string): CsvParseResult {
  const grid = parseCsv(text);
  if (!grid.length) return { rows: [], skipped: [], headerMap: {} };
  const headers = grid[0].map((h) => h.trim().toLowerCase());
  const headerMap: Record<string, string> = {};
  const col: Record<string, number> = {};
  for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
    const idx = headers.findIndex((h) => aliases.includes(h));
    if (idx >= 0) { col[field] = idx; headerMap[field] = grid[0][idx].trim(); }
  }
  if (col.name === undefined) {
    return { rows: [], skipped: [{ line: 1, reason: `No supplier-name column found. Expected a header like "Vendor", "Name", or "Company" — got: ${grid[0].slice(0, 6).join(', ')}` }], headerMap };
  }

  const rows: CsvSupplierRow[] = [];
  const skipped: Array<{ line: number; reason: string }> = [];
  const seen = new Set<string>();
  for (let i = 1; i < grid.length; i++) {
    const cells = grid[i];
    const name = (cells[col.name] ?? '').trim();
    if (name.length < 2) { skipped.push({ line: i + 1, reason: 'Missing or too-short supplier name.' }); continue; }
    if (seen.has(name.toLowerCase())) { skipped.push({ line: i + 1, reason: `Duplicate of "${name}" earlier in the file.` }); continue; }
    seen.add(name.toLowerCase());
    const get = (field: string) => (col[field] !== undefined ? (cells[col[field]] ?? '').trim() || undefined : undefined);
    const email = get('email');
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { skipped.push({ line: i + 1, reason: `"${name}": invalid email "${email}".` }); continue; }
    rows.push({ name: name.slice(0, 160), email, phone: get('phone')?.slice(0, 60), website: get('website')?.slice(0, 200), category: get('category')?.slice(0, 120), paymentTerms: get('paymentTerms')?.slice(0, 160), preferred: /^(y|yes|true|1)$/i.test(get('preferred') ?? '') });
  }
  return { rows: rows.slice(0, 500), skipped, headerMap };
}
