/*
 * Purchasing policy engine — the core of "humans only touch the exceptions."
 *
 * Evaluates a draft supplier decision against the workspace's policy and
 * returns named, human-readable exceptions. In-policy decisions get a
 * one-click fast path; out-of-policy decisions surface ONLY the exceptions,
 * so the approver reads three lines instead of re-checking a whole matrix.
 *
 * Design rules (see state/DECISIONS.md):
 * - Opinionated defaults, not a workflow builder.
 * - Checks that don't apply are skipped, not failed — a policy that flags
 *   everything is noise, and noise kills the exception-only claim.
 * - Pure and deterministic: same inputs, same verdict, fully testable.
 */

export type PolicyCheckCode =
  | 'over_threshold'
  | 'unapproved_supplier'
  | 'partial_coverage'
  | 'price_anomaly'
  | 'misses_need_date'
  | 'low_confidence';

export type PolicyCheck = { code: PolicyCheckCode; label: string; pass: boolean; skipped?: boolean; detail?: string };
export type PolicyException = { code: PolicyCheckCode; title: string; detail: string };
export type PolicyResult = {
  status: 'in_policy' | 'exceptions' | 'no_policy';
  checks: PolicyCheck[];
  exceptions: PolicyException[];
  summary: string;
};

export type PolicyInput = {
  // Workspace policy
  approvalThreshold?: number;
  currency?: string;
  workspaceHasPreferredSuppliers: boolean;
  // RFQ context
  neededBy?: string;
  rfqItemCount: number;
  // The candidate decision (usually the recommended quote)
  winner: {
    supplierName: string;
    supplierPreferred: boolean;
    totalPrice: number | null;
    leadTimeDays: number | null;
    itemsQuoted: number;
    confidence: number;
  };
  // All competing quote totals (winner included) for anomaly detection
  competingPrices: number[];
};

const median = (values: number[]): number | null => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

const money = (value: number, currency?: string) => `${currency ? `${currency} ` : ''}${Math.round(value).toLocaleString()}`;

