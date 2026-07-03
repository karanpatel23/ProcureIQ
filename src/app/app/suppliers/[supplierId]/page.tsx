import { SupplierForm } from '@/components/auth/SupplierForm';
import { requirePageWorkspace } from '@/lib/server/auth';
import { readDb } from '@/lib/server/db';
import { notFound } from 'next/navigation';

export const metadata = { title: 'Supplier detail | ProcureIQ' };
export default async function SupplierDetailPage({ params }: { params: Promise<{ supplierId: string }> }) { const { workspace } = await requirePageWorkspace(); const { supplierId } = await params; const db = await readDb(); const supplier = db.suppliers.find((item) => item.id === supplierId && item.workspaceId === workspace.id && !item.archivedAt); if (!supplier) notFound(); return <main><section className="app-shell"><p className="eyebrow">Supplier detail</p><h1>{supplier.name}</h1><div className="split-grid"><SupplierForm supplier={supplier} /><div className="settings-card"><h2>Supplier profile</h2><p>{supplier.typicalItems || 'Typical items and services can be added here.'}</p><p>{supplier.notes || 'No supplier notes yet.'}</p></div></div></section></main>; }
