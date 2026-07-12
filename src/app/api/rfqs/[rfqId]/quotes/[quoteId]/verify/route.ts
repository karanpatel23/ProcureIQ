import { ApiError, handleApiError, jsonOk } from '@/lib/server/api';
import { writeAuditLog } from '@/lib/server/audit';
import { requireWorkspace } from '@/lib/server/auth';
import { mutateDb, readDb } from '@/lib/server/db';
import { runQuoteIngestionLoop } from '@/lib/server/quote-loop';

// Quote Ingestion Loop: self-verify an extracted quote before comparison.
export async function POST(_: Request, { params }: { params: Promise<{ rfqId: string; quoteId: string }> }) {
  try {
    const { user, workspace } = await requireWorkspace(['owner', 'admin', 'member']);
    const { rfqId, quoteId } = await params;
    const db = await readDb({ workspaceId: workspace.id });

    const quote = db.supplierQuotes.find((item) => item.id === quoteId && item.rfqId === rfqId && item.workspaceId === workspace.id) as (typeof db.supplierQuotes)[number] & { reviewedFields?: unknown; extractedFields?: unknown };
    if (!quote) throw new ApiError(404, 'QUOTE_NOT_FOUND', 'Supplier quote was not found for this RFQ.');

    const lineItems = db.quoteLineItems.filter((line) => line.supplierQuoteId === quote.id && line.workspaceId === workspace.id).map((line) => ({ quantity: line.quantity, unitPrice: line.unitPrice, extendedPrice: (line as { extendedPrice?: number }).extendedPrice }));
    const rfqItemCount = db.rfqItems.filter((item) => item.rfqId === rfqId && item.workspaceId === workspace.id).length;

    const output = runQuoteIngestionLoop({
      workspaceId: workspace.id,
      quoteId: quote.id,
      createdByUserId: user.id,
      quote: {
        fields: (quote.reviewedFields ?? quote.extractedFields ?? {}) as Record<string, unknown>,
        lineItems,
        rfqItemCount,
        confidenceScore: quote.confidenceScore,
      },
    });

    await mutateDb((draft) => { draft.workflowRuns.push(output.run); }, { workspaceId: workspace.id });
    await writeAuditLog({
      workspaceId: workspace.id,
      actorUserId: user.id,
      action: 'quote_ingestion.verified',
      entityType: 'workflow_run',
      entityId: output.run.id,
      metadata: { quoteId: quote.id, score: output.score, readyForComparison: output.readyForComparison, openItems: output.openItems.length },
    });

    return jsonOk({
      runId: output.run.id,
      status: output.run.status,
      score: output.score,
      readyForComparison: output.readyForComparison,
      verifiedFields: output.verifiedFields,
      openItems: output.openItems,
      trace: output.run.steps,
    }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
