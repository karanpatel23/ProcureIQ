import { ApiError, handleApiError, jsonOk, parseJson } from '@/lib/server/api';
import { writeAuditLog } from '@/lib/server/audit';
import { requireWorkspace } from '@/lib/server/auth';
import { createId, mutateDb, now, readDb } from '@/lib/server/db';
import { memberInviteSchema } from '@/lib/server/validation';

// List every role profile in the workspace (active users + invited teammates).
export async function GET() {
  try {
    const { workspace } = await requireWorkspace();
    const db = await readDb({ workspaceId: workspace.id });
    const members = db.workspaceMembers
      .filter((m) => m.workspaceId === workspace.id)
      .map((m) => {
        const user = db.users.find((u) => u.id === m.userId);
        return { id: m.id, role: m.role, title: m.title ?? null, status: m.status ?? 'active', name: user?.name ?? m.invitedName ?? '—', email: user?.email ?? m.invitedEmail ?? '—', createdAt: m.createdAt };
      })
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    return jsonOk({ members });
  } catch (error) { return handleApiError(error); }
}

// Add a role profile for a teammate. Owner/admin only. If a user with that
// email already exists they are linked; otherwise an invited profile is created
// that activates when that person signs up.
export async function POST(request: Request) {
  try {
    const { user, workspace } = await requireWorkspace(['owner', 'admin']);
    const input = await parseJson(request, memberInviteSchema);
    const member = await mutateDb((db) => {
      const existingUser = db.users.find((u) => u.email.toLowerCase() === input.email.toLowerCase());
      if (existingUser && db.workspaceMembers.some((m) => m.workspaceId === workspace.id && m.userId === existingUser.id)) {
        throw new ApiError(409, 'ALREADY_MEMBER', 'That person is already on this team.');
      }
      if (db.workspaceMembers.some((m) => m.workspaceId === workspace.id && (m.invitedEmail ?? '').toLowerCase() === input.email.toLowerCase())) {
        throw new ApiError(409, 'ALREADY_INVITED', 'That email has already been added to this team.');
      }
      const member = {
        id: createId('wmem'),
        workspaceId: workspace.id,
        userId: existingUser?.id ?? '',
        role: input.role,
        title: input.title,
        invitedEmail: existingUser ? undefined : input.email.toLowerCase(),
        invitedName: existingUser ? undefined : input.name,
        status: (existingUser ? 'active' : 'invited') as 'active' | 'invited',
        createdAt: now(),
      };
      db.workspaceMembers.push(member);
      return member;
    }, { workspaceId: workspace.id });
    await writeAuditLog({ workspaceId: workspace.id, actorUserId: user.id, action: 'team_member.added', entityType: 'workspace_member', entityId: member.id, metadata: { role: member.role, title: member.title, status: member.status } });
    return jsonOk({ member }, { status: 201 });
  } catch (error) { return handleApiError(error); }
}
