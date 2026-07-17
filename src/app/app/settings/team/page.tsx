import { TeamManager } from '@/components/settings/TeamManager';
import { canManageWorkspace, requirePageWorkspace } from '@/lib/server/auth';
import { readDb } from '@/lib/server/db';

export const metadata = { title: 'Team & roles | Corven' };

export default async function TeamSettingsPage() {
  const { workspace, membership } = await requirePageWorkspace();
  const db = await readDb({ workspaceId: workspace.id });
  const members = db.workspaceMembers
    .filter((m) => m.workspaceId === workspace.id)
    .map((m) => {
      const user = db.users.find((u) => u.id === m.userId);
      return { id: m.id, role: m.role, title: m.title ?? null, status: m.status ?? 'active', name: user?.name ?? m.invitedName ?? '—', email: user?.email ?? m.invitedEmail ?? '—' };
    })
    .sort((a, b) => (a.role === 'owner' ? -1 : b.role === 'owner' ? 1 : 0));

  return (
    <main>
      <section className="app-shell">
        <div className="page-head">
          <p className="eyebrow">Team &amp; roles</p>
          <h1>Team access for {workspace.name}</h1>
          <p>Give every department its own role profile. Permission roles control what a person can do; personas describe their job function.</p>
        </div>
        <TeamManager initialMembers={members} canManage={canManageWorkspace(membership.role)} />
      </section>
    </main>
  );
}
