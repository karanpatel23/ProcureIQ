'use client';

import { FormEvent, useState } from 'react';
import type { Supplier } from '@/lib/server/schema';

export function SupplierForm({ supplier }: { supplier?: Supplier }) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setLoading(true);
    const form = new FormData(event.currentTarget);
    const payload = { ...Object.fromEntries(['name','contactPerson','email','phone','website','category','typicalItems','paymentTerms','notes','status'].map((key) => [key, String(form.get(key) ?? '')])), preferred: form.get('preferred') === 'on' };
    const response = await fetch(supplier ? `/api/suppliers/${supplier.id}` : '/api/suppliers', { method: supplier ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const result = await response.json(); setLoading(false);
    if (!result.ok) { setError(result.error?.message ?? 'Could not save supplier.'); return; }
    window.location.href = `/app/suppliers/${result.data.supplier.id}`;
  }
  async function archiveSupplier() { if (!supplier) return; setLoading(true); const response = await fetch(`/api/suppliers/${supplier.id}`, { method: 'DELETE' }); const result = await response.json(); if (!result.ok) { setError(result.error?.message ?? 'Could not archive supplier.'); setLoading(false); return; } window.location.href = '/app/suppliers'; }
  return <form className="auth-form" onSubmit={onSubmit}><label>Supplier name<input name="name" required defaultValue={supplier?.name} /></label><label>Contact person<input name="contactPerson" defaultValue={supplier?.contactPerson} /></label><label>Email<input name="email" type="email" defaultValue={supplier?.email} /></label><label>Phone<input name="phone" defaultValue={supplier?.phone} /></label><label>Website<input name="website" type="url" defaultValue={supplier?.website} /></label><label>Category<input name="category" defaultValue={supplier?.category} placeholder="Metals, packaging, components…" /></label><label>Typical items/services<textarea name="typicalItems" defaultValue={supplier?.typicalItems} /></label><label>Payment terms<input name="paymentTerms" defaultValue={supplier?.paymentTerms} placeholder="Net 30, card, deposit…" /></label><label>Notes<textarea name="notes" defaultValue={supplier?.notes} /></label><label>Status<select name="status" defaultValue={supplier?.status ?? 'active'}><option value="active">Active</option><option value="inactive">Inactive</option></select></label><label className="check-row"><input type="checkbox" name="preferred" defaultChecked={supplier?.preferred ?? false} />Preferred supplier <span>Purchasing policy fast-tracks preferred suppliers and flags decisions that pick anyone else.</span></label>{error && <p className="form-error" role="alert">{error}</p>}<div className="form-actions"><button className="button primary" disabled={loading}>{loading ? 'Saving…' : supplier ? 'Save supplier' : 'Create supplier'}</button>{supplier && <button className="button secondary" type="button" onClick={archiveSupplier} disabled={loading}>Archive supplier</button>}</div></form>;
}
