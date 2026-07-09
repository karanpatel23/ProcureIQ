import { ApiError, handleApiError, jsonOk } from '@/lib/server/api';
import { writeAuditLog } from '@/lib/server/audit';
import { requireWorkspace } from '@/lib/server/auth';
import { buildRfqComparison, evaluateComparisonPolicy } from '@/lib/server/comparison';
import { mutateDb, readDb } from '@/lib/server/db';
import { runQuoteComparisonLoop, type ComparisonView } from '@/lib/server/quote-loop';

// Quote Comparison Loop: summarize tradeoffs and produce a draft recommendation
// that a human must approve before a PO is drafted.
export async function POST(_: Request, { params }: { params: Promise<{ rfqId: string }> }) {
  try {
    const { user, workspace } = await requireWorkspace(['owner', 'admin', 'member']);
    const { rfqId } = await params;
    const db = await readDb();
    const rfq = db.rfqs.find((item) => item.id === rfqId && item.workspaceId === workspace.id);
    if (!rfq) throw new ApiError(404, 'RFQ_NOT_FOUND', 'RFQ was not found.');

    const comparison = buildRfqComparison(db, rfq);
    if (comparison.quotes.length === 0) throw new ApiError(400, 'NO_QUOTES', 'Add supplier quotes before running comparison.');

    const view: ComparisonView = {
      quotes: comparison.quotes.map((q) => ({ supplierName: q.supplierName, totalPrice: q.totalPrice, leadTime: q.leadTime, paymentTerms: q.paymentTerms, freightTerms: q.freightTerms, confidence: q.confidence, score: q.score, risks: q.risks.map((r) => ({ label: r.label, severity: r.severity })) })),
      recommendation: comparison.recommendation
        ? { overall: { supplierName: comparison.recommendation.overall.supplierName, score: comparison.recommendation.overall.score }, lowestCost: { supplierName: comparison.recommendation.lowestCost.supplierName }, fastest: { supplierName: comparison.recommendation.fastest.supplierName }, needsReview: comparison.recommendation.needsReview, confidence: comparison.recommendation.confidence, reasons: comparison.recommendation.reasons, tradeoffs: comparison.recommendation.tradeoffs }
        : null,
    };

    const output = runQuoteComparisonLoop({ workspaceId: workspace.id, rfqId: rfq.id, createdByUserId: user.id, comparison: view });

    // Evaluate the recommended decision against workspace purchasing policy and
    // persist the verdict on the run — this is what powers exception-only review.
    const policy = evaluateComparisonPolicy(db, rfq, workspace, comparison);
    if (policy) output.run.state = { ...(output.run.state as Record<string, unknown>), policy };

    await mutateDb((draft) => { draft.workflowRuns.push(output.run); });
    await writeAuditLog({
      workspaceId: workspace.id,
      actorUserId: user.id,
      action: 'quote_comparison.completed',
      entityType: 'workflow_run',
      entityId: output.run.id,
      metadata: { rfqId: rfq.id, needsReview: output.needsReview, openItems: output.openItems.length, policyStatus: policy?.status ?? 'none', policyExceptions: policy?.exceptions.length ?? 0 },
    });

    return jsonOk({
      runId: output.run.id,
      status: output.run.status,
      headline: output.headline,
      tradeoffs: output.tradeoffs,
      openItems: output.openItems,
      needsReview: output.needsReview,
      policy,
      trace: output.run.steps,
    }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
