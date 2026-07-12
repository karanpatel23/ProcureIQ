import Link from 'next/link';
import { PoActions } from '@/components/po/PoActions';
import { PoEditor } from '@/components/po/PoEditor';
import { requirePageWorkspace } from '@/lib/server/auth';
import { readDb } from '@/lib/server/db';
import { notFound } from 'next/navigation';
export const metadata = { title: 'PO draft | ProcureIQ' };
export default async function PoDetailPage({ params }: { params: Promise<{ poId: string }> }) { const { workspace } = await requirePageWorkspace(); const { poId } = await params; const db = await readDb({ workspaceId: workspace.id }); const po = db.purchaseOrderDrafts.find((item) => item.id === poId && item.workspaceId === workspace.id) as any; if (!po) notFound(); return <main><section className="app-shell"><p className="eyebrow">PO draft editor</p><h1>{po.poNumber}</h1><p>Linked to <Link href={`/app/rfqs/${po.rfqId}`}>RFQ</Link>, selected quote {po.quoteReference}, and supplier {po.supplierName}. This PO remains a draft until approved internally.</p><div className="po-layout"><PoEditor po={po} /><PoActions rfqId={po.rfqId} poId={po.id} status={po.status} /></div></section></main>; }
