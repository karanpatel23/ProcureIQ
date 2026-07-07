import { buildRun, runLoop } from './workflow';
import type { WorkflowRun } from './schema';

/*
 * PO Generation Loop.
 *
 * After a PO is drafted from the approved quote, the loop self-checks it
 * against the source quote and RFQ before a human approves it: does the PO
 * total reconcile with the selected quote, does the arithmetic add up, does it
 * cover every requested line, and can it actually be sent. Mismatches become
 * editable open items — the AI never approves or sends on its own.
 */
export type PoLoopInput = {
  poTotal: number | null;
  poSubtotal: number;
  poTaxes: number;
  poFreight: number;
  poLineCount: number;
  selectedQuoteTotal: number | null;
  rfqItemCount: number;
  supplierEmail?: string;
  paymentTerms?: string;
};
export type PoOpenItem = { field: string; message: string; severity: 'info' | 'warning' };
export type PoLoopOutput = { run: WorkflowRun; openItems: PoOpenItem[]; readyToApprove: boolean; score: number };

export function runPoGenerationLoop(input: {
  workspaceId: string;
  poId?: string;
  createdByUserId?: string;
  po: PoLoopInput;
  maxSteps?: number;
}): PoLoopOutput {
  const maxSteps = input.maxSteps ?? 3;
  const p = input.po;
  const openItems: PoOpenItem[] = [];

  // Reconcile PO total with the source quote — the check that catches a PO
  // that silently drifted from what was actually quoted and approved.
  if (p.poTotal !== null && p.selectedQuoteTotal !== null && p.selectedQuoteTotal > 0) {
    const drift = Math.abs(p.poTotal - p.selectedQuoteTotal) / p.selectedQuoteTotal;
    if (drift > 0.02) openItems.push({ field: 'total', message: `PO total (${Math.round(p.poTotal)}) does not match the approved quote (${Math.round(p.selectedQuoteTotal)}). Reconcile before approving.`, severity: 'warning' });
  }
  // Internal arithmetic must hold.
  if (p.poTotal !== null && Math.abs((p.poSubtotal + p.poTaxes + p.poFreight) - p.poTotal) > 0.01) {
    openItems.push({ field: 'total', message: 'PO subtotal + taxes + freight does not equal the stated total. Check the figures.', severity: 'warning' });
  }
  if (p.poTotal === null || p.poTotal <= 0) openItems.push({ field: 'total', message: 'PO total is missing or zero. Confirm pricing before approving.', severity: 'warning' });
  if (p.poLineCount < p.rfqItemCount) openItems.push({ field: 'lines', message: `PO covers ${p.poLineCount} of ${p.rfqItemCount} requested item(s). Confirm nothing was dropped.`, severity: 'warning' });
  if (!p.paymentTerms) openItems.push({ field: 'paymentTerms', message: 'Payment terms are blank on the PO. Add them so the supplier and finance agree.', severity: 'info' });
  if (!p.supplierEmail) openItems.push({ field: 'supplierEmail', message: 'No supplier email on file. You can approve and export the PO, but it must be sent manually.', severity: 'info' });

  const { steps } = runLoop({}, {
    maxSteps,
    advance: (state, stepIndex) => (stepIndex > 0 ? null : {
      state,
      step: {
        phase: 'self_review',
        summary: openItems.length
          ? `Generated the PO and checked it against the approved quote and RFQ — found ${openItems.length} item(s) to confirm before approval.`
          : 'Generated the PO and reconciled it against the approved quote and RFQ. No discrepancies found.',
        confidence: openItems.some((o) => o.severity === 'warning') ? 0.55 : 0.9,
        missingFields: openItems.map((o) => o.field),
      },
    }),
  });

  const warnings = openItems.filter((o) => o.severity === 'warning').length;
  const infos = openItems.length - warnings;
  const score = Math.max(0, Math.min(100, 100 - warnings * 20 - infos * 5));

  const run = buildRun({
    workspaceId: input.workspaceId,
    type: 'po_generation',
    entityId: input.poId,
    createdByUserId: input.createdByUserId,
    maxSteps,
    state: { openItems },
    steps,
    openItems: openItems.map((o) => o.message),
    score,
  });

  return { run, openItems, readyToApprove: warnings === 0, score };
}
