import { handleApiError, jsonOk, parseJson } from '@/lib/server/api';
import { requireWorkspace } from '@/lib/server/auth';
import { writeAuditLog } from '@/lib/server/audit';
import { createPoDraft, rfqDraftSchema } from '@/lib/procurement';

export async function POST(request: Request) {
  try {
    const { user, workspace } = await requireWorkspace(['owner', 'admin', 'member']);
    const input = await parseJson(request, rfqDraftSchema);
    const draft = createPoDraft(input);
    await writeAuditLog({ workspaceId: workspace.id, actorUserId: user.id, action: 'po_draft.generated', entityType: 'purchase_order_draft', entityId: draft.id, metadata: { requestId: input.requestId, supplierName: input.supplierName } });
    return jsonOk({ draft: { ...draft, workspaceId: workspace.id }, message: 'AI-generated draft only. Human approval is required before purchasing.' });
  } catch (error) { return handleApiError(error); }
}
