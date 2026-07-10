'use client';

import { FormEvent, useState } from 'react';

/** Paste a raw request (email, chat, one sentence) — AI builds the RFQ itself. */
export function IntakePanel() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [built, setBuilt] = useState<null | { title: string; items: number; suppliers: string[]; missing: string[]; next: string }>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setBusy(true);
    const text = String(new FormData(event.currentTarget).get('text') ?? '');
    try {
      const response = await fetch('/api/intake', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) });
      const result = await response.json();
      if (!result.ok) { setError(result.error?.message ?? 'Could not build an RFQ from that.'); setBusy(false); return; }
      setBuilt({ title: result.data.rfq.title, items: result.data.items.length, suppliers: result.data.matchedSuppliers.map((s: { name: string }) => s.name), missing: result.data.missing, next: result.data.next });
      setTimeout(() => { window.location.href = result.data.next; }, 1600);
    } catch {
      setError('Unable to reach the server. Please try again.');
      setBusy(false);
    }
  }

  if (built) {
    return (
      <div className="intake-panel done" role="status">
        <p className="eyebrow">Intake handled</p>
        <h2>AI built the RFQ: {built.title}</h2>
        <p>{built.items} line item{built.items === 1 ? '' : 's'} parsed · {built.suppliers.length ? `matched suppliers: ${built.suppliers.join(', ')}` : 'no matching suppliers found yet'}.</p>
        {built.missing.length > 0 && <p className="form-hint">Gaps it couldn’t find (not guessed): {built.missing.join(' ')}</p>}
        <p className="form-hint">Opening the RFQ…</p>
      </div>
    );
  }

  return (
    <form className="intake-panel" onSubmit={onSubmit}>
      <p className="eyebrow">Autonomous intake</p>
      <h2>Paste a request — AI builds the RFQ.</h2>
      <p className="form-hint">Drop in an email or a sentence like “We need 20 guard brackets and 50 M8 bolts by Aug 1, deliver to Plant 2.” Items, quantities, dates, and matching suppliers are extracted automatically — nothing is invented.</p>
      <textarea name="text" required minLength={10} rows={4} placeholder="We need 20 guard brackets and 50 M8 hex bolts by Aug 1. Deliver to Plant 2, Cleveland." />
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="form-actions"><button className="button primary" disabled={busy}>{busy ? 'Building RFQ…' : 'Build the RFQ for me'}</button></div>
    </form>
  );
}
