'use client';

import { FormEvent, useRef, useState } from 'react';
import type { Rfq, RfqItem, Supplier } from '@/lib/server/schema';

type Props = { suppliers: Supplier[]; rfq?: Rfq; items?: RfqItem[] };
type Suggestion = { code: string; severity: 'info' | 'warning'; field: string; message: string; suggestion?: string };
type Advice = { score: number; readyToSend: boolean; suggestions: Suggestion[] };

export function RfqForm({ suppliers, rfq, items = [] }: Props) {
  const [rows, setRows] = useState(Math.max(items.length, 1));
  const [error, setError] = useState('');
  const [emailDraft, setEmailDraft] = useState(rfq?.emailDraft ?? '');
  const [loading, setLoading] = useState(false);
  const [advice, setAdvice] = useState<Advice | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  function collect() {
    const form = new FormData(formRef.current ?? undefined);
    return {
      title: String(form.get('title') ?? ''),
      description: String(form.get('description') ?? ''),
      neededBy: String(form.get('neededBy') ?? ''),
      deliveryLocation: String(form.get('deliveryLocation') ?? ''),
      internalReference: String(form.get('internalReference') ?? ''),
      supplierIds: form.getAll('supplierIds').map(String),
      items: Array.from({ length: rows }).map((_, index) => ({ itemName: String(form.get(`itemName-${index}`) ?? ''), description: String(form.get(`description-${index}`) ?? ''), quantity: Number(form.get(`quantity-${index}`) ?? 0), unit: String(form.get(`unit-${index}`) ?? ''), requiredDate: String(form.get(`requiredDate-${index}`) ?? ''), notes: String(form.get(`notes-${index}`) ?? '') })).filter((item) => item.itemName),
    };
  }

  async function reviewWithAi() {
    setReviewing(true); setError('');
    const payload = collect();
    try {
      const response = await fetch('/api/rfqs/advisor', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...payload, supplierCount: payload.supplierIds.length }) });
      const result = await response.json();
      if (!result.ok) { setError(result.error?.message ?? 'AI review is unavailable right now. You can still save and send manually.'); return; }
      setAdvice(result.data.advice);
    } catch {
      setError('AI review is unavailable right now. You can still save and send manually.');
    } finally {
      setReviewing(false);
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setLoading(true);
    const payload = collect();
    try {
      const response = await fetch(rfq ? `/api/rfqs/${rfq.id}` : '/api/rfqs', { method: rfq ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (!result.ok) { setError(result.error?.message ?? 'Could not save RFQ.'); return; }
      setEmailDraft(result.data.rfq.emailDraft ?? '');
      window.history.replaceState(null, '', `/app/rfqs/${result.data.rfq.id}`);
    } catch {
      setError('Unable to reach the server. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return <div className="rfq-builder"><form className="auth-form" ref={formRef} onSubmit={onSubmit}><label>RFQ title<input name="title" required defaultValue={rfq?.title} /></label><label>Description/specification<textarea name="description" defaultValue={rfq?.description} /></label><div className="form-grid"><label>Needed by date<input name="neededBy" type="date" defaultValue={rfq?.neededBy} /></label><label>Delivery location<input name="deliveryLocation" defaultValue={rfq?.deliveryLocation} /></label><label>Internal reference/project<input name="internalReference" defaultValue={rfq?.internalReference} /></label></div><fieldset><legend>Select suppliers</legend>{suppliers.map((supplier) => <label className="check-row" key={supplier.id}><input type="checkbox" name="supplierIds" value={supplier.id} defaultChecked={rfq?.supplierIds.includes(supplier.id)} />{supplier.name}{!supplier.email && <span className="form-hint"> · no email on file</span>}</label>)}{suppliers.length === 0 && <p>Add suppliers before preparing a request.</p>}</fieldset><div className="line-items"><div className="section-heading"><h2>Line items</h2><button className="button secondary" type="button" onClick={() => setRows(rows + 1)}>Add line</button></div>{Array.from({ length: rows }).map((_, index) => { const item = items[index]; return <div className="line-item-card" key={index}><label>Item name<input name={`itemName-${index}`} defaultValue={item?.itemName} required={index === 0} /></label><label>Description/spec<textarea name={`description-${index}`} defaultValue={item?.description} /></label><div className="form-grid"><label>Quantity<input name={`quantity-${index}`} type="number" min="0" step="0.01" defaultValue={item?.quantity ?? 1} /></label><label>Unit<input name={`unit-${index}`} defaultValue={item?.unit} placeholder="ea, lbs, ft…" /></label><label>Required date<input name={`requiredDate-${index}`} type="date" defaultValue={item?.requiredDate} /></label></div><label>Notes<input name={`notes-${index}`} defaultValue={item?.notes} /></label></div>; })}</div>{error && <p className="form-error" role="alert">{error}</p>}<div className="form-actions"><button className="button primary" disabled={loading}>{loading ? 'Saving…' : 'Save as draft'}</button><button className="button secondary" type="button" onClick={reviewWithAi} disabled={reviewing}>{reviewing ? 'Reviewing…' : 'Review with AI'}</button></div></form><aside className="rfq-side"><section className="advisor-card"><div className="section-heading"><h2>AI RFQ review</h2>{advice && <span className={`advisor-score ${advice.readyToSend ? 'ready' : 'attention'}`}>{advice.score}/100</span>}</div>{!advice && <p>Run an AI review to catch missing fields, vague requirements, and specification gaps before you send. Every suggestion is optional and editable.</p>}{advice && advice.suggestions.length === 0 && <p>This request looks complete and specific. You are ready to send.</p>}{advice && advice.suggestions.length > 0 && <ul className="advisor-list">{advice.suggestions.map((s, i) => <li key={i} className={`advisor-item ${s.severity}`}><b>{s.field}</b><span>{s.message}</span>{s.suggestion && <em>Suggested: {s.suggestion}</em>}</li>)}</ul>}</section><section className="email-draft"><h2>RFQ email draft</h2><pre>{emailDraft || 'Save the RFQ to generate a professional supplier email draft.'}</pre>{emailDraft && <button className="button secondary" type="button" onClick={() => navigator.clipboard.writeText(emailDraft)}>Copy email</button>}</section></aside></div>;
}
