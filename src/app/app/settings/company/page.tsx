import { requirePageWorkspace } from '@/lib/server/auth';

export const metadata = { title: 'Company settings | ProcureIQ' };
export default async function CompanySettingsPage() { const { workspace, membership } = await requirePageWorkspace(); return <main><section className="app-shell"><p className="eyebrow">Company settings</p><h1>{workspace.name}</h1><div className="settings-card"><dl><div><dt>Industry</dt><dd>{workspace.industryCategory}</dd></div><div><dt>Main workflow</dt><dd>{workspace.mainPurchasingWorkflow}</dd></div><div><dt>Tools</dt><dd>{workspace.currentTools.join(', ')}</dd></div><div><dt>Your role</dt><dd>{membership.role}</dd></div></dl><p>Editing controls will use the same role-based permission helpers and audit logging foundation.</p></div></section></main>; }
