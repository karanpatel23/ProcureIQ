import { DeleteAccountForm } from '@/components/settings/DeleteAccountForm';
import { requirePageWorkspace } from '@/lib/server/auth';
import { readDb } from '@/lib/server/db';

export const metadata = { title: 'Account | ProcureIQ' };

export default async function AccountSettingsPage() {
  const { user, workspace, membership } = await requirePageWorkspace();
  const db = await readDb();
  // True when the user owns this workspace and other account-backed members exist.
  const ownsSharedWorkspace = membership.role === 'owner'
    && db.workspaceMembers.some((m) => m.workspaceId === workspace.id && m.userId && m.userId !== user.id);

  return (
    <main>
      <section className="app-shell">
        <div className="page-head">
          <p className="eyebrow">Account</p>
          <h1>Your account</h1>
          <p>Manage your personal account for ProcureIQ.</p>
        </div>

        <div className="settings-card">
          <dl>
            <div><dt>Name</dt><dd>{user.name}</dd></div>
            <div><dt>Email</dt><dd>{user.email}</dd></div>
            <div><dt>Role</dt><dd>{membership.role}{membership.title ? ` · ${membership.title}` : ''}</dd></div>
            <div><dt>Workspace</dt><dd>{workspace.name}</dd></div>
          </dl>
        </div>

        <DeleteAccountForm email={user.email} ownsSharedWorkspace={ownsSharedWorkspace} />
      </section>
    </main>
  );
}
