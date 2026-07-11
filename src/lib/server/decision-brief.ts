import type { PolicyResult } from './policy';

/*
 * Decision brief + negotiation assist.
 *
 * The brief answers "what should I do and why" in five plain-language lines a
 * buyer can paste straight into the approval email thread — the antidote to
 * both enterprise analyst-speak and report-builder dashboards.
 *
 * The negotiation draft is the honest version of "autonomous negotiations":
 * a counter-offer email computed from REAL deltas between the quotes on the
 * table (the leverage is named and traceable), drafted completely, and left
 * for a human to send. If no real leverage exists, there is no draft — the
 * AI does not invent bargaining positions.
 */
export type BriefQuote = {
  supplierName: string;
  totalPrice: number | null;
  leadTime: string | null;
  paymentTerms: string | null;
  recommended: boolean;
};
export type DecisionBriefInput = {
  rfqTitle: string;
  currency?: string;
  quotes: BriefQuote[];
  confidence?: number;
  policy: PolicyResult | null;
};
export type NegotiationDraft = { toSupplier: string; leverage: string; subject: string; body: string };
export type DecisionBrief = { lines: string[]; negotiation: NegotiationDraft | null };

const money = (value: number, currency?: string) => `${currency ?? 'USD'} ${Math.round(value).toLocaleString()}`;
const days = (lead: string | null): number | null => {
  if (!lead) return null;
  const numbers = String(lead).match(/\d+/g)?.map(Number) ?? [];
  if (!numbers.length) return null;
  const max = Math.max(...numbers);
  return /week/i.test(lead) ? max * 7 : /month/i.test(lead) ? max * 30 : max;
};

export function buildDecisionBrief(input: DecisionBriefInput): DecisionBrief {
  const winner = input.quotes.find((quote) => quote.recommended);
  if (!winner) return { lines: ['No recommendation yet — complete the flagged quotes, then re-run comparison.'], negotiation: null };

  const others = input.quotes.filter((quote) => !quote.recommended);
  const priced = input.quotes.filter((q): q is BriefQuote & { totalPrice: number } => typeof q.totalPrice === 'number' && q.totalPrice > 0);
  const cheapest = priced.length ? priced.reduce((a, b) => (a.totalPrice <= b.totalPrice ? a : b)) : null;

  const lines: string[] = [];
  // 1. The recommendation.
  lines.push(`Recommendation: award "${input.rfqTitle}" to ${winner.supplierName}${typeof input.confidence === 'number' ? ` (confidence ${input.confidence}%)` : ''}.`);
  // 2. Price context, with the real numbers.
  if (winner.totalPrice != null && cheapest) {
    if (cheapest.supplierName === winner.supplierName) {
      const next = priced.filter((q) => q.supplierName !== winner.supplierName).sort((a, b) => a.totalPrice - b.totalPrice)[0];
      lines.push(next
        ? `Price: ${money(winner.totalPrice, input.currency)} — the lowest on the table, ${money(next.totalPrice - winner.totalPrice, input.currency)} below ${next.supplierName}.`
        : `Price: ${money(winner.totalPrice, input.currency)} (only priced quote).`);
    } else {
      lines.push(`Price: ${money(winner.totalPrice, input.currency)} — ${money(winner.totalPrice - cheapest.totalPrice, input.currency)} above ${cheapest.supplierName}'s ${money(cheapest.totalPrice, input.currency)}, justified by stronger terms/completeness in the scoring.`);
    }
  }
  // 3. Terms & lead time.
  const termBits = [winner.leadTime ? `lead time ${winner.leadTime}` : 'lead time not stated', winner.paymentTerms ? `payment ${winner.paymentTerms}` : 'payment terms not stated'];
  lines.push(`Terms: ${termBits.join(' · ')}.`);
  // 4. Policy verdict, verbatim from the engine.
  if (input.policy) {
    lines.push(input.policy.status === 'in_policy'
      ? `Policy: all ${input.policy.checks.filter((c) => !c.skipped).length} purchasing-policy checks passed — eligible for one-click approval.`
      : input.policy.status === 'exceptions'
        ? `Policy: ${input.policy.exceptions.length} exception(s) — ${input.policy.exceptions.map((e) => e.title.toLowerCase()).join('; ')}.`
        : 'Policy: no checks configured yet (set a threshold and preferred suppliers in Company settings).');
  }
  // 5. The next action.
  lines.push(others.length
    ? `Next: approve to draft the PO, or use the negotiation draft below to push ${winner.supplierName} before deciding.`
    : 'Next: approve to draft the PO.');

  return { lines, negotiation: buildNegotiationDraft(input, winner, priced) };
}

function buildNegotiationDraft(input: DecisionBriefInput, winner: BriefQuote, priced: Array<BriefQuote & { totalPrice: number }>): NegotiationDraft | null {
  const rivals = priced.filter((quote) => quote.supplierName !== winner.supplierName);
  if (!rivals.length || winner.totalPrice == null) return null;

  const cheapestRival = rivals.reduce((a, b) => (a.totalPrice <= b.totalPrice ? a : b));
  const priceGap = winner.totalPrice - cheapestRival.totalPrice;

  const winnerDays = days(winner.leadTime);
  const fastestRival = rivals
    .map((quote) => ({ quote, days: days(quote.leadTime) }))
    .filter((entry): entry is { quote: typeof entry.quote; days: number } => entry.days !== null)
    .sort((a, b) => a.days - b.days)[0];
  const leadGap = winnerDays !== null && fastestRival ? winnerDays - fastestRival.days : null;

  // Real leverage only: a rival is meaningfully cheaper (>1%) or meaningfully faster (>2 days).
  const asks: string[] = [];
  let leverage = '';
  if (priceGap > winner.totalPrice * 0.01) {
    leverage = `${cheapestRival.supplierName} quoted ${money(cheapestRival.totalPrice, input.currency)} — ${money(priceGap, input.currency)} below your quote`;
    asks.push(`match or come closer to ${money(cheapestRival.totalPrice, input.currency)} on the total`);
  }
  if (leadGap !== null && leadGap > 2) {
    leverage = leverage || `a competing quote commits to delivery ${leadGap} day(s) sooner`;
    asks.push(`improve the lead time (a competing quote is ${leadGap} day(s) faster)`);
  }
  if (!asks.length) return null;

  const body = [
    `Hi ${winner.supplierName} team,`,
    '',
    `Thank you for your quote on "${input.rfqTitle}" — you are currently our preferred option.`,
    '',
    `Before we issue the purchase order, one point: we have a competing quote where ${leverage.replace(/^./, (c) => c.toLowerCase())}. To finalize the award today, could you ${asks.join(' and ')}?`,
    '',
    'If you can confirm by end of week we are ready to proceed immediately.',
    '',
    'Best regards,',
  ].join('\n');

  return { toSupplier: winner.supplierName, leverage, subject: `Re: Quote for "${input.rfqTitle}" — one step from award`, body };
}
