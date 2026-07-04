import { ApiError, handleApiError, jsonOk } from '@/lib/server/api';
import { writeAuditLog } from '@/lib/server/audit';
import { requireWorkspace } from '@/lib/server/auth';
import { mutateDb, now } from '@/lib/server/db';

export async function POST(_: Request, { params }: { params: Promise<{ rfqId: string }> }) { try { const { user, workspace } = await requireWorkspace(['owner', 'admin', 'member']); const { rfqId } = await params; const rfq = await mutateDb((db) => { const rfq = db.rfqs.find((item) => item.id === rfqId && item.workspaceId === workspace.id); if (!rfq) throw new ApiError(404, 'RFQ_NOT_FOUND', 'RFQ was not found.'); rfq.status = 'sent'; rfq.sentAt = now(); rfq.updatedAt = now(); return rfq; }); await writeAuditLog({ workspaceId: workspace.id, actorUserId: user.id, action: 'rfq.marked_sent', entityType: 'rfq', entityId: rfq.id }); return jsonOk({ rfq }); } catch (error) { return handleApiError(error); } }
