import { describe, expect, it } from 'vitest';
import { parseSupplierCsv } from './csv-import';

describe('supplier CSV import', () => {
  it('maps QuickBooks-style vendor headers and quoted fields', () => {
    const csv = 'Vendor,Main Email,Main Phone,Terms\n"Acme Metals, Inc.",sales@acme.com,555-0101,Net 30\nBeta Industrial,,555-0102,';
    const result = parseSupplierCsv(csv);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]).toMatchObject({ name: 'Acme Metals, Inc.', email: 'sales@acme.com', paymentTerms: 'Net 30' });
    expect(result.headerMap.name).toBe('Vendor');
  });

  it('skips bad rows with named reasons instead of guessing', () => {
    const csv = 'Name,Email\nGood Supplier,ok@x.com\n,missing@x.com\nBad Email,not-an-email\nGood Supplier,dupe@x.com';
    const result = parseSupplierCsv(csv);
    expect(result.rows).toHaveLength(1);
    expect(result.skipped).toHaveLength(3);
    expect(result.skipped.map((s) => s.reason).join(' ')).toMatch(/name.*invalid email.*Duplicate/is);
  });

  it('reports an unusable file when no name column exists', () => {
    const result = parseSupplierCsv('Amount,Date\n100,2026-01-01');
    expect(result.rows).toHaveLength(0);
    expect(result.skipped[0].reason).toContain('No supplier-name column');
  });
});
