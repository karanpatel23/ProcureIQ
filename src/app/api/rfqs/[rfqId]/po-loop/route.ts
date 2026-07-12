import { ApiError, handleApiError, jsonOk } from '@/lib/server/api';
import { writeAuditLog } from '@/lib/server/audit';
import { requireWorkspace } from '@/lib/server/auth';
import { mutateDb, readDb } from '@/lib/server/db';
import { buildPoDraftFromSelection } from '@/lib/server/po';
import { runPoGenerationLoop } from '@/lib/server/po-loop';

const value = (field: unknown): unknown => (field && typeof field === 'object' ? (field as { value?: unknown }).value ?? null : field ?? null);
const num = (v: unknown): number | null => { const n = Number(v); return Number.isFinite(n) && n !== 0 ? n : null; };

// PO Generation Loop: draft the PO from the selected quote, then AI self-checks
// it against the quote + RFQ. Ends awaiting human approval — never auto-sends.
export async function POST(_: Request, { params }: { params: Promise<{ rfqId: string }> }) {
  try {
    const { user, workspace } = await requireWorkspace(['owner', 'admin', 'member']);
    const { rfqId } = await params;
    const db = await readDb({ workspaceId: workspace.id });
    const rfq = db.rfqs.find((item) => item.id === rfqId && item.workspaceId === workspace.id) as (typeof db.rfqs)[number] & { selectedSupplierQuoteId?: string };
    if (!rfq) throw new ApiError(404, 'RFQ_NOT_FOUND', 'RFQ was not found.');
    if (!rfq.selectedSupplierQuoteId) throw new ApiError(400, 'QUOTE_SELECTION_REQUIRED', 'Select a supplier quote before generating a PO.');

    const draft = buildPoDraftFromSelection(db, { workspace, rfq, userId: user.id }) as (Record<string, unknown> & { id: string; supplierQuoteId: string; total: number; subtotal: number; taxes: number; freight: number; lines: unknown[]; supplierId?: string; paymentTerms?: string }) | null;
    if (!draft) throw new ApiError(404, 'QUOTE_NOT_FOUND', 'Selected quote was not found.');

    // Reuse the existing draft for this selection if one exists, else persist the new one.
    const existing = db.purchaseOrderDrafts.find((po) => po.workspaceId === workspace.id && po.rfqId === rfq.id && (po as { supplierQuoteId?: string }).supplierQuoteId === rfq.selectedSupplierQuoteId) as typeof draft | undefined;
    const po = existing ?? draft;

    const quote = db.supplierQuotes.find((q) => q.id === rfq.selectedSupplierQuoteId && q.workspaceId === workspace.id) as (Record<string, unknown> & { reviewedFields?: unknown; extractedFields?: unknown }) | undefined;
    const quoteFields = (quote?.reviewedFields ?? quote?.extractedFields ?? {}) as Record<string, unknown>;
    const supplier = db.suppliers.find((s) => s.id === po.supplierId && s.workspaceId === workspace.id);
    const rfqItemCount = db.rfqItems.filter((item) => item.rfqId === rfq.id && item.workspaceId === workspace.id).length;

    const output = runPoGenerationLoop({
      workspaceId: workspace.id,
      poId: po.id,
      createdByUserId: user.id,
      po: {
        poTotal: num(po.total),
        poSubtotal: Number(po.subtotal) || 0,
        poTaxes: Number(po.taxes) || 0,
        poFreight: Number(po.freight) || 0,
        poLineCount: Array.isArray(po.lines) ? po.lines.length : 0,
        selectedQuoteTotal: num(value(quoteFields.totalPrice)),
        rfqItemCount,
        supplierEmail: supplier?.email,
        paymentTerms: (po.paymentTerms as string) || undefined,
      },
    });

    await mutateDb((store) => {
      if (!existing) store.purchaseOrderDrafts.push(po as never);
      store.workflowRuns.push(output.run);
    }, { workspaceId: workspace.id });
    await writeAuditLog({ workspaceId: workspace.id, actorUserId: user.id, action: 'po_generation.completed', entityType: 'workflow_run', entityId: output.run.id, metadata: { poId: po.id, readyToApprove: output.readyToApprove, openItems: output.openItems.length } });

    return jsonOk({
      runId: output.run.id,
      poId: po.id,
      status: output.run.status,
      score: output.score,
      readyToApprove: output.readyToApprove,
      openItems: output.openItems,
      trace: output.run.steps,
      po,
    }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
