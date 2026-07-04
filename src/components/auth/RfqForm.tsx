'use client';

import { FormEvent, useState } from 'react';
import type { Rfq, RfqItem, Supplier } from '@/lib/server/schema';

type Props = { suppliers: Supplier[]; rfq?: Rfq; items?: RfqItem[] };

export function RfqForm({ suppliers, rfq, items = [] }: Props) {
  const [rows, setRows] = useState(Math.max(items.length, 1));
  const [error, setError] = useState('');
  const [emailDraft, setEmailDraft] = useState(rfq?.emailDraft ?? '');
  const [loading, setLoading] = useState(false);
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setLoading(true);
    const form = new FormData(event.currentTarget);
    const payload = {
      title: String(form.get('title') ?? ''), description: String(form.get('description') ?? ''), neededBy: String(form.get('neededBy') ?? ''), deliveryLocation: String(form.get('deliveryLocation') ?? ''), internalReference: String(form.get('internalReference') ?? ''), supplierIds: form.getAll('supplierIds').map(String),
      items: Array.from({ length: rows }).map((_, index) => ({ itemName: String(form.get(`itemName-${index}`) ?? ''), description: String(form.get(`description-${index}`) ?? ''), quantity: Number(form.get(`quantity-${index}`) ?? 0), unit: String(form.get(`unit-${index}`) ?? ''), requiredDate: String(form.get(`requiredDate-${index}`) ?? ''), notes: String(form.get(`notes-${index}`) ?? '') })).filter((item) => item.itemName),
    };
    const response = await fetch(rfq ? `/api/rfqs/${rfq.id}` : '/api/rfqs', { method: rfq ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const result = await response.json(); setLoading(false);
    if (!result.ok) { setError(result.error?.message ?? 'Could not save RFQ.'); return; }
    setEmailDraft(result.data.rfq.emailDraft ?? ''); window.history.replaceState(null, '', `/app/rfqs/${result.data.rfq.id}`);
  }
  async function markSent() { if (!rfq) return; const response = await fetch(`/api/rfqs/${rfq.id}/mark-sent`, { method: 'POST' }); const result = await response.json(); if (!result.ok) { setError(result.error?.message ?? 'Could not mark RFQ as sent.'); return; } window.location.reload(); }
  return <div className="rfq-builder"><form className="auth-form" onSubmit={onSubmit}><label>RFQ title<input name="title" required defaultValue={rfq?.title} /></label><label>Description/specification<textarea name="description" defaultValue={rfq?.description} /></label><div className="form-grid"><label>Needed by date<input name="neededBy" type="date" defaultValue={rfq?.neededBy} /></label><label>Delivery location<input name="deliveryLocation" defaultValue={rfq?.deliveryLocation} /></label><label>Internal reference/project<input name="internalReference" defaultValue={rfq?.internalReference} /></label></div><fieldset><legend>Select suppliers</legend>{suppliers.map((supplier) => <label className="check-row" key={supplier.id}><input type="checkbox" name="supplierIds" value={supplier.id} defaultChecked={rfq?.supplierIds.includes(supplier.id)} />{supplier.name}</label>)}{suppliers.length === 0 && <p>Add suppliers before preparing a request.</p>}</fieldset><div className="line-items"><div className="section-heading"><h2>Line items</h2><button className="button secondary" type="button" onClick={() => setRows(rows + 1)}>Add line</button></div>{Array.from({ length: rows }).map((_, index) => { const item = items[index]; return <div className="line-item-card" key={index}><label>Item name<input name={`itemName-${index}`} defaultValue={item?.itemName} required={index === 0} /></label><label>Description/spec<textarea name={`description-${index}`} defaultValue={item?.description} /></label><div className="form-grid"><label>Quantity<input name={`quantity-${index}`} type="number" min="0" step="0.01" defaultValue={item?.quantity ?? 1} /></label><label>Unit<input name={`unit-${index}`} defaultValue={item?.unit} placeholder="ea, lbs, ft…" /></label><label>Required date<input name={`requiredDate-${index}`} type="date" defaultValue={item?.requiredDate} /></label></div><label>Notes<input name={`notes-${index}`} defaultValue={item?.notes} /></label></div>; })}</div>{error && <p className="form-error" role="alert">{error}</p>}<div className="form-actions"><button className="button primary" disabled={loading}>{loading ? 'Saving…' : 'Save as draft'}</button>{rfq && <button className="button secondary" type="button" onClick={markSent}>Mark as sent manually</button>}</div></form><aside className="email-draft"><h2>RFQ email draft</h2><pre>{emailDraft || 'Save the RFQ to generate a professional supplier email draft.'}</pre><button className="button secondary" type="button" onClick={() => navigator.clipboard.writeText(emailDraft)}>Copy email</button></aside></div>;
}
