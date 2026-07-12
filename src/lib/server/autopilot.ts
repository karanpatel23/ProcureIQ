import { buildRfqComparison, evaluateComparisonPolicy } from './comparison';
import { createId, mutateDb, now } from './db';
import { buildPoDraftFromSelection } from './po';
import { runPoGenerationLoop } from './po-loop';
import { runQuoteComparisonLoop, runQuoteIngestionLoop, type ComparisonView } from './quote-loop';
import type { Database, Rfq, SupplierQuote, Workspace } from './schema';

/*
 * Autopilot — AI executes the quote→decision→PO chain; humans review exceptions.
 *
 * When a workspace turns autopilot on ('exceptions_only'), each incoming quote
 * triggers this chain, entirely inside one transaction:
 *
 *   quote extracted → ingestion loop self-verifies → auto-ACCEPT if clean
 *   all invited suppliers answered → comparison + policy → auto-SELECT winner
 *   if in policy → PO draft created and reconciled, ready for the send gate
 *
 * Any failed verification or policy exception HALTS the chain at that point and
 * queues the named exception for a human — the human's job is the exception,
 * not the workflow. Every autonomous action is recorded as a workflow run and
 * an audit event, so the trail shows exactly what the AI did and why.
 *
 * The chain deliberately stops at outward actions (emailing a PO to a supplier,
 * paying an invoice) — see state/DECISIONS.md for the named boundaries.
 */
export type AutopilotAction = { action: string; entityType: string; entityId?: string; summary: string; metadata?: Record<string, unknown> };
export type AutopilotOutcome = {
  enabled: boolean;
  actions: AutopilotAction[];
  halted?: { at: string; reasons: string[] };
  next?: string;
};

const fieldValue = (field: unknown): unknown => (field && typeof field === 'object' ? (field as { value?: unknown }).value ?? null : field ?? null);

function acceptQuote(db: Database, workspaceId: string, quote: SupplierQuote & Record<string, any>) {
  const fields: any = quote.extractedFields ?? {};
  quote.reviewedFields = fields;
  quote.status = 'accepted';
  quote.extractionStatus = 'approved';
  quote.currency = fields?.currency?.value || quote.currency || 'USD';
  quote.updatedAt = now();
  db.quoteLineItems = db.quoteLineItems.filter((line) => !(line.supplierQuoteId === quote.id && line.workspaceId === workspaceId));
  for (const line of fields?.lineItems ?? []) {
    db.quoteLineItems.push({
      id: createId('qli'), workspaceId, supplierQuoteId: quote.id,
      description: line.description?.value || line.itemName?.value || 'Quote line item',
      quantity: Number(line.quantity?.value ?? 1), unitPrice: Number(line.unitPrice?.value ?? 0),
      leadTimeDays: undefined, sourceDocumentId: quote.quoteDocumentId,
      sourceExcerpt: line.description?.source || undefined,
      confidenceScore: Math.round(((line.itemName?.confidence ?? 0) + (line.unitPrice?.confidence ?? 0)) / 2),
      itemName: line.itemName?.value, unit: line.unit?.value,
      extendedPrice: Number(line.extendedPrice?.value ?? 0), notes: line.notes?.value, createdAt: now(),
    } as any);
  }
}

/**
 * Run the autopilot chain for an RFQ. Call after any quote lands or is approved.
 * No-op (enabled:false) unless the workspace has autopilot = 'exceptions_only'.
 */
