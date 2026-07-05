import { describe, expect, it } from 'vitest';
import { buildRfqComparison } from './comparison';
import { emptyDatabase, type Database, type Rfq } from './schema';

const T = '2026-01-01T00:00:00.000Z';
const workspaceId = 'wsp_test';

type FieldMap = Record<string, { value: unknown }>;

function seedRfq(db: Database, itemCount = 2): Rfq {
  const rfq: Rfq = { id: 'rfq_1', workspaceId, createdByUserId: 'usr_1', title: 'Hydraulic pump assemblies', supplierIds: [], status: 'sent', createdAt: T, updatedAt: T };
  db.rfqs.push(rfq);
  for (let i = 1; i <= itemCount; i += 1) {
    db.rfqItems.push({ id: `rfi_${i}`, workspaceId, rfqId: rfq.id, itemName: `Pump item ${i}`, quantity: 10, unit: 'ea', createdAt: T });
  }
  return rfq;
}

function addSupplierQuote(db: Database, input: { supplierId: string; supplierName: string; quoteId: string; confidence: number; fields: FieldMap; lines?: Array<{ quantity: number; unitPrice: number }> }) {
  db.suppliers.push({ id: input.supplierId, workspaceId, name: input.supplierName, status: 'active', createdAt: T, updatedAt: T });
  db.supplierQuotes.push({ id: input.quoteId, workspaceId, rfqId: 'rfq_1', supplierId: input.supplierId, status: 'accepted', extractionStatus: 'approved', currency: 'USD', confidenceScore: input.confidence, reviewedFields: input.fields, createdAt: T, updatedAt: T });
  (input.lines ?? []).forEach((line, index) => {
    db.quoteLineItems.push({ id: `qli_${input.quoteId}_${index}`, workspaceId, supplierQuoteId: input.quoteId, rfqItemId: `rfi_${index + 1}`, description: `Pump item ${index + 1}`, quantity: line.quantity, unitPrice: line.unitPrice, createdAt: T });
  });
}

describe('buildRfqComparison with realistic multi-supplier data', () => {
  function buildRealisticDb() {
    const db = emptyDatabase();
    const rfq = seedRfq(db, 2);

    // Complete, well-documented quote: mid price, mid lead time, full terms.
    addSupplierQuote(db, {
      supplierId: 'sup_precision', supplierName: 'Precision Flow Systems', quoteId: 'quote_precision', confidence: 92,
      fields: {
        totalPrice: { value: 24800 }, estimatedLeadTime: { value: '15 days' }, paymentTerms: { value: 'Net 30' },
        freightTerms: { value: 'FOB destination, freight included' }, validUntil: { value: '2099-03-01' },
      },
      lines: [{ quantity: 10, unitPrice: 1480 }, { quantity: 10, unitPrice: 1000 }],
    });

    // Lowest price but incomplete: missing payment terms, freight exception in notes.
    addSupplierQuote(db, {
      supplierId: 'sup_baltic', supplierName: 'Baltic Components', quoteId: 'quote_baltic', confidence: 88,
      fields: {
        totalPrice: { value: 21400 }, estimatedLeadTime: { value: '30 days' }, validUntil: { value: '2099-02-01' },
        notes: { value: 'Freight not included. Substitution: alternate housing available on request.' },
      },
      lines: [{ quantity: 10, unitPrice: 1240 }, { quantity: 10, unitPrice: 900 }],
    });

    // Fastest lead time but expired, low extraction confidence, and one line item missing.
    addSupplierQuote(db, {
      supplierId: 'sup_rapid', supplierName: 'Rapid Industrial', quoteId: 'quote_rapid', confidence: 48,
      fields: {
        totalPrice: { value: 26900 }, estimatedLeadTime: { value: '7 days' }, paymentTerms: { value: 'Net 45' },
        freightTerms: { value: 'Freight collect' }, validUntil: { value: '2025-11-01' },
      },
      lines: [{ quantity: 10, unitPrice: 2690 }],
    });

    return { db, rfq };
  }

  it('identifies lowest cost, fastest lead, and the strongest overall pick', () => {
    const { db, rfq } = buildRealisticDb();
    const comparison = buildRfqComparison(db, rfq);

    expect(comparison.quotes).toHaveLength(3);
    expect(comparison.recommendation?.lowestCost.supplierName).toBe('Baltic Components');
    expect(comparison.recommendation?.fastest.supplierName).toBe('Rapid Industrial');
    expect(comparison.recommendation?.overall.supplierName).toBe('Precision Flow Systems');
  });

  it('flags the incomplete quote for missing terms and freight exceptions without inventing values', () => {
    const { db, rfq } = buildRealisticDb();
    const comparison = buildRfqComparison(db, rfq);
    const baltic = comparison.quotes.find((quote) => quote.supplierName === 'Baltic Components')!;

    expect(baltic.paymentTerms).toBeNull();
    expect(baltic.freightTerms).toBeNull();
    const codes = baltic.risks.map((risk) => risk.code);
    expect(codes).toContain('missing_payment_terms');
    expect(codes).toContain('missing_freight');
    expect(codes).toContain('notes_exclusions');
  });

  it('marks the expired low-confidence quote as high risk with a missing line item', () => {
    const { db, rfq } = buildRealisticDb();
    const comparison = buildRfqComparison(db, rfq);
    const rapid = comparison.quotes.find((quote) => quote.supplierName === 'Rapid Industrial')!;

    const byCode = Object.fromEntries(rapid.risks.map((risk) => [risk.code, risk]));
    expect(byCode.expired_quote?.severity).toBe('high');
    expect(byCode.low_confidence?.severity).toBe('high');
    expect(byCode.missing_item).toBeDefined();
  });

  it('does not require human review when the recommended quote is complete and confident', () => {
    const { db, rfq } = buildRealisticDb();
    const comparison = buildRfqComparison(db, rfq);

    expect(comparison.recommendation?.needsReview).toBe(false);
    expect(comparison.recommendation?.confidence).toBeGreaterThan(60);
  });
});

