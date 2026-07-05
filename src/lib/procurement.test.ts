import { describe, expect, it } from 'vitest';
import { createPoDraft } from './procurement';

describe('createPoDraft', () => {
  it('keeps AI output in draft status with source traceability', () => {
    const draft = createPoDraft({
      requestId: 'rfq-1001',
      buyerTeam: 'Industrial purchasing',
      supplierName: 'Northline Metals',
      currency: 'USD',
      lines: [{
        sku: 'AL-42',
        description: 'Aluminum rail extrusion',
        quantity: 20,
        unitPrice: 115,
        leadTimeDays: 14,
        source: { documentId: 'quote-email-7', page: 1, excerpt: 'AL-42 quoted at $115 with 14 day lead time.' },
      }],
    });

    expect(draft.status).toBe('draft_requires_human_approval');
    expect(draft.approvalRequired).toBe(true);
    expect(draft.subtotal).toBe(2300);
    expect(draft.traceability[0]?.documentId).toBe('quote-email-7');
  });
});
