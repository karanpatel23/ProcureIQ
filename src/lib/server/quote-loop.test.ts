import { describe, expect, it } from 'vitest';
import { runQuoteIngestionLoop, runQuoteComparisonLoop, type ComparisonView } from './quote-loop';

const WORKSPACE = 'wsp_test';
const f = (value: unknown, confidence = 80) => ({ value, confidence });

describe('Quote Ingestion Loop', () => {
  it('derives a missing total from line items (safe) but never invents one it cannot derive', () => {
    const out = runQuoteIngestionLoop({
      workspaceId: WORKSPACE,
      quote: { fields: { paymentTerms: f('Net 30') }, lineItems: [{ quantity: 10, unitPrice: 100, extendedPrice: 1000 }], rfqItemCount: 1, confidenceScore: 85 },
    });
    expect((out.verifiedFields.totalPrice as { value: number }).value).toBe(1000);
    // the derived value carries low confidence so a human knows it was inferred
    expect((out.verifiedFields.totalPrice as { confidence: number }).confidence).toBeLessThan(60);

    const noData = runQuoteIngestionLoop({ workspaceId: WORKSPACE, quote: { fields: {}, lineItems: [], rfqItemCount: 1, confidenceScore: 85 } });
    expect(noData.verifiedFields.totalPrice).toBeUndefined();
    expect(noData.openItems.some((o) => o.field === 'totalPrice')).toBe(true);
  });

  it('flags a line-item vs stated-total mismatch as an open item', () => {
    const out = runQuoteIngestionLoop({
      workspaceId: WORKSPACE,
      quote: { fields: { totalPrice: f(2000) }, lineItems: [{ quantity: 10, unitPrice: 100, extendedPrice: 1000 }], rfqItemCount: 1, confidenceScore: 90 },
    });
    expect(out.openItems.some((o) => /sum to 1000 but the stated total is 2000/.test(o.message))).toBe(true);
    expect(out.readyForComparison).toBe(false);
  });

  it('flags expired validity, low confidence, and incomplete item coverage', () => {
    const out = runQuoteIngestionLoop({
      workspaceId: WORKSPACE,
      quote: { fields: { totalPrice: f(1000), validUntil: f('2000-01-01') }, lineItems: [{ quantity: 1, unitPrice: 1000, extendedPrice: 1000 }], rfqItemCount: 3, confidenceScore: 40 },
    });
    const fields = out.openItems.map((o) => o.field);
    expect(fields).toContain('validUntil');
    expect(fields).toContain('confidence');
    expect(fields).toContain('lineItems');
    expect(out.run.type).toBe('quote_ingestion');
    expect(out.run.status).toBe('awaiting_approval');
  });

  it('a complete, consistent quote is ready for comparison', () => {
    const out = runQuoteIngestionLoop({
      workspaceId: WORKSPACE,
      quote: { fields: { totalPrice: f(1000), estimatedLeadTime: f('12 days'), paymentTerms: f('Net 30'), freightTerms: f('Included'), validUntil: f('2099-01-01') }, lineItems: [{ quantity: 10, unitPrice: 100, extendedPrice: 1000 }], rfqItemCount: 1, confidenceScore: 90 },
    });
    expect(out.readyForComparison).toBe(true);
    expect(out.openItems.filter((o) => o.severity === 'warning')).toHaveLength(0);
  });
});

describe('Quote Comparison Loop', () => {
  const view: ComparisonView = {
    quotes: [
      { supplierName: 'Northline', totalPrice: 18420, leadTime: '12 days', paymentTerms: 'Net 30', freightTerms: 'Included', confidence: 92, score: 88, risks: [] },
      { supplierName: 'Atlas', totalPrice: 17980, leadTime: '18 days', paymentTerms: null, freightTerms: null, confidence: 88, score: 74, risks: [{ label: 'Missing payment terms', severity: 'medium' }] },
      { supplierName: 'Rapid', totalPrice: 26900, leadTime: '7 days', paymentTerms: 'Net 45', freightTerms: 'Collect', confidence: 48, score: 55, risks: [{ label: 'Low extraction confidence', severity: 'high' }] },
    ],
    recommendation: { overall: { supplierName: 'Northline', score: 88 }, lowestCost: { supplierName: 'Atlas' }, fastest: { supplierName: 'Rapid' }, needsReview: false, confidence: 88, reasons: ['Northline has the strongest combined score.'], tradeoffs: [] },
  };

  it('summarizes tradeoffs per supplier instead of just picking the cheapest', () => {
    const out = runQuoteComparisonLoop({ workspaceId: WORKSPACE, comparison: view });
    const atlas = out.tradeoffs.find((t) => t.supplierName === 'Atlas')!;
    expect(atlas.summary).toMatch(/below average price/);
    expect(atlas.summary).toMatch(/payment terms missing/);
    // recommendation is NOT the cheapest (Atlas) — it's the strongest overall (Northline)
    expect(out.tradeoffs.find((t) => t.recommended)?.supplierName).toBe('Northline');
    expect(out.headline).toContain('Northline');
    expect(out.headline).toMatch(/human must approve/i);
  });

  it('surfaces low-confidence / high-risk quotes as open items and never auto-selects', () => {
    const out = runQuoteComparisonLoop({ workspaceId: WORKSPACE, comparison: view });
    expect(out.openItems.some((o) => o.field === 'Rapid')).toBe(true);
    expect(out.run.status).toBe('awaiting_approval'); // human must approve the selection
    expect(out.run.type).toBe('quote_comparison');
  });
});
