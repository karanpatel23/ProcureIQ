'use client';

import { useState } from 'react';
import { LoopResultView, type OpenItem, type TraceStep } from '@/components/loops/LoopResultView';

type Tradeoff = { supplierName: string; summary: string; recommended: boolean; risks: string[] };
type Result = { headline: string; tradeoffs: Tradeoff[]; openItems: OpenItem[]; needsReview: boolean; trace: TraceStep[] };

// Surfaces the Quote Comparison Loop: an AI tradeoff analysis that recommends
// and explains, and hands the decision to a human — never auto-selects.
export function ComparisonAiPanel({ rfqId }: { rfqId: string }) {
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function run() {
    setLoading(true); setError('');
    try {
      const response = await fetch(`/api/rfqs/${rfqId}/comparison-loop`, { method: 'POST' });
      const body = await response.json();
      if (!body.ok) { setError(body.error?.message ?? 'AI comparison is unavailable right now. The table below still shows the full comparison.'); return; }
      setResult(body.data as Result);
    } catch {
      setError('AI comparison is unavailable right now. The table below still shows the full comparison.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="advisor-card comparison-ai">
      <div className="section-heading">
        <h2>AI comparison</h2>
        {result && <span className={`advisor-score ${result.needsReview ? 'attention' : 'ready'}`}>{result.needsReview ? 'Needs review' : 'Ready to decide'}</span>}
      </div>

      {!result && !loading && <p>Let Corven weigh price, lead time, terms, and risk across every quote and explain the tradeoffs — then you approve the decision.</p>}
      {loading && <p className="loop-working"><span className="loop-dot" aria-hidden="true" />Weighing price, lead time, terms, and risk across all quotes…</p>}
      {error && <p className="form-error" role="alert">{error}</p>}

      {result && (
        <>
          <p className="loop-verdict ready">{result.headline}</p>
          <ul className="tradeoff-list">
            {result.tradeoffs.map((t) => (
              <li key={t.supplierName} className={`tradeoff ${t.recommended ? 'recommended' : ''}`}>
                <div className="tradeoff-head"><b>{t.supplierName}</b>{t.recommended && <span className="tradeoff-badge">AI pick</span>}</div>
                <span className="tradeoff-summary">{t.summary}</span>
                {t.risks.length > 0 && <span className="tradeoff-risks">Risks: {t.risks.join(', ')}</span>}
              </li>
            ))}
          </ul>
          <LoopResultView trace={result.trace} openItems={result.openItems} />
        </>
      )}

      <div className="form-actions">
        <button className="button secondary" type="button" onClick={run} disabled={loading}>{loading ? 'Analyzing…' : result ? 'Re-run AI comparison' : 'Run AI comparison'}</button>
      </div>
    </section>
  );
}
