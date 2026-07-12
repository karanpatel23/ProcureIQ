import { ApiError, handleApiError, jsonOk } from '@/lib/server/api';
import { writeAuditLog } from '@/lib/server/audit';
import { requireWorkspace } from '@/lib/server/auth';
import { mutateDb, readDb } from '@/lib/server/db';
import { buildPoDraftFromSelection } from '@/lib/server/po';

export async function POST(_: Request, { params }: { params: Promise<{ rfqId: string }> }) {
  try {
    const { user, workspace } = await requireWorkspace(['owner', 'admin', 'member']);
    const { rfqId } = await params;
    const snapshot = await readDb({ workspaceId: workspace.id });
    const rfq = snapshot.rfqs.find((item) => item.id === rfqId && item.workspaceId === workspace.id) as any;
    if (!rfq) throw new ApiError(404, 'RFQ_NOT_FOUND', 'RFQ was not found.');
    if (!rfq.selectedSupplierQuoteId) throw new ApiError(400, 'QUOTE_SELECTION_REQUIRED', 'Select a supplier quote before creating a PO draft.');
    const draft = buildPoDraftFromSelection(snapshot, { workspace, rfq, userId: user.id });
    if (!draft) throw new ApiError(404, 'QUOTE_NOT_FOUND', 'Selected quote was not found.');
    const existing = snapshot.purchaseOrderDrafts.find((po: any) => po.workspaceId === workspace.id && po.rfqId === rfq.id && po.supplierQuoteId === rfq.selectedSupplierQuoteId) as any;
    const po = await mutateDb((db) => { if (existing) return existing; db.purchaseOrderDrafts.push(draft as any); return draft; }, { workspaceId: workspace.id });
    await writeAuditLog({ workspaceId: workspace.id, actorUserId: user.id, action: 'po_draft.created', entityType: 'purchase_order_draft', entityId: po.id, metadata: { rfqId, supplierQuoteId: rfq.selectedSupplierQuoteId } });
    return jsonOk({ po, next: `/app/purchase-orders/${po.id}` }, { status: 201 });
  } catch (error) { return handleApiError(error); }
}
