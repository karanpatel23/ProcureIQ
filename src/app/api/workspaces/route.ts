import { ApiError, handleApiError, jsonOk, parseJson } from '@/lib/server/api';
import { requireUser } from '@/lib/server/auth';
import { createId, mutateDb, now } from '@/lib/server/db';
import { workspaceSchema } from '@/lib/server/validation';
import { writeAuditLog } from '@/lib/server/audit';

export async function POST(request: Request) {
  try {
    const { user } = await requireUser();
    const input = await parseJson(request, workspaceSchema);
    const workspace = await mutateDb((db) => {
      if (db.workspaceMembers.some((member) => member.userId === user.id)) throw new ApiError(409, 'WORKSPACE_EXISTS', 'This user already belongs to a workspace.');
      const timestamp = now();
      const workspace = { id: createId('wsp'), name: input.companyName, industryCategory: input.industryCategory, teamSize: input.teamSize || undefined, website: input.website || undefined, procurementEmail: input.procurementEmail || undefined, mainPurchasingWorkflow: input.mainPurchasingWorkflow, currentTools: input.currentTools, createdAt: timestamp, updatedAt: timestamp };
      db.workspaces.push(workspace);
      db.workspaceMembers.push({ id: createId('wmem'), workspaceId: workspace.id, userId: user.id, role: 'owner', createdAt: timestamp });
      return workspace;
    });
    await writeAuditLog({ workspaceId: workspace.id, actorUserId: user.id, action: 'workspace.created', entityType: 'workspace', entityId: workspace.id });
    return jsonOk({ workspace, next: '/app/dashboard' }, { status: 201 });
  } catch (error) { return handleApiError(error); }
}
