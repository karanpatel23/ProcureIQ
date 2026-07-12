import Link from 'next/link';
import { requirePageWorkspace } from '@/lib/server/auth';
import { readDb } from '@/lib/server/db';
import type { AuditLog } from '@/lib/server/schema';

export const metadata = { title: 'Activity | ProcureIQ' };

/*
 * The glass box. Every action — AI or human — lands in the audit trail; this
 * page makes that trail a first-class, readable screen: who (or which AI step)
 * did what, when, and where to look. Autonomy you can audit, not a black box.
 */
const LABELS: Record<string, string> = {
  'autopilot.intake_rfq_created': 'Autopilot built an RFQ from a pasted request',
  'autopilot.quote_accepted': 'Autopilot verified and accepted a supplier quote',
  'autopilot.quote_queued': 'Autopilot held a quote for human review',
  'autopilot.decision_queued': 'Autopilot queued a decision — policy exceptions need judgment',
  'autopilot.supplier_selected': 'Autopilot selected the winning supplier (in policy)',
  'autopilot.po_drafted': 'Autopilot drafted and reconciled the purchase order',
  'rfq.created': 'RFQ created',
  'rfq.sent': 'RFQ sent to suppliers',
  'quote.uploaded': 'Supplier quote received',
  'quote.extraction_started': 'AI extraction ran on a quote document',
  'extraction.fallback': 'Claude unreachable — local parser handled the extraction',
  'supplier.imported': 'Suppliers imported from CSV',
  'quote.approved': 'Quote approved',
  'quote.review_saved': 'Quote review saved',
  'quote_comparison.completed': 'Quote comparison completed',
  'supplier_quote.selected': 'Winning supplier selected',
  'po_draft.created': 'Purchase order draft created',
  'po.approved': 'Purchase order approved',
  'po.sent': 'Purchase order sent',
  'supplier.created': 'Supplier added',
  'supplier.updated': 'Supplier updated',
  'workspace.created': 'Workspace created',
  'workspace.updated': 'Company profile updated',
  'comparison.viewed': 'Comparison viewed',
};

function hrefFor(log: AuditLog): string | null {
  if (log.entityType === 'rfq' && log.entityId) return `/app/rfqs/${log.entityId}`;
  if (log.entityType === 'purchase_order_draft' && log.entityId) return `/app/purchase-orders/${log.entityId}`;
  if (log.entityType === 'supplier' && log.entityId) return `/app/suppliers/${log.entityId}`;
  return null;
}

export default async function ActivityPage({ searchParams }: { searchParams: Promise<{ actor?: string }> }) {
  const { workspace } = await requirePageWorkspace();
  const { actor } = await searchParams;
  const db = await readDb({ workspaceId: workspace.id });
  const users = new Map(db.users.map((user) => [user.id, user.name]));

  const all = db.auditLogs
    .filter((log) => log.workspaceId === workspace.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const aiCount = all.filter((log) => log.action.startsWith('autopilot.') || log.action === 'quote.extraction_started').length;
  const logs = all
    .filter((log) => {
      const isAi = log.action.startsWith('autopilot.') || log.action === 'quote.extraction_started';
      return actor === 'ai' ? isAi : actor === 'human' ? !isAi : true;
    })
    .slice(0, 120);

  return (
    <main>
      <section className="app-shell">
        <div className="page-head">
          <p className="eyebrow">Activity</p>
          <h1>Everything that happened — and why.</h1>
          <p>{all.length} recorded action{all.length === 1 ? '' : 's'} in {workspace.name} · {aiCount} performed by AI. Every autonomous step is logged with its reason; nothing happens off the record.</p>
        </div>

        <div className="activity-filters" role="tablist" aria-label="Filter activity">
          <Link className={`chip-link ${!actor ? 'active' : ''}`} href="/app/activity">All</Link>
          <Link className={`chip-link ${actor === 'ai' ? 'active' : ''}`} href="/app/activity?actor=ai">AI actions</Link>
          <Link className={`chip-link ${actor === 'human' ? 'active' : ''}`} href="/app/activity?actor=human">Human actions</Link>
        </div>

        {logs.length === 0 ? (
          <div className="empty-state"><h2>No activity yet</h2><p>Create an RFQ or paste a request on the RFQs page — every step will show up here.</p></div>
        ) : (
          <ol className="activity-feed">
            {logs.map((log) => {
              const isAi = log.action.startsWith('autopilot.') || log.action === 'quote.extraction_started';
              const summary = (log.metadata as { summary?: string })?.summary;
              const href = hrefFor(log);
              return (
                <li key={log.id} className={`activity-row ${isAi ? 'ai' : 'human'}`}>
                  <span className="activity-actor" aria-hidden="true">{isAi ? 'AI' : (users.get(log.actorUserId ?? '')?.[0] ?? '•').toUpperCase()}</span>
                  <div className="activity-body">
                    <b>{LABELS[log.action] ?? log.action.replaceAll(/[._]/g, ' ')}</b>
                    {summary && <span className="activity-summary">{summary}</span>}
                    <em>
                      {new Date(log.createdAt).toLocaleString()} · {isAi ? 'Autonomous (policy-bounded)' : users.get(log.actorUserId ?? '') ?? 'System'}
                      {href && <> · <Link href={href}>Open →</Link></>}
                    </em>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </main>
  );
}
