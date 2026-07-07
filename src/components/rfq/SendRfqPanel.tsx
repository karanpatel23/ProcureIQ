'use client';
import { useState } from 'react';

type Recipient = { id: string; name: string; email?: string };
type Props = { rfqId: string; recipients: Recipient[]; alreadySent: boolean };

export function SendRfqPanel({ rfqId, recipients, alreadySent }: Props) {
  const emailable = recipients.filter((r) => r.email);
  const [selected, setSelected] = useState<Set<string>>(new Set(emailable.map((r) => r.id)));
  const [status, setStatus] = useState('');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  function toggle(id: string) {
    setSelected((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  }

  async function send() {
    setSending(true); setStatus('');
    try {
      const response = await fetch(`/api/rfqs/${rfqId}/send`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ supplierIds: [...selected] }) });
      const result = await response.json();
      if (!result.ok) { setStatus(result.error?.message ?? 'Could not send the RFQ.'); return; }
      setStatus(result.data.message);
      setDone(true);
      setTimeout(() => window.location.reload(), 1400);
    } catch {
      setStatus('Unable to reach the server. Please try again.');
    } finally {
      setSending(false);
    }
  }

  if (recipients.length === 0) {
    return <section className="send-panel"><h2>Send RFQ</h2><p>Select suppliers on the RFQ before sending.</p></section>;
  }

  return (
    <section className="send-panel">
      <div className="section-heading"><h2>Send RFQ to suppliers</h2>{alreadySent && <span className="status-badge">Already sent</span>}</div>
      <p className="form-hint">Choose recipients and send the request in one step. Suppliers without an email on file are listed for manual follow-up.</p>
      <ul className="recipient-list">
        {recipients.map((r) => (
          <li key={r.id} className={r.email ? '' : 'no-email'}>
            <label className="check-row">
              <input type="checkbox" checked={selected.has(r.id)} disabled={!r.email} onChange={() => toggle(r.id)} />
              <span><b>{r.name}</b>{r.email ? <em>{r.email}</em> : <em className="muted">No email — send manually</em>}</span>
            </label>
          </li>
        ))}
      </ul>
      {status && <p className={done ? 'form-hint' : 'form-error'} role="status">{status}</p>}
      <div className="form-actions">
        <button className="button primary" onClick={send} disabled={sending || selected.size === 0}>
          {sending ? 'Sending…' : `Send to ${selected.size} supplier${selected.size === 1 ? '' : 's'}`}
        </button>
      </div>
    </section>
  );
}