export function evaluatePolicy(input: PolicyInput): PolicyResult {
  const checks: PolicyCheck[] = [];
  const exceptions: PolicyException[] = [];
  const { winner } = input;

  // 1. Approval threshold — the workspace's own "requires sign-off above" line.
  if (input.approvalThreshold && input.approvalThreshold > 0 && winner.totalPrice !== null) {
    const over = winner.totalPrice > input.approvalThreshold;
    checks.push({ code: 'over_threshold', label: `Amount vs approval threshold (${money(input.approvalThreshold, input.currency)})`, pass: !over });
    if (over) exceptions.push({ code: 'over_threshold', title: 'Above your approval threshold', detail: `${money(winner.totalPrice, input.currency)} exceeds the ${money(input.approvalThreshold, input.currency)} threshold set in company policy — this order needs explicit sign-off.` });
  } else {
    checks.push({ code: 'over_threshold', label: 'Amount vs approval threshold', pass: true, skipped: true, detail: input.approvalThreshold ? 'No total price to check.' : 'No approval threshold set in company settings.' });
  }

  // 2. Preferred supplier — only enforced once the workspace actually marks
  // preferred suppliers, so a fresh workspace is never spammed with flags.
  if (input.workspaceHasPreferredSuppliers) {
    checks.push({ code: 'unapproved_supplier', label: 'Preferred supplier', pass: winner.supplierPreferred });
    if (!winner.supplierPreferred) exceptions.push({ code: 'unapproved_supplier', title: 'Not a preferred supplier', detail: `${winner.supplierName} is not marked as a preferred supplier. Confirm they are approved to buy from.` });
  } else {
    checks.push({ code: 'unapproved_supplier', label: 'Preferred supplier', pass: true, skipped: true, detail: 'No preferred suppliers marked yet.' });
  }

  // 3. Item coverage — a cheap quote that only covers half the RFQ is not a win.
  if (input.rfqItemCount > 0) {
    const full = winner.itemsQuoted >= input.rfqItemCount;
    checks.push({ code: 'partial_coverage', label: `Covers all ${input.rfqItemCount} requested item(s)`, pass: full });
    if (!full) exceptions.push({ code: 'partial_coverage', title: 'Partial quote', detail: `${winner.supplierName} quoted ${winner.itemsQuoted} of ${input.rfqItemCount} requested items. The rest would need a second order — factor that in.` });
  }

  // 4. Too-good-to-be-true price — >25% below the median of competing quotes.
  const prices = input.competingPrices.filter((p) => p > 0);
  const med = prices.length >= 2 ? median(prices) : null;
  if (med !== null && winner.totalPrice !== null && winner.totalPrice > 0) {
    const anomalous = winner.totalPrice < med * 0.75;
    checks.push({ code: 'price_anomaly', label: 'Price within normal range of competing quotes', pass: !anomalous });
    if (anomalous) exceptions.push({ code: 'price_anomaly', title: 'Price looks too good to be true', detail: `${money(winner.totalPrice, input.currency)} is more than 25% below the median competing quote (${money(med, input.currency)}). Check for missing scope, exclusions, or a quoting error before committing.` });
  } else {
    checks.push({ code: 'price_anomaly', label: 'Price within normal range of competing quotes', pass: true, skipped: true, detail: 'Fewer than two priced quotes to compare against.' });
  }

  // 5. Need-by date — a winning quote that arrives late didn't win.
  if (input.neededBy && !Number.isNaN(Date.parse(input.neededBy)) && winner.leadTimeDays !== null) {
    const daysUntilNeeded = Math.floor((new Date(input.neededBy).getTime() - Date.now()) / 86_400_000);
    const late = winner.leadTimeDays > daysUntilNeeded;
    checks.push({ code: 'misses_need_date', label: `Lead time meets need-by date (${input.neededBy})`, pass: !late });
    if (late) exceptions.push({ code: 'misses_need_date', title: 'Misses your need-by date', detail: `Quoted lead time is ~${winner.leadTimeDays} day(s) but the RFQ needs delivery in ${Math.max(daysUntilNeeded, 0)} day(s). Confirm the date can be pulled in, or accept the delay explicitly.` });
  } else {
    checks.push({ code: 'misses_need_date', label: 'Lead time meets need-by date', pass: true, skipped: true, detail: input.neededBy ? 'No lead time stated on the quote.' : 'No need-by date on the RFQ.' });
  }

  // 6. Extraction confidence — if the AI wasn't sure about the numbers, a human must be.
  const confident = winner.confidence >= 60;
  checks.push({ code: 'low_confidence', label: 'Quote data extracted with high confidence', pass: confident });
  if (!confident) exceptions.push({ code: 'low_confidence', title: 'Low-confidence quote data', detail: `Extraction confidence for ${winner.supplierName} is ${winner.confidence}%. Verify the key figures against the source document before approving.` });

  const active = checks.filter((c) => !c.skipped);
  const status: PolicyResult['status'] = active.length === 0 ? 'no_policy' : exceptions.length === 0 ? 'in_policy' : 'exceptions';
  const summary =
    status === 'no_policy'
      ? 'No policy checks apply yet — set an approval threshold and mark preferred suppliers in Company settings to enable the fast path.'
      : status === 'in_policy'
        ? `In policy — passed ${active.length} check(s). Ready for one-click approval.`
        : `${exceptions.length} exception(s) need your judgment — everything else checked out.`;

  return { status, checks, exceptions, summary };
}

/** Parse "14 days" / "2-3 weeks" style lead-time strings into days (worst case). */
export function leadTimeToDays(leadTime: string | null | undefined): number | null {
  if (!leadTime) return null;
  const numbers = String(leadTime).match(/\d+/g)?.map(Number) ?? [];
  if (!numbers.length) return null;
  const max = Math.max(...numbers);
  return /week/i.test(leadTime) ? max * 7 : /month/i.test(leadTime) ? max * 30 : max;
}
