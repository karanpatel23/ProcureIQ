import Link from 'next/link';
import { SupplierForm } from '@/components/auth/SupplierForm';
import { requirePageWorkspace } from '@/lib/server/auth';
import { readDb } from '@/lib/server/db';

export const metadata = { title: 'Suppliers | ProcureIQ' };
export default async function SuppliersPage() { const { workspace } = await requirePageWorkspace(); const db = await readDb(); const suppliers = db.suppliers.filter((item) => item.workspaceId === workspace.id && !item.archivedAt); return <main><section className="app-shell"><div className="app-top"><div><p className="eyebrow">Suppliers</p><h1>Supplier management.</h1><p>Create and maintain the supplier memory that powers quote comparison.</p></div></div><div className="split-grid"><SupplierForm /><div className="list-panel">{suppliers.map((supplier) => <Link className="list-row" href={`/app/suppliers/${supplier.id}`} key={supplier.id}><strong>{supplier.name}</strong><span>{supplier.category || 'General supplier'} · {supplier.status}</span></Link>)}{suppliers.length === 0 && <p>No suppliers yet. Add your first supplier to start building RFQs.</p>}</div></div></section></main>; }
