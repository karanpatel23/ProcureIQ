import { ApiError, handleApiError, jsonOk, parseJson } from '@/lib/server/api';
import { writeAuditLog } from '@/lib/server/audit';
import { requireWorkspace } from '@/lib/server/auth';
import { mutateDb } from '@/lib/server/db';
import { memberUpdateSchema } from '@/lib/server/validation';

// Change a teammate's role or persona. Owner/admin only. The workspace owner
// cannot be demoted here (ownership transfer is a separate, deliberate action).
export async function PATCH(request: Request, { params }: { params: Promise<{ memberId: string }> }) {
  try {
    const { user, workspace } = await requireWorkspace(['owner', 'admin']);
    const { memberId } = await params;
    const input = await parseJson(request, memberUpdateSchema);
    const member = await mutateDb((db) => {
      const target = db.workspaceMembers.find((m) => m.id === memberId && m.workspaceId === workspace.id);
      if (!target) throw new ApiError(404, 'MEMBER_NOT_FOUND', 'Team member was not found.');
      if (target.role === 'owner') throw new ApiError(400, 'CANNOT_MODIFY_OWNER', 'The workspace owner’s role cannot be changed here.');
      if (input.role) target.role = input.role;
      if (input.title) target.title = input.title;
      return target;
    }, { workspaceId: workspace.id });
    await writeAuditLog({ workspaceId: workspace.id, actorUserId: user.id, action: 'team_member.updated', entityType: 'workspace_member', entityId: member.id, metadata: { role: member.role, title: member.title } });
    return jsonOk({ member });
  } catch (error) { return handleApiError(error); }
}

// Remove a teammate profile. Owner/admin only; the owner cannot be removed and
// you cannot remove yourself (prevents locking a workspace out of its admins).
export async function DELETE(_: Request, { params }: { params: Promise<{ memberId: string }> }) {
  try {
    const { user, workspace } = await requireWorkspace(['owner', 'admin']);
    const { memberId } = await params;
    await mutateDb((db) => {
      const target = db.workspaceMembers.find((m) => m.id === memberId && m.workspaceId === workspace.id);
      if (!target) throw new ApiError(404, 'MEMBER_NOT_FOUND', 'Team member was not found.');
      if (target.role === 'owner') throw new ApiError(400, 'CANNOT_REMOVE_OWNER', 'The workspace owner cannot be removed.');
      if (target.userId === user.id) throw new ApiError(400, 'CANNOT_REMOVE_SELF', 'You cannot remove yourself from the team.');
      db.workspaceMembers = db.workspaceMembers.filter((m) => m.id !== target.id);
    }, { workspaceId: workspace.id });
    await writeAuditLog({ workspaceId: workspace.id, actorUserId: user.id, action: 'team_member.removed', entityType: 'workspace_member', entityId: memberId });
    return jsonOk({ removed: true });
  } catch (error) { return handleApiError(error); }
}