describe('buildRfqComparison guardrails', () => {
  it('returns no recommendation when an RFQ has no quotes', () => {
    const db = emptyDatabase();
    const rfq = seedRfq(db);
    const comparison = buildRfqComparison(db, rfq);

    expect(comparison.quotes).toHaveLength(0);
    expect(comparison.recommendation).toBeNull();
  });

  it('requires human review when the only quote is missing price, lead time, and terms', () => {
    const db = emptyDatabase();
    const rfq = seedRfq(db, 1);
    addSupplierQuote(db, {
      supplierId: 'sup_sparse', supplierName: 'Sparse Metals', quoteId: 'quote_sparse', confidence: 41,
      fields: { notes: { value: 'Quote to follow pending drawings.' } },
    });

    const comparison = buildRfqComparison(db, rfq);
    const sparse = comparison.quotes[0];
    const codes = sparse.risks.map((risk) => risk.code);

    expect(sparse.totalPrice).toBeNull();
    expect(codes).toEqual(expect.arrayContaining(['missing_total_price', 'missing_lead_time', 'missing_payment_terms', 'missing_freight', 'missing_validity', 'low_confidence']));
    expect(comparison.recommendation?.needsReview).toBe(true);
  });

  it('flags significant price variance across suppliers', () => {
    const db = emptyDatabase();
    const rfq = seedRfq(db, 1);
    addSupplierQuote(db, {
      supplierId: 'sup_a', supplierName: 'Fair Price Co', quoteId: 'quote_a', confidence: 90,
      fields: { totalPrice: { value: 10000 }, estimatedLeadTime: { value: '10 days' }, paymentTerms: { value: 'Net 30' }, freightTerms: { value: 'Included' }, validUntil: { value: '2099-01-01' } },
      lines: [{ quantity: 10, unitPrice: 1000 }],
    });
    addSupplierQuote(db, {
      supplierId: 'sup_b', supplierName: 'Premium Price Co', quoteId: 'quote_b', confidence: 90,
      fields: { totalPrice: { value: 17000 }, estimatedLeadTime: { value: '10 days' }, paymentTerms: { value: 'Net 30' }, freightTerms: { value: 'Included' }, validUntil: { value: '2099-01-01' } },
      lines: [{ quantity: 10, unitPrice: 1700 }],
    });

    const comparison = buildRfqComparison(db, rfq);
    const premium = comparison.quotes.find((quote) => quote.supplierName === 'Premium Price Co')!;
    expect(premium.risks.map((risk) => risk.code)).toContain('price_variance');
  });

  it('falls back to line-item totals when the total price field is missing', () => {
    const db = emptyDatabase();
    const rfq = seedRfq(db, 1);
    addSupplierQuote(db, {
      supplierId: 'sup_lines', supplierName: 'Line Item Supply', quoteId: 'quote_lines', confidence: 85,
      fields: { estimatedLeadTime: { value: '12 days' }, paymentTerms: { value: 'Net 30' }, freightTerms: { value: 'Included' }, validUntil: { value: '2099-01-01' } },
      lines: [{ quantity: 10, unitPrice: 250 }],
    });

    const comparison = buildRfqComparison(db, rfq);
    expect(comparison.quotes[0].totalPrice).toBe(2500);
  });
});
