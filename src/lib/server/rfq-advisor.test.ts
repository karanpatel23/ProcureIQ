import { describe, expect, it } from 'vitest';
import { analyzeRfq } from './rfq-advisor';

describe('analyzeRfq', () => {
  it('flags a thin RFQ with missing structural fields', () => {
    const advice = analyzeRfq({ title: '', items: [] });
    const codes = advice.suggestions.map((s) => s.code);
    expect(codes).toEqual(expect.arrayContaining(['title_missing', 'needed_by_missing', 'no_items']));
    expect(advice.readyToSend).toBe(false);
    expect(advice.score).toBeLessThan(70);
  });

  it('flags vague requirement language', () => {
    const advice = analyzeRfq({ title: 'Bracket order', neededBy: '2099-01-01', deliveryLocation: 'Plant 2', description: 'Standard quality, TBD details as needed', items: [{ itemName: 'Bracket', quantity: 10, unit: 'ea', description: 'good quality standard part' }] });
    const codes = advice.suggestions.map((s) => s.code);
    expect(codes).toContain('context_vague');
    expect(codes).toContain('item_vague');
  });

  it('offers category-aware spec prompts and item suggestions', () => {
    const advice = analyzeRfq({ title: 'Pump order', neededBy: '2099-01-01', deliveryLocation: 'Plant 2', description: 'Replacement centrifugal pump for the coolant loop.', items: [{ itemName: 'Centrifugal pump', quantity: 2, unit: 'ea' }] });
    const spec = advice.suggestions.find((s) => s.code === 'item_spec');
    expect(spec?.suggestion).toMatch(/flow|pressure|rating/i);
  });

  it('marks a complete, specific RFQ as ready to send', () => {
    const advice = analyzeRfq({
      title: 'Conveyor guard brackets — RFQ',
      neededBy: '2099-01-01',
      deliveryLocation: 'Apex Plant 2, Ohio',
      description: 'Powder-coated steel guard brackets for conveyor line 3, per drawing CG-204 rev B.',
      items: [{ itemName: 'Guard bracket', quantity: 20, unit: 'ea', description: 'A36 steel, 6mm, powder-coated black, per drawing CG-204' }],
      supplierCount: 3,
    });
    expect(advice.readyToSend).toBe(true);
    expect(advice.score).toBeGreaterThanOrEqual(88);
  });

  it('warns on a tight lead time and thin supplier coverage', () => {
    const soon = new Date(Date.now() + 2 * 86_400_000).toISOString().slice(0, 10);
    const advice = analyzeRfq({ title: 'Rush order for brackets', neededBy: soon, deliveryLocation: 'Plant 2', description: 'Urgent replacement brackets for line 3 downtime.', items: [{ itemName: 'Bracket', quantity: 5, unit: 'ea', description: 'A36 steel 6mm powder coated' }], supplierCount: 2 });
    const codes = advice.suggestions.map((s) => s.code);
    expect(codes).toContain('needed_by_tight');
    expect(codes).toContain('coverage_low');
  });
});
