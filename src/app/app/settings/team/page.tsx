import { requirePageWorkspace } from '@/lib/server/auth';

export const metadata = { title: 'Team settings | ProcureIQ' };
export default async function TeamSettingsPage() { const { workspace } = await requirePageWorkspace(); return <main><section className="app-shell"><p className="eyebrow">Team settings</p><h1>Team access for {workspace.name}</h1><div className="settings-card"><p>Invite management, role changes, and member deactivation will build on the Owner, Admin, Member, and Viewer role model.</p></div></section></main>; }
