import Link from 'next/link';
import { requirePageWorkspace } from '@/lib/server/auth';
import { readDb } from '@/lib/server/db';

export const metadata = { title: 'Dashboard', description: 'ProcureIQ workspace dashboard.' };

export default async function DashboardPage() {
  const { user, workspace, membership } = await requirePageWorkspace();
  const db = await readDb({ workspaceId: workspace.id });
  const scopedRfqs = db.rfqs.filter((item) => item.workspaceId === workspace.id);
  const scopedQuotes = db.supplierQuotes.filter((item) => item.workspaceId === workspace.id);

  // Decision queue: comparison runs awaiting a human, split by policy verdict.
  // In-policy decisions are one click; exceptions are the only ones that need thought.
  const awaiting = db.workflowRuns.filter((run) => run.workspaceId === workspace.id && run.type === 'quote_comparison' && run.status === 'awaiting_approval');
  const policyOf = (run: (typeof awaiting)[number]) => (run.state as { policy?: { status?: string; exceptions?: unknown[] } } | null)?.policy;
  const inPolicy = awaiting.filter((run) => policyOf(run)?.status === 'in_policy');
  const withExceptions = awaiting.filter((run) => policyOf(run)?.status === 'exceptions');
  const latestExceptions = withExceptions.slice(-3).reverse().flatMap((run) => {
    const policy = policyOf(run) as { exceptions?: Array<{ title?: string }> } | undefined;
    const rfq = scopedRfqs.find((item) => item.id === run.entityId);
    return (policy?.exceptions ?? []).slice(0, 2).map((exception, index) => ({ key: `${run.id}-${index}`, rfqId: run.entityId, rfqTitle: rfq?.title ?? 'RFQ', title: exception.title ?? 'Exception' }));
  });

  const autopilotActions = db.auditLogs.filter((item) => item.workspaceId === workspace.id && item.action.startsWith('autopilot.')).length;
  const cards = [
    ['Autopilot actions', autopilotActions],
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
        {awaiting.length > 0 && (
          <section className="decision-queue" aria-label="Decision queue">
            <div className="decision-queue-head">
              <div>
                <p className="eyebrow">Decision queue</p>
                <h2>{awaiting.length} decision{awaiting.length === 1 ? '' : 's'} waiting</h2>
                <p>{inPolicy.length} in policy — one click to approve · {withExceptions.length} with exceptions that need your judgment. Everything else was checked for you.</p>
              </div>
            </div>
            {latestExceptions.length > 0 && (
              <ul className="decision-queue-list">
                {latestExceptions.map((item) => (
                  <li key={item.key}>
                    <span className="status-tag invited">exception</span>
                    <span className="dq-title">{item.rfqTitle}: {item.title}</span>
                    {item.rfqId && <Link href={`/app/rfqs/${item.rfqId}/compare`}>Review →</Link>}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
        <div className="dashboard-grid">
          {cards.filter(([, value]) => Number(value) > 0).map(([label, value]) => (
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
