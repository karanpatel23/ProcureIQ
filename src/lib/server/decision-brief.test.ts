import { describe, expect, it } from 'vitest';
import { buildDecisionBrief, type DecisionBriefInput } from './decision-brief';
import { evaluatePolicy } from './policy';

const input = (over: Partial<DecisionBriefInput> = {}): DecisionBriefInput => ({
  rfqTitle: 'Bracket Package',
  currency: 'USD',
  confidence: 82,
  quotes: [
    { supplierName: 'Acme Metals', totalPrice: 18420, leadTime: '12 days', paymentTerms: 'Net 30', recommended: true },
    { supplierName: 'Beta Industrial', totalPrice: 17980, leadTime: '18 days', paymentTerms: null, recommended: false },
  ],
  policy: evaluatePolicy({
    approvalThreshold: 50000, currency: 'USD', workspaceHasPreferredSuppliers: false, rfqItemCount: 1,
    winner: { supplierName: 'Acme Metals', supplierPreferred: false, totalPrice: 18420, leadTimeDays: 12, itemsQuoted: 1, confidence: 90 },
    competingPrices: [18420, 17980],
  }),
  ...over,
});

describe('decision brief', () => {
  it('writes five plain-language lines with the real numbers', () => {
    const brief = buildDecisionBrief(input());
    expect(brief.lines).toHaveLength(5);
    expect(brief.lines[0]).toContain('Acme Metals');
    expect(brief.lines[1]).toContain('18,420');
    expect(brief.lines[1]).toContain('17,980'); // names the cheaper rival
    expect(brief.lines[3]).toMatch(/Policy: all \d+ purchasing-policy checks passed/);
  });

  it('states policy exceptions verbatim when out of policy', () => {
    const withExceptions = input();
    withExceptions.policy = evaluatePolicy({
      approvalThreshold: 10000, currency: 'USD', workspaceHasPreferredSuppliers: false, rfqItemCount: 1,
      winner: { supplierName: 'Acme Metals', supplierPreferred: false, totalPrice: 18420, leadTimeDays: 12, itemsQuoted: 1, confidence: 90 },
      competingPrices: [18420, 17980],
    });
    const brief = buildDecisionBrief(withExceptions);
    expect(brief.lines[3]).toContain('exception');
    expect(brief.lines[3]).toContain('threshold');
  });

  it('drafts a counter-offer citing the real price gap when the winner is not cheapest', () => {
    const brief = buildDecisionBrief(input());
    expect(brief.negotiation).not.toBeNull();
    expect(brief.negotiation!.toSupplier).toBe('Acme Metals');
    expect(brief.negotiation!.leverage).toContain('Beta Industrial');
    expect(brief.negotiation!.body).toContain('17,980');
    expect(brief.negotiation!.body).toContain('Bracket Package');
  });

  it('refuses to invent leverage when none exists (single quote)', () => {
    const single = input({ quotes: [{ supplierName: 'Acme Metals', totalPrice: 18420, leadTime: '12 days', paymentTerms: 'Net 30', recommended: true }] });
    const brief = buildDecisionBrief(single);
    expect(brief.negotiation).toBeNull();
    expect(brief.lines[4]).toBe('Next: approve to draft the PO.');
  });

  it('uses lead-time leverage when the winner is cheapest but slower', () => {
    const brief = buildDecisionBrief(input({
      quotes: [
        { supplierName: 'Acme Metals', totalPrice: 17000, leadTime: '30 days', paymentTerms: 'Net 30', recommended: true },
        { supplierName: 'Beta Industrial', totalPrice: 17980, leadTime: '10 days', paymentTerms: null, recommended: false },
      ],
    }));
    expect(brief.negotiation).not.toBeNull();
    expect(brief.negotiation!.body).toMatch(/day\(s\) faster/);
  });
});
