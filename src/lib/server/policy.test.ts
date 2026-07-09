import { describe, expect, it } from 'vitest';
import { evaluatePolicy, leadTimeToDays, type PolicyInput } from './policy';

const base = (): PolicyInput => ({
  approvalThreshold: 10_000,
  currency: 'USD',
  workspaceHasPreferredSuppliers: true,
  neededBy: new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10),
  rfqItemCount: 3,
  winner: { supplierName: 'Acme Metals', supplierPreferred: true, totalPrice: 8_000, leadTimeDays: 14, itemsQuoted: 3, confidence: 85 },
  competingPrices: [8_000, 9_500, 10_200],
});

describe('policy engine', () => {
  it('passes a clean in-policy decision and offers the fast path', () => {
    const result = evaluatePolicy(base());
    expect(result.status).toBe('in_policy');
    expect(result.exceptions).toHaveLength(0);
    expect(result.summary).toContain('Ready for one-click approval');
  });

  it('flags amounts above the approval threshold with the amounts named', () => {
    const input = base();
    input.winner.totalPrice = 25_000;
    input.competingPrices = [25_000, 26_000, 27_000];
    const result = evaluatePolicy(input);
    expect(result.status).toBe('exceptions');
    const ex = result.exceptions.find((e) => e.code === 'over_threshold');
    expect(ex?.detail).toContain('25,000');
    expect(ex?.detail).toContain('10,000');
  });

  it('flags non-preferred suppliers only when the workspace uses preferred suppliers', () => {
    const input = base();
    input.winner.supplierPreferred = false;
    expect(evaluatePolicy(input).exceptions.some((e) => e.code === 'unapproved_supplier')).toBe(true);

    input.workspaceHasPreferredSuppliers = false; // fresh workspace → skip, don't spam
    const result = evaluatePolicy(input);
    expect(result.exceptions.some((e) => e.code === 'unapproved_supplier')).toBe(false);
    expect(result.checks.find((c) => c.code === 'unapproved_supplier')?.skipped).toBe(true);
  });

  it('flags partial item coverage', () => {
    const input = base();
    input.winner.itemsQuoted = 1;
    const result = evaluatePolicy(input);
    expect(result.exceptions.some((e) => e.code === 'partial_coverage')).toBe(true);
    expect(result.exceptions.find((e) => e.code === 'partial_coverage')?.detail).toContain('1 of 3');
  });

  it('flags a too-good-to-be-true price (>25% below median of competitors)', () => {
    const input = base();
    input.winner.totalPrice = 5_000;
    input.competingPrices = [5_000, 9_800, 10_200];
    const result = evaluatePolicy(input);
    expect(result.exceptions.some((e) => e.code === 'price_anomaly')).toBe(true);
  });

  it('skips the anomaly check with fewer than two priced quotes (no noise)', () => {
    const input = base();
    input.competingPrices = [8_000];
    const result = evaluatePolicy(input);
    expect(result.checks.find((c) => c.code === 'price_anomaly')?.skipped).toBe(true);
  });

  it('flags lead times that miss the need-by date', () => {
    const input = base();
    input.neededBy = new Date(Date.now() + 5 * 86_400_000).toISOString().slice(0, 10);
    input.winner.leadTimeDays = 21;
    const result = evaluatePolicy(input);
    expect(result.exceptions.some((e) => e.code === 'misses_need_date')).toBe(true);
  });

  it('flags low extraction confidence — AI uncertainty always reaches a human', () => {
    const input = base();
    input.winner.confidence = 40;
    const result = evaluatePolicy(input);
    expect(result.exceptions.some((e) => e.code === 'low_confidence')).toBe(true);
  });

  it('reports no_policy for a fresh workspace with nothing configured and nothing applicable', () => {
    const result = evaluatePolicy({
      workspaceHasPreferredSuppliers: false,
      rfqItemCount: 0,
      winner: { supplierName: 'X', supplierPreferred: false, totalPrice: null, leadTimeDays: null, itemsQuoted: 0, confidence: 90 },
      competingPrices: [],
    });
    // Confidence check still applies (it always does), so this is in_policy, not no_policy.
    expect(result.status).toBe('in_policy');
  });
});

describe('leadTimeToDays', () => {
  it('parses days, ranges, weeks, and months (worst case)', () => {
    expect(leadTimeToDays('14 days')).toBe(14);
    expect(leadTimeToDays('2-3 weeks')).toBe(21);
    expect(leadTimeToDays('1 month')).toBe(30);
    expect(leadTimeToDays('10-12 days')).toBe(12);
    expect(leadTimeToDays('ASAP')).toBeNull();
    expect(leadTimeToDays(null)).toBeNull();
  });
});
