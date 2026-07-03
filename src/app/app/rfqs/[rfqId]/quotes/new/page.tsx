import { QuoteUploadForm } from '@/components/quotes/QuoteUploadForm';
import { requirePageWorkspace } from '@/lib/server/auth';
import { readDb } from '@/lib/server/db';
import { notFound } from 'next/navigation';
export const metadata = { title: 'Add supplier quote | ProcureIQ' };
export default async function AddQuotePage({ params }: { params: Promise<{ rfqId: string }> }) { const { workspace } = await requirePageWorkspace(); const { rfqId } = await params; const db = await readDb(); const rfq = db.rfqs.find((item) => item.id === rfqId && item.workspaceId === workspace.id); if (!rfq) notFound(); const suppliers = db.suppliers.filter((supplier) => supplier.workspaceId === workspace.id && rfq.supplierIds.includes(supplier.id) && !supplier.archivedAt); return <main><section className="app-shell"><p className="eyebrow">Add supplier quote</p><h1>Upload or paste a quote for review.</h1><p>ProcureIQ will preserve the original source, extract draft quote fields with confidence scores, and send you to a human review screen.</p><QuoteUploadForm rfqId={rfq.id} suppliers={suppliers} /></section></main>; }
