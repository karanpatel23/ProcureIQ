'use client';

import { useState } from 'react';
import type { DecisionBrief } from '@/lib/server/decision-brief';

/** Renders the decision brief + negotiation draft with one-click copy. */
export function BriefPanel({ brief }: { brief: DecisionBrief }) {
  const [copied, setCopied] = useState<'brief' | 'email' | null>(null);

  async function copy(kind: 'brief' | 'email', text: string) {
    try { await navigator.clipboard.writeText(text); setCopied(kind); setTimeout(() => setCopied(null), 1800); } catch { /* clipboard unavailable */ }
  }

  return (
    <section className="brief-panel">
      <div className="brief-head">
        <div>
          <p className="eyebrow">Decision brief</p>
          <h2>The five lines that matter.</h2>
        </div>
        <button type="button" className="button secondary" onClick={() => copy('brief', brief.lines.join('\n'))}>
          {copied === 'brief' ? 'Copied ✓' : 'Copy for approval thread'}
        </button>
      </div>
      <ol className="brief-lines">
        {brief.lines.map((line) => <li key={line}>{line}</li>)}
      </ol>

      {brief.negotiation && (
        <details className="negotiation-block">
          <summary>
            <span>Negotiation draft ready — leverage: {brief.negotiation.leverage}</span>
          </summary>
          <div className="negotiation-body">
            <p className="form-hint">AI drafted this counter-offer from the real deltas between your quotes. Nothing is sent until you send it — copy it into your email client, review, and fire.</p>
            <p className="negotiation-meta"><b>To:</b> {brief.negotiation.toSupplier} · <b>Subject:</b> {brief.negotiation.subject}</p>
            <pre>{brief.negotiation.body}</pre>
            <div className="form-actions">
              <button type="button" className="button primary" onClick={() => copy('email', `Subject: ${brief.negotiation!.subject}\n\n${brief.negotiation!.body}`)}>
                {copied === 'email' ? 'Copied ✓' : 'Copy negotiation email'}
              </button>
            </div>
          </div>
        </details>
      )}
    </section>
  );
}
