<<<<<<< HEAD
import Link from 'next/link';
import { requirePageWorkspace } from '@/lib/server/auth';
import { readDb } from '@/lib/server/db';
export const metadata = { title: 'Purchase Orders | ProcureIQ' };
export default async function PurchaseOrdersPage() { const { workspace } = await requirePageWorkspace(); const db = await readDb(); const pos = db.purchaseOrderDrafts.filter((po) => po.workspaceId === workspace.id) as any[]; return <main><section className="app-shell"><p className="eyebrow">Purchase orders</p><h1>Reviewable PO drafts.</h1><p>POs are never sent automatically. Review, approve internally, then export when ready.</p><div className="list-panel">{pos.map((po) => <Link className="list-row" href={`/app/purchase-orders/${po.id}`} key={po.id}><strong>{po.poNumber ?? po.id}</strong><span>{po.supplierName} · {po.status} · ${Number(po.total ?? po.subtotal ?? 0).toLocaleString()}</span></Link>)}{pos.length === 0 && <p>No PO drafts yet. Select a supplier quote from an RFQ comparison to create one.</p>}</div></section></main>; }
=======
export const metadata = { title: 'Purchase Orders | ProcureIQ' };
export default function PurchaseOrdersPage() { return <main><section className="app-shell"><p className="eyebrow">Purchase orders</p><h1>PO drafts remain human-approved.</h1><p>Approved supplier decisions will generate editable purchase order drafts here before export.</p></section></main>; }
>>>>>>> origin/main
