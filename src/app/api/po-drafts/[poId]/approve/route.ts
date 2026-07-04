import { ApiError, handleApiError, jsonOk } from '@/lib/server/api';
import { writeAuditLog } from '@/lib/server/audit';
import { requireWorkspace } from '@/lib/server/auth';
import { mutateDb, now } from '@/lib/server/db';
export async function POST(_: Request, { params }: { params: Promise<{ poId: string }> }) { try { const { user, workspace } = await requireWorkspace(['owner', 'admin']); const { poId } = await params; const po = await mutateDb((db) => { const po = db.purchaseOrderDrafts.find((item) => item.id === poId && item.workspaceId === workspace.id) as any; if (!po) throw new ApiError(404, 'PO_NOT_FOUND', 'PO draft was not found.'); po.status = 'approved'; po.updatedAt = now(); return po; }); await writeAuditLog({ workspaceId: workspace.id, actorUserId: user.id, action: 'po_draft.approved', entityType: 'purchase_order_draft', entityId: po.id }); return jsonOk({ po }); } catch (error) { return handleApiError(error); } }
