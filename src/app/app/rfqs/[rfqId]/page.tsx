import { RfqForm } from '@/components/auth/RfqForm';
import { SendRfqPanel } from '@/components/rfq/SendRfqPanel';
import { requirePageWorkspace } from '@/lib/server/auth';
import { readDb } from '@/lib/server/db';
import { notFound } from 'next/navigation';

export const metadata = { title: 'RFQ detail | ProcureIQ' };

export default async function RfqDetailPage({ params }: { params: Promise<{ rfqId: string }> }) {
  const { workspace } = await requirePageWorkspace();
  const { rfqId } = await params;
  const db = await readDb();
  const rfq = db.rfqs.find((item) => item.id === rfqId && item.workspaceId === workspace.id);
  if (!rfq) notFound();
  const items = db.rfqItems.filter((item) => item.rfqId === rfq.id && item.workspaceId === workspace.id);
  const suppliers = db.suppliers.filter((item) => item.workspaceId === workspace.id && !item.archivedAt);
  const selectedSuppliers = suppliers.filter((supplier) => rfq.supplierIds.includes(supplier.id));
  const auditLogs = db.auditLogs.filter((log) => log.workspaceId === workspace.id && log.entityId === rfq.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const stages = ['draft', 'sent', 'quotes_received', 'approved'] as const;
  const currentStage = stages.indexOf(rfq.status as (typeof stages)[number]);

  return (
    <main>
      <section className="app-shell">
        <div className="status-strip">
          {['Draft', 'Sent', 'Quotes', 'Compare', 'Approve', 'PO'].map((label, index) => (
            <span key={label} className={index <= currentStage ? 'active' : ''}>{label}</span>
          ))}
        </div>
        <p className="eyebrow">RFQ detail</p>
        <h1>{rfq.title}</h1>
        <div className="split-grid">
          <RfqForm rfq={rfq} items={items} suppliers={suppliers} />
          <aside className="rfq-side">
            <SendRfqPanel rfqId={rfq.id} alreadySent={rfq.status !== 'draft'} recipients={selectedSuppliers.map((s) => ({ id: s.id, name: s.name, email: s.email }))} />
            <section className="settings-card">
              <div className="form-actions">
                <a className="button primary" href={`/app/rfqs/${rfq.id}/quotes/new`}>Add supplier quote</a>
                <a className="button secondary" href={`/app/rfqs/${rfq.id}/compare`}>Compare quotes</a>
              </div>
              <h2>Request summary</h2>
              <p>Status: {rfq.status.replace('_', ' ')}</p>
              <p>Suppliers: {selectedSuppliers.map((supplier) => supplier.name).join(', ') || 'None selected'}</p>
              <h3>Audit events</h3>
              {auditLogs.map((log) => <p key={log.id}>{log.action.replace(/[._]/g, ' ')} · {new Date(log.createdAt).toLocaleString()}</p>)}
              {auditLogs.length === 0 && <p>No audit events yet.</p>}
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}
