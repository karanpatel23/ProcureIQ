import Link from 'next/link';
import { SupplierForm } from '@/components/auth/SupplierForm';
import { requirePageWorkspace } from '@/lib/server/auth';
import { readDb } from '@/lib/server/db';

export const metadata = { title: 'Suppliers | ProcureIQ' };

export default async function SuppliersPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; add?: string }> }) {
  const { workspace } = await requirePageWorkspace();
  const filters = await searchParams;
  const db = await readDb();
  const q = (filters.q ?? '').toLowerCase();
  const status = filters.status ?? 'all';
  const all = db.suppliers.filter((item) => item.workspaceId === workspace.id && !item.archivedAt);
  const suppliers = all
    .filter((item) => (!q || [item.name, item.category, item.email].some((value) => String(value ?? '').toLowerCase().includes(q))) && (status === 'all' || item.status === status))
    .slice(0, 100);
  const activeCount = all.filter((s) => s.status === 'active').length;

  return (
    <main>
      <section className="app-shell">
        <div className="app-top">
          <div>
            <p className="eyebrow">Suppliers</p>
            <h1>Supplier directory</h1>
            <p>{all.length} supplier{all.length === 1 ? '' : 's'} · {activeCount} active. This directory powers RFQ recipients and quote comparison.</p>
          </div>
          <a className="button primary" href="?add=1#add-supplier">Add supplier</a>
        </div>

        <form className="filter-bar">
          <input name="q" placeholder="Search by name, category, or email" defaultValue={filters.q ?? ''} />
          <select name="status" defaultValue={status}>
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button className="button secondary">Search</button>
        </form>

        {suppliers.length > 0 ? (
          <div className="supplier-grid">
            {suppliers.map((supplier) => (
              <Link className="supplier-card" href={`/app/suppliers/${supplier.id}`} key={supplier.id}>
                <div className="supplier-card-head">
                  <strong>{supplier.name}</strong>
                  <span className={`chip ${supplier.status}`}>{supplier.status}</span>
                </div>
                <span className="supplier-meta">{supplier.category || 'General supplier'}</span>
                <span className="supplier-meta">{supplier.email || 'No email on file'}</span>
                {supplier.paymentTerms && <span className="supplier-meta">Terms: {supplier.paymentTerms}</span>}
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <h2>{all.length === 0 ? 'No suppliers yet' : 'No matches'}</h2>
            <p>{all.length === 0 ? 'Add your first supplier to start building the directory that powers RFQs and quote comparison.' : 'Try a different search or status filter.'}</p>
          </div>
        )}

        <details id="add-supplier" className="add-supplier" open={filters.add === '1' || all.length === 0}>
          <summary>Add a supplier</summary>
          <SupplierForm />
        </details>
      </section>
    </main>
  );
}
