'use client';
import { useState } from 'react';
import { track } from '@vercel/analytics';

type LeadFormProps = { type: 'demo' | 'contact'; cta: string };
const workflows = ['Materials', 'Parts', 'Equipment', 'Subcontractors', 'Packaging', 'Services', 'Other'];

export function LeadForm({ type, cta }: LeadFormProps) {
  const [status, setStatus] = useState('');
  const [sending, setSending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setSending(true);
    setStatus('Sending request...');
    try {
      const form = new FormData(formElement);
      const payload = Object.fromEntries(form.entries());
      const response = await fetch('/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...payload, type }) });
      const body = await response.json();
      if (response.ok) {
        track('lead_submitted', { type });
        setStatus(body.data?.message ?? 'Thanks — the ProcureIQ team will follow up shortly.');
        formElement.reset();
      } else {
        setStatus(body.error?.message ?? 'Unable to submit request. Please check the required fields and try again.');
      }
    } catch {
      setStatus('Unable to reach the server. Please try again in a moment.');
    } finally {
      setSending(false);
    }
  }

  return <form className="lead-form" onSubmit={submit}>
    <div className="form-grid"><label>Name<input name="name" required minLength={2} /></label><label>Work email<input name="workEmail" type="email" required /></label><label>Company<input name="company" required minLength={2} /></label></div>
    <div className="form-grid"><label>Industry<input name="industry" placeholder="Manufacturing, construction, distribution..." /></label><label>Main purchasing workflow<select name="mainPurchasingWorkflow"><option value="">Select workflow</option>{workflows.map((item) => <option key={item}>{item}</option>)}</select></label><label>Estimated supplier quotes per month<input name="estimatedSupplierQuotesPerMonth" placeholder="25, 100, 500..." /></label></div>
    <label>Current tools<input name="currentTools" placeholder="Email, Excel, ERP/MRP, QuickBooks, shared drives..." /></label>
    <label>Message<textarea name="message" placeholder="Tell us where quote comparison, RFQs, or PO draft work slows your team down." /></label>
    <div className="form-actions"><button className="button primary" type="submit" disabled={sending}>{sending ? 'Sending…' : cta}</button>{status && <p className="form-hint" role="status">{status}</p>}</div>
  </form>;
}
