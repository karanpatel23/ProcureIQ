'use client';

import { FormEvent, useRef, useState } from 'react';
import type { Rfq, RfqItem, Supplier } from '@/lib/server/schema';

type Props = { suppliers: Supplier[]; rfq?: Rfq; items?: RfqItem[] };
type OpenItem = { field: string; message: string; suggestion?: string; severity: 'info' | 'warning' };
type TraceStep = { index: number; phase: string; summary: string; confidence?: number; changed?: string[] };
type LoopResult = {
  runId: string;
  score: number;
  readyToSend: boolean;
  refinedDraft: { title?: string; items?: Array<{ unit?: string }> };
  openItems: OpenItem[];
  trace: TraceStep[];
  supplierReadyDraft: string;
};

const PHASE_LABEL: Record<string, string> = {
  understand: 'Understand', draft: 'Draft', self_review: 'Self-review', refine: 'Refine', await_approval: 'Awaiting your approval', finalize: 'Finalize', fallback: 'Manual fallback',
};

export function RfqForm({ suppliers, rfq, items = [] }: Props) {
  const [rows, setRows] = useState(Math.max(items.length, 1));
  const [error, setError] = useState('');
  const [emailDraft, setEmailDraft] = useState(rfq?.emailDraft ?? '');
  const [loading, setLoading] = useState(false);
  const [building, setBuilding] = useState(false);
  const [loop, setLoop] = useState<LoopResult | null>(null);
  const [applied, setApplied] = useState(false);
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

  function fillIfBlank(name: string, value: string) {
    const el = formRef.current?.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement | null;
    if (el && !el.value) el.value = value; // only fill blanks — never overwrite the user
  }

  // Run the bounded RFQ Builder Loop: it reviews, safely improves, and returns
  // an editable refined draft plus the reasoning trace and open items.
  async function buildWithAi() {
    setBuilding(true); setError(''); setApplied(false);
    const payload = collect();
    try {
      const response = await fetch('/api/rfqs/loop', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draft: { title: payload.title, description: payload.description, neededBy: payload.neededBy, deliveryLocation: payload.deliveryLocation, supplierCount: payload.supplierIds.length, items: payload.items.map((i) => ({ itemName: i.itemName, description: i.description, quantity: i.quantity, unit: i.unit })) } }),
      });
      const result = await response.json();
      if (!result.ok) { setError(result.error?.message ?? 'AI build is unavailable right now — you can still save and send manually.'); return; }
      setLoop(result.data as LoopResult);
    } catch {
      setError('AI build is unavailable right now — you can still save and send manually.');
    } finally {
      setBuilding(false);
    }
  }

  // Apply the AI's safe improvements into the form. Only fills blank fields.
  function applyAiImprovements() {
    if (!loop) return;
    if (loop.refinedDraft.title) fillIfBlank('title', loop.refinedDraft.title);
    loop.refinedDraft.items?.forEach((item, index) => { if (item.unit) fillIfBlank(`unit-${index}`, item.unit); });
    setApplied(true);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setLoading(true);
    const payload = collect();
    try {
      const response = await fetch(rfq ? `/api/rfqs/${rfq.id}` : '/api/rfqs', { method: rfq ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (!result.ok) { setError(result.error?.message ?? 'Could not save RFQ.'); return; }
      setEmailDraft(result.data.rfq.emailDraft ?? '');
      window.location.href = `/app/rfqs/${result.data.rfq.id}`;
    } catch {
      setError('Unable to reach the server. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const safeFixCount = loop?.trace.reduce((n, s) => n + (s.changed?.length ?? 0), 0) ?? 0;

  return (
    <div className="rfq-builder">
      <form className="auth-form" ref={formRef} onSubmit={onSubmit}>
        <label>RFQ title<input name="title" required defaultValue={rfq?.title} /></label>
        <label>Description/specification<textarea name="description" defaultValue={rfq?.description} /></label>
        <div className="form-grid">
          <label>Needed by date<input name="neededBy" type="date" defaultValue={rfq?.neededBy} /></label>
          <label>Delivery location<input name="deliveryLocation" defaultValue={rfq?.deliveryLocation} /></label>
          <label>Internal reference/project<input name="internalReference" defaultValue={rfq?.internalReference} /></label>
        </div>
        <fieldset>
          <legend>Select suppliers</legend>
          {suppliers.map((supplier) => (
            <label className="check-row" key={supplier.id}><input type="checkbox" name="supplierIds" value={supplier.id} defaultChecked={rfq?.supplierIds.includes(supplier.id)} />{supplier.name}{!supplier.email && <span className="form-hint"> · no email on file</span>}</label>
          ))}
          {suppliers.length === 0 && <p>Add suppliers before preparing a request.</p>}
        </fieldset>
        <div className="line-items">
          <div className="section-heading"><h2>Line items</h2><button className="button secondary" type="button" onClick={() => setRows(rows + 1)}>Add line</button></div>
          {Array.from({ length: rows }).map((_, index) => {
            const item = items[index];
            return (
              <div className="line-item-card" key={index}>
                <label>Item name<input name={`itemName-${index}`} defaultValue={item?.itemName} required={index === 0} /></label>
                <label>Description/spec<textarea name={`description-${index}`} defaultValue={item?.description} /></label>
                <div className="form-grid">
                  <label>Quantity<input name={`quantity-${index}`} type="number" min="0" step="0.01" defaultValue={item?.quantity ?? 1} /></label>
                  <label>Unit<input name={`unit-${index}`} defaultValue={item?.unit} placeholder="ea, lbs, ft…" /></label>
                  <label>Required date<input name={`requiredDate-${index}`} type="date" defaultValue={item?.requiredDate} /></label>
                </div>
                <label>Notes<input name={`notes-${index}`} defaultValue={item?.notes} /></label>
              </div>
            );
          })}
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="form-actions">
          <button className="button primary" disabled={loading}>{loading ? 'Saving…' : 'Save as draft'}</button>
          <button className="button secondary" type="button" onClick={buildWithAi} disabled={building}>{building ? 'AI is reviewing…' : loop ? 'Re-run AI review' : 'Build with AI'}</button>
        </div>
      </form>

      <aside className="rfq-side">
        <section className="advisor-card">
          <div className="section-heading">
            <h2>AI RFQ builder</h2>
            {loop && <span className={`advisor-score ${loop.readyToSend ? 'ready' : 'attention'}`}>{loop.score}/100</span>}
          </div>

          {!loop && !building && <p>Click <b>Build with AI</b> and ProcureIQ reviews your draft, safely fills what it can, flags what needs your input, and drafts supplier-ready language — you stay in control and approve everything.</p>}
          {building && <p className="loop-working"><span className="loop-dot" aria-hidden="true" />Reviewing your draft, checking for gaps, and improving it…</p>}

          {loop && (
            <>
              <p className={loop.readyToSend ? 'loop-verdict ready' : 'loop-verdict attention'}>
                {loop.readyToSend ? 'This request is supplier-ready.' : `${loop.openItems.filter((o) => o.severity === 'warning').length} item(s) need your input before this is supplier-ready.`}
              </p>

              <ol className="loop-trace" aria-label="AI reasoning steps">
                {loop.trace.map((step) => (
                  <li key={step.index} className="loop-step">
                    <span className="loop-phase">{PHASE_LABEL[step.phase] ?? step.phase}</span>
                    <span className="loop-summary">{step.summary}</span>
                    {typeof step.confidence === 'number' && <span className="loop-confidence">{Math.round(step.confidence * 100)}% confidence</span>}
                  </li>
                ))}
              </ol>

              {safeFixCount > 0 && (
                <div className="loop-apply">
                  <span>AI safely prepared {safeFixCount} improvement{safeFixCount === 1 ? '' : 's'} (title / units).</span>
                  <button className="button secondary" type="button" onClick={applyAiImprovements} disabled={applied}>{applied ? 'Applied ✓' : 'Apply to form'}</button>
                </div>
              )}

              {loop.openItems.length > 0 && (
                <ul className="advisor-list">
                  {loop.openItems.map((o, i) => (
                    <li key={i} className={`advisor-item ${o.severity}`}><b>{o.field}</b><span>{o.message}</span>{o.suggestion && <em>Suggested: {o.suggestion}</em>}</li>
                  ))}
                </ul>
              )}
            </>
          )}
        </section>

        <section className="email-draft">
          <h2>Supplier-ready email</h2>
          <pre>{loop?.supplierReadyDraft || emailDraft || 'Build with AI or save the RFQ to generate a professional supplier email draft.'}</pre>
          {(loop?.supplierReadyDraft || emailDraft) && <button className="button secondary" type="button" onClick={() => navigator.clipboard.writeText(loop?.supplierReadyDraft || emailDraft)}>Copy email</button>}
        </section>
      </aside>
    </div>
  );
}
