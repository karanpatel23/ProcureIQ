import Link from 'next/link';
import { requirePageWorkspace } from '@/lib/server/auth';
import { readDb } from '@/lib/server/db';

export const metadata = { title: 'RFQs | ProcureIQ' };
export default async function RfqsPage() { const { workspace } = await requirePageWorkspace(); const db = await readDb(); const rfqs = db.rfqs.filter((item) => item.workspaceId === workspace.id); return <main><section className="app-shell"><div className="app-top"><div><p className="eyebrow">RFQs</p><h1>RFQ workspace.</h1><p>Create supplier requests, add line items, and generate a clean email draft.</p></div><Link className="button primary" href="/app/rfqs/new">Create RFQ</Link></div><div className="list-panel">{rfqs.map((rfq) => <Link className="list-row" href={`/app/rfqs/${rfq.id}`} key={rfq.id}><strong>{rfq.title}</strong><span>{rfq.status} · {rfq.supplierIds.length} suppliers · needed by {rfq.neededBy || 'not set'}</span></Link>)}{rfqs.length === 0 && <p>No RFQs yet. Create your first request to compare supplier responses.</p>}</div></section></main>; }