export async function runAutopilotForRfq(input: { workspaceId: string; rfqId: string; actorUserId?: string }): Promise<AutopilotOutcome> {
  return mutateDb((db) => {
    const workspace = db.workspaces.find((item) => item.id === input.workspaceId) as Workspace | undefined;
    const rfq = db.rfqs.find((item) => item.id === input.rfqId && item.workspaceId === input.workspaceId) as (Rfq & Record<string, any>) | undefined;
    if (!workspace || !rfq) return { enabled: false, actions: [] };
    if ((workspace.autopilot ?? 'off') !== 'exceptions_only') return { enabled: false, actions: [] };

    const actions: AutopilotAction[] = [];
    const timestamp = now();
    const rfqItemCount = db.rfqItems.filter((item) => item.rfqId === rfq.id && item.workspaceId === workspace.id).length;

    // ---- Stage A: self-verify and accept every pending quote it can trust ----
    const pending = db.supplierQuotes.filter((q) => q.rfqId === rfq.id && q.workspaceId === workspace.id && q.status === 'needs_review') as Array<SupplierQuote & Record<string, any>>;
    const queuedReasons: string[] = [];
    for (const quote of pending) {
      const fields: any = quote.extractedFields ?? {};
      const rawLines = (fields.lineItems ?? []).map((line: any) => ({ quantity: Number(fieldValue(line.quantity)) || undefined, unitPrice: Number(fieldValue(line.unitPrice)) || undefined, extendedPrice: Number(fieldValue(line.extendedPrice)) || undefined }));
      const ingestion = runQuoteIngestionLoop({ workspaceId: workspace.id, quoteId: quote.id, createdByUserId: input.actorUserId, quote: { fields, lineItems: rawLines, rfqItemCount, confidenceScore: quote.confidenceScore } });
      const supplierName = db.suppliers.find((s) => s.id === quote.supplierId)?.name ?? 'supplier';
      if (ingestion.readyForComparison) {
        ingestion.run.status = 'approved';
        ingestion.run.decision = { action: 'approve', byUserId: input.actorUserId, notes: 'Accepted autonomously by autopilot — self-verification passed with no warnings.', at: timestamp };
        db.workflowRuns.push(ingestion.run);
        acceptQuote(db, workspace.id, quote);
        actions.push({ action: 'autopilot.quote_accepted', entityType: 'supplier_quote', entityId: quote.id, summary: `Verified and accepted ${supplierName}'s quote (self-check score ${ingestion.score}).` });
      } else {
        db.workflowRuns.push(ingestion.run); // stays awaiting_approval → exception queue
        const reasons = ingestion.openItems.filter((o) => o.severity === 'warning').map((o) => o.message);
        queuedReasons.push(`${supplierName}: ${reasons[0] ?? 'needs review'}`);
        actions.push({ action: 'autopilot.quote_queued', entityType: 'supplier_quote', entityId: quote.id, summary: `${supplierName}'s quote held for review: ${reasons.join(' ')}`, metadata: { reasons } });
      }
    }

    // ---- Stage B: when every invited supplier has answered, compare + policy ----
    const accepted = db.supplierQuotes.filter((q) => q.rfqId === rfq.id && q.workspaceId === workspace.id && q.status === 'accepted');
    const stillPending = db.supplierQuotes.some((q) => q.rfqId === rfq.id && q.workspaceId === workspace.id && q.status === 'needs_review');
    const everySupplierAnswered = rfq.supplierIds.length > 0 && rfq.supplierIds.every((sid: string) => accepted.some((q) => q.supplierId === sid));
    if (!everySupplierAnswered || stillPending || rfq.selectedSupplierQuoteId) {
      const reasons = queuedReasons.length ? queuedReasons : [stillPending || !everySupplierAnswered ? 'Waiting for remaining supplier quotes.' : 'Decision already made.'];
      return { enabled: true, actions, halted: actions.length || !rfq.selectedSupplierQuoteId ? { at: 'comparison', reasons } : undefined };
    }

    const comparison = buildRfqComparison(db, rfq);
    const policy = evaluateComparisonPolicy(db, rfq, workspace, comparison);
    const view: ComparisonView = {
      quotes: comparison.quotes.map((q) => ({ supplierName: q.supplierName, totalPrice: q.totalPrice, leadTime: q.leadTime, paymentTerms: q.paymentTerms, freightTerms: q.freightTerms, confidence: q.confidence, score: q.score, risks: q.risks.map((r) => ({ label: r.label, severity: r.severity })) })),
      recommendation: comparison.recommendation ? { overall: { supplierName: comparison.recommendation.overall.supplierName, score: comparison.recommendation.overall.score }, lowestCost: { supplierName: comparison.recommendation.lowestCost.supplierName }, fastest: { supplierName: comparison.recommendation.fastest.supplierName }, needsReview: comparison.recommendation.needsReview, confidence: comparison.recommendation.confidence, reasons: comparison.recommendation.reasons, tradeoffs: comparison.recommendation.tradeoffs } : null,
    };
    const loop = runQuoteComparisonLoop({ workspaceId: workspace.id, rfqId: rfq.id, createdByUserId: input.actorUserId, comparison: view });
    if (policy) loop.run.state = { ...(loop.run.state as Record<string, unknown>), policy };

    const winner = comparison.recommendation?.overall;
    const canDecide = Boolean(winner && policy?.status === 'in_policy' && !comparison.recommendation?.needsReview);
    if (!canDecide) {
      db.workflowRuns.push(loop.run); // awaiting_approval → decision queue
      const reasons = policy?.exceptions.map((e) => `${e.title}: ${e.detail}`) ?? ['No confident recommendation.'];
      actions.push({ action: 'autopilot.decision_queued', entityType: 'workflow_run', entityId: loop.run.id, summary: `Comparison done — ${reasons.length} exception(s) queued for human judgment.`, metadata: { reasons } });
      return { enabled: true, actions, halted: { at: 'decision', reasons }, next: `/app/rfqs/${rfq.id}/compare` };
    }

    // ---- Stage C: decide — in policy, so the AI selects the winner itself ----
    loop.run.status = 'approved';
    loop.run.decision = { action: 'approve', byUserId: input.actorUserId, notes: `Winner selected autonomously by autopilot — in policy (${policy?.checks.filter((c) => !c.skipped).length ?? 0} checks passed).`, at: timestamp };
    db.workflowRuns.push(loop.run);
    rfq.selectedSupplierQuoteId = winner!.quote.id;
    rfq.status = 'approved';
    rfq.recommendationOverridden = false;
    rfq.decisionNotes = `Autopilot selected ${winner!.supplierName}: strongest combined score for price, lead time, completeness, and confidence; all purchasing-policy checks passed.`;
    rfq.updatedAt = timestamp;
    actions.push({ action: 'autopilot.supplier_selected', entityType: 'rfq', entityId: rfq.id, summary: `Selected ${winner!.supplierName} — in policy, no exceptions.`, metadata: { supplierQuoteId: winner!.quote.id, policyStatus: policy?.status } });

    // ---- Stage D: draft the PO and reconcile it against the approved quote ----
    let po = db.purchaseOrderDrafts.find((item: any) => item.workspaceId === workspace.id && item.rfqId === rfq.id && item.supplierQuoteId === rfq.selectedSupplierQuoteId) as any;
    if (!po) {
      po = buildPoDraftFromSelection(db, { workspace, rfq, userId: input.actorUserId ?? rfq.createdByUserId });
      if (po) db.purchaseOrderDrafts.push(po);
    }
    if (po) {
      const supplier = db.suppliers.find((s) => s.id === (accepted.find((q) => q.id === rfq.selectedSupplierQuoteId)?.supplierId));
      const fields: any = (accepted.find((q) => q.id === rfq.selectedSupplierQuoteId) as any)?.reviewedFields ?? {};
      const poLoop = runPoGenerationLoop({ workspaceId: workspace.id, poId: po.id, createdByUserId: input.actorUserId, po: { poTotal: Number(po.total ?? po.subtotal ?? 0) || null, poSubtotal: Number(po.subtotal ?? 0), poTaxes: Number(po.taxes ?? 0), poFreight: Number(po.freight ?? 0), poLineCount: Array.isArray(po.lines) ? po.lines.length : 0, selectedQuoteTotal: Number(fieldValue(fields.totalPrice)) || null, rfqItemCount, supplierEmail: supplier?.email, paymentTerms: String(fieldValue(fields.paymentTerms) ?? '') || undefined } });
      db.workflowRuns.push(poLoop.run);
      actions.push({ action: 'autopilot.po_drafted', entityType: 'purchase_order_draft', entityId: po.id, summary: poLoop.readyToApprove ? 'PO drafted and reconciled against the winning quote — ready for the one-click send gate.' : `PO drafted with ${poLoop.openItems.length} item(s) to confirm.`, metadata: { readyToApprove: poLoop.readyToApprove } });
      return { enabled: true, actions, next: `/app/purchase-orders/${po.id}` };
    }

    return { enabled: true, actions };
  }, { workspaceId: input.workspaceId });
}
