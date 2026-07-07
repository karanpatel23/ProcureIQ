import { buildRun, runLoop, type LoopController } from './workflow';
import type { WorkflowRun } from './schema';

/*
 * Quote Ingestion Loop and Quote Comparison Loop.
 *
 * Ingestion: after extraction, the loop self-verifies the quote — computes a
 * total from line items when it is safe to do so, and flags anything missing
 * or internally inconsistent (line-item sum vs stated total, expired validity,
 * low confidence, incomplete item coverage) as an editable open item for the
 * human. It never invents commercial values it cannot derive.
 *
 * Comparison: the loop summarizes tradeoffs across price, lead time, terms,
 * completeness and risk — it recommends and explains, it does not just pick
 * the cheapest, and it never selects a supplier on its own. Both loops end at
 * the human-approval gate.
 */

const num = (value: unknown): number | null => {
  const n = Number(value);
  return Number.isFinite(n) && n !== 0 ? n : null;
};
const fieldValue = (field: unknown): unknown => (field && typeof field === 'object' ? (field as { value?: unknown }).value ?? null : field ?? null);
const dateExpired = (value: unknown): boolean => {
  const s = fieldValue(value);
  return Boolean(s && typeof s === 'string' && !Number.isNaN(Date.parse(s)) && new Date(s) < new Date());
};

export type QuoteIngestionInput = {
  fields: Record<string, unknown>;
  lineItems: Array<{ quantity?: number; unitPrice?: number; extendedPrice?: number }>;
  rfqItemCount: number;
  confidenceScore?: number;
};
export type QuoteOpenItem = { field: string; message: string; severity: 'info' | 'warning' };
export type QuoteIngestionOutput = {
  run: WorkflowRun;
  verifiedFields: Record<string, unknown>;
  openItems: QuoteOpenItem[];
  readyForComparison: boolean;
  score: number;
};

function lineItemsTotal(lineItems: QuoteIngestionInput['lineItems']): number | null {
  if (!lineItems.length) return null;
  const sum = lineItems.reduce((acc, line) => acc + (num(line.extendedPrice) ?? (num(line.quantity) ?? 0) * (num(line.unitPrice) ?? 0)), 0);
  return sum > 0 ? sum : null;
}

export function runQuoteIngestionLoop(input: {
  workspaceId: string;
  quoteId?: string;
  createdByUserId?: string;
  quote: QuoteIngestionInput;
  maxSteps?: number;
}): QuoteIngestionOutput {
  const maxSteps = input.maxSteps ?? 4;
  const fields: Record<string, unknown> = JSON.parse(JSON.stringify(input.quote.fields ?? {}));
  const { lineItems, rfqItemCount, confidenceScore } = input.quote;

  const controller: LoopController<Record<string, unknown>> = {
    maxSteps,
    advance(state, stepIndex) {
      if (stepIndex > 0) return null; // one safe-fix pass, then converge
      const changed: string[] = [];
      // Safe fix: derive total price from line items when the extractor missed it.
      if (fieldValue(state.totalPrice) === null || fieldValue(state.totalPrice) === undefined) {
        const derived = lineItemsTotal(lineItems);
        if (derived !== null) {
          state.totalPrice = { value: derived, confidence: 45, source: 'derived from line items' };
          changed.push('totalPrice');
        }
      }
      return {
        state,
        step: {
          phase: 'self_review',
          summary: changed.length ? `Verified extraction; derived ${changed.join(', ')} from line items.` : 'Verified extraction; no values safe to derive.',
          confidence: changed.length ? 0.45 : 0.85,
          changed: changed.length ? changed : undefined,
        },
      };
    },
  };

  const { state, steps } = runLoop(fields, controller);

  const openItems: QuoteOpenItem[] = [];
  const total = num(fieldValue(state.totalPrice));
  if (total === null) openItems.push({ field: 'totalPrice', message: 'No total price could be extracted or derived. Enter it before comparison.', severity: 'warning' });
  const liTotal = lineItemsTotal(lineItems);
  if (total !== null && liTotal !== null && Math.abs(liTotal - total) / total > 0.02) {
    openItems.push({ field: 'totalPrice', message: `Line items sum to ${Math.round(liTotal)} but the stated total is ${Math.round(total)}. Confirm which is correct.`, severity: 'warning' });
  }
  if (fieldValue(state.estimatedLeadTime) === null) openItems.push({ field: 'estimatedLeadTime', message: 'Lead time is missing — confirm it with the supplier so comparison is accurate.', severity: 'info' });
  if (fieldValue(state.paymentTerms) === null) openItems.push({ field: 'paymentTerms', message: 'Payment terms are missing. They materially affect the real cost of the quote.', severity: 'info' });
  if (fieldValue(state.freightTerms) === null) openItems.push({ field: 'freightTerms', message: 'Freight/shipping terms are missing. Confirm whether delivery is included.', severity: 'info' });
  if (dateExpired(state.validUntil)) openItems.push({ field: 'validUntil', message: 'This quote appears to have expired. Request a refreshed quote before deciding.', severity: 'warning' });
  if ((confidenceScore ?? 100) < 60) openItems.push({ field: 'confidence', message: 'Extraction confidence is low. Review each field against the source document.', severity: 'warning' });
  if (lineItems.length < rfqItemCount) openItems.push({ field: 'lineItems', message: `Only ${lineItems.length} of ${rfqItemCount} requested item(s) were found. Confirm the supplier quoted everything.`, severity: 'warning' });

  const warnings = openItems.filter((o) => o.severity === 'warning').length;
  const infos = openItems.length - warnings;
  const score = Math.max(0, Math.min(100, 100 - warnings * 18 - infos * 6));
  const readyForComparison = warnings === 0;

  const run = buildRun({
    workspaceId: input.workspaceId,
    type: 'quote_ingestion',
    entityId: input.quoteId,
    createdByUserId: input.createdByUserId,
    maxSteps,
    state,
    steps,
    openItems: openItems.map((o) => o.message),
    score,
  });

  return { run, verifiedFields: state, openItems, readyForComparison, score };
}

