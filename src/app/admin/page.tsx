import { requirePageInternalAdmin } from '@/lib/server/auth';
import { readDb } from '@/lib/server/db';

export const metadata = { title: 'Internal admin | ProcureIQ' };

export default async function AdminPage() {
  await requirePageInternalAdmin();
  const db = await readDb();
  const workspaces = db.workspaces.map((workspace) => ({ workspace, members: db.workspaceMembers.filter((member) => member.workspaceId === workspace.id).length, rfqs: db.rfqs.filter((rfq) => rfq.workspaceId === workspace.id).length, quotes: db.quoteDocuments.filter((doc) => doc.workspaceId === workspace.id).length, runs: db.aiExtractionRuns.filter((run) => run.workspaceId === workspace.id).length }));
  return <main><section className="app-shell"><p className="eyebrow">Internal admin</p><h1>Customer interest and usage overview.</h1><div className="analytics-grid"><section className="settings-card"><h2>Demo and contact requests</h2>{db.leadRequests.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((lead) => <article className="admin-row" key={lead.id}><strong>{lead.company}</strong><span>{lead.type} · {lead.name} · {lead.workEmail}</span><p>{lead.message || 'No message provided.'}</p></article>)}{db.leadRequests.length === 0 && <p>No demo or contact requests yet.</p>}</section><section className="settings-card"><h2>Workspace list</h2>{workspaces.map(({ workspace, members, rfqs, quotes, runs }) => <article className="admin-row" key={workspace.id}><strong>{workspace.name}</strong><span>{workspace.plan} · {workspace.subscriptionStatus} · {members} members</span><p>{rfqs} RFQs · {quotes} quote documents · {runs} AI extraction runs</p></article>)}{workspaces.length === 0 && <p>No workspaces have been created yet.</p>}</section></div></section></main>;
}
