import Link from 'next/link';
import { requirePageWorkspace } from '@/lib/server/auth';
import { readDb } from '@/lib/server/db';

export const metadata = { title: 'Dashboard', description: 'ProcureIQ workspace dashboard.' };

export default async function DashboardPage() {
  const { user, workspace, membership } = await requirePageWorkspace();
  const db = await readDb();
  const scopedRfqs = db.rfqs.filter((item) => item.workspaceId === workspace.id);
  const scopedQuotes = db.supplierQuotes.filter((item) => item.workspaceId === workspace.id);
  const cards = [
    ['Active RFQs', scopedRfqs.filter((rfq) => rfq.status !== 'archived').length],
    ['Quotes received', scopedQuotes.length],
    ['Quotes pending review', scopedQuotes.filter((quote) => quote.status === 'needs_review' || quote.extractionStatus === 'needs_review').length],
    ['PO drafts', db.purchaseOrderDrafts.filter((item) => item.workspaceId === workspace.id).length],
    ['Active suppliers', db.suppliers.filter((item) => item.workspaceId === workspace.id && item.status === 'active').length],
    ['Audit events', db.auditLogs.filter((item) => item.workspaceId === workspace.id).length],
  ] as const;

  return (
    <main>
      <section className="app-shell">
        <div className="app-top">
          <div>
            <p className="eyebrow">Workspace dashboard</p>
            <h1>{workspace.name}</h1>
            <p>Welcome back, {user.name}. Your role is {membership.role}.</p>
          </div>
          <Link className="button primary" href="/app/rfqs/new">Create RFQ</Link>
        </div>
        <div className="dashboard-grid">
          {cards.map(([label, value]) => (
            <article key={label}><strong>{value}</strong><span>{label}</span></article>
          ))}
        </div>
        <section className="workflow-visual" aria-label="RFQ workflow">
          <span>RFQ</span><i /> <span>Quotes</span><i /> <span>Compare</span><i /> <span>Approve</span><i /> <span>PO</span>
        </section>
        <section className="workspace-panel">
          <h2>Your decision workflow</h2>
          <p>Create suppliers, prepare RFQs, review quote extractions, compare options, and draft purchase orders — every record scoped to {workspace.name}.</p>
        </section>
      </section>
    </main>
  );
}
