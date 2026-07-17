'use client';

import { useState } from 'react';
import { LoopResultView, type OpenItem, type TraceStep } from '@/components/loops/LoopResultView';

type CheckResult = { readyToApprove: boolean; score: number; openItems: OpenItem[]; trace: TraceStep[] };

// Surfaces the PO Generation Loop (AI reconciliation) and the human-gated send.
export function PoActions({ rfqId, poId, status }: { rfqId: string; poId: string; status: string }) {
  const [checks, setChecks] = useState<CheckResult | null>(null);
  const [running, setRunning] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const approved = status === 'approved' || status === 'exported';

  async function runChecks() {
    setRunning(true); setError('');
    try {
      const response = await fetch(`/api/rfqs/${rfqId}/po-loop`, { method: 'POST' });
      const body = await response.json();
      if (!body.ok) { setError(body.error?.message ?? 'AI checks are unavailable right now.'); return; }
      setChecks(body.data as CheckResult);
    } catch {
      setError('AI checks are unavailable right now.');
    } finally {
      setRunning(false);
    }
  }

  async function send() {
    setSending(true); setError(''); setMessage('');
    try {
      const response = await fetch(`/api/po-drafts/${poId}/send`, { method: 'POST' });
      const body = await response.json();
      if (!body.ok) { setError(body.error?.message ?? 'Could not send the PO.'); return; }
      setMessage(body.data.message);
    } catch {
      setError('Unable to reach the server. Please try again.');
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="advisor-card po-actions">
      <div className="section-heading">
        <h2>AI checks &amp; send</h2>
        {checks && <span className={`advisor-score ${checks.readyToApprove ? 'ready' : 'attention'}`}>{checks.score}/100</span>}
      </div>

      {!checks && !running && <p>Run an AI reconciliation of this PO against the approved quote and RFQ before you approve and send.</p>}
      {running && <p className="loop-working"><span className="loop-dot" aria-hidden="true" />Reconciling the PO against the approved quote and RFQ…</p>}
      {checks && (
        <>
          <p className={checks.readyToApprove ? 'loop-verdict ready' : 'loop-verdict attention'}>
            {checks.readyToApprove ? 'PO reconciles with the approved quote and RFQ.' : 'Resolve the flagged items before approving.'}
          </p>
          <LoopResultView trace={checks.trace} openItems={checks.openItems} />
        </>
      )}

      {message && <p className="form-hint" role="status">{message}</p>}
      {error && <p className="form-error" role="alert">{error}</p>}

      <div className="form-actions">
        <button className="button secondary" type="button" onClick={runChecks} disabled={running}>{running ? 'Checking…' : checks ? 'Re-run AI checks' : 'Run AI checks'}</button>
        <button className="button primary" type="button" onClick={send} disabled={sending || !approved} title={approved ? '' : 'Approve the PO before sending'}>{sending ? 'Sending…' : 'Send to supplier'}</button>
      </div>
      {!approved && <p className="form-hint">Approve the PO to enable sending. Corven never sends a PO before human approval.</p>}
    </section>
  );
}