// ---------------------------------------------------------------------------
// Quote Comparison Loop
// ---------------------------------------------------------------------------
export type ComparedQuoteView = {
  supplierName: string;
  totalPrice: number | null;
  leadTime: string | null;
  paymentTerms: string | null;
  freightTerms: string | null;
  confidence: number;
  score: number;
  risks: Array<{ label: string; severity: 'low' | 'medium' | 'high' }>;
};
export type ComparisonView = {
  quotes: ComparedQuoteView[];
  recommendation: { overall: { supplierName: string; score: number }; lowestCost: { supplierName: string }; fastest: { supplierName: string }; needsReview: boolean; confidence: number; reasons: string[]; tradeoffs: string[] } | null;
};
export type ComparisonTradeoff = { supplierName: string; summary: string; recommended: boolean; risks: string[] };
export type QuoteComparisonOutput = {
  run: WorkflowRun;
  headline: string;
  tradeoffs: ComparisonTradeoff[];
  openItems: QuoteOpenItem[];
  needsReview: boolean;
};

export function runQuoteComparisonLoop(input: {
  workspaceId: string;
  rfqId?: string;
  createdByUserId?: string;
  comparison: ComparisonView;
  maxSteps?: number;
}): QuoteComparisonOutput {
  const maxSteps = input.maxSteps ?? 4;
  const { comparison } = input;
  const prices = comparison.quotes.map((q) => q.totalPrice).filter((p): p is number => typeof p === 'number');
  const avgPrice = prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : null;
  const recommendedName = comparison.recommendation?.overall.supplierName;

  const tradeoffs: ComparisonTradeoff[] = comparison.quotes.map((q) => {
    const bits: string[] = [];
    if (q.totalPrice !== null && avgPrice) {
      const delta = Math.round(((q.totalPrice - avgPrice) / avgPrice) * 100);
      bits.push(delta === 0 ? 'at the group average price' : delta < 0 ? `${Math.abs(delta)}% below average price` : `${delta}% above average price`);
    } else if (q.totalPrice === null) {
      bits.push('no total price');
    }
    bits.push(q.leadTime ? `lead time ${q.leadTime}` : 'lead time missing');
    bits.push(q.paymentTerms ? `terms ${q.paymentTerms}` : 'payment terms missing');
    bits.push(q.freightTerms ? 'freight stated' : 'freight not stated');
    return {
      supplierName: q.supplierName,
      summary: bits.join(' · '),
      recommended: q.supplierName === recommendedName,
      risks: q.risks.map((r) => r.label),
    };
  });

  // Single reasoning pass: the loop understands the field, produces the tradeoff
  // narrative, and stops — comparison is derived, not iteratively mutated.
  const { steps } = runLoop({}, {
    maxSteps,
    advance: (state, stepIndex) => (stepIndex > 0 ? null : {
      state,
      step: {
        phase: 'self_review',
        summary: recommendedName
          ? `Compared ${comparison.quotes.length} quote(s) on price, lead time, terms and risk. Draft recommendation: ${recommendedName}.`
          : `Reviewed ${comparison.quotes.length} quote(s); not enough complete data for a confident recommendation.`,
        confidence: (comparison.recommendation?.confidence ?? 40) / 100,
        missingFields: comparison.recommendation?.tradeoffs,
      },
    }),
  });

  const openItems: QuoteOpenItem[] = comparison.quotes
    .filter((q) => q.confidence < 60 || q.risks.some((r) => r.severity === 'high'))
    .map((q) => ({ field: q.supplierName, message: `${q.supplierName} needs review before selection (${q.risks.map((r) => r.label).join(', ') || 'low confidence'}).`, severity: 'warning' as const }));

  const headline = recommendedName
    ? `Draft recommendation: ${recommendedName}. ${comparison.recommendation?.reasons?.[0] ?? ''} A human must approve before a PO is drafted.`
    : 'No confident recommendation yet — complete the flagged quotes, then re-run comparison.';

  const run = buildRun({
    workspaceId: input.workspaceId,
    type: 'quote_comparison',
    entityId: input.rfqId,
    createdByUserId: input.createdByUserId,
    maxSteps,
    state: { tradeoffs, headline },
    steps,
    openItems: openItems.map((o) => o.message),
    score: comparison.recommendation?.confidence,
  });

  return { run, headline, tradeoffs, openItems, needsReview: Boolean(comparison.recommendation?.needsReview) };
}
