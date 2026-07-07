'use client';

export type TraceStep = { index: number; phase: string; summary: string; confidence?: number };
export type OpenItem = { field: string; message: string; suggestion?: string; severity: 'info' | 'warning' };

const PHASE_LABEL: Record<string, string> = {
  understand: 'Understand', draft: 'Draft', self_review: 'Self-review', refine: 'Refine', await_approval: 'Awaiting your approval', finalize: 'Finalize', fallback: 'Manual fallback',
};

/** Shared renderer for a bounded loop's reasoning trace and open items. */
export function LoopResultView({ trace, openItems }: { trace: TraceStep[]; openItems: OpenItem[] }) {
  return (
    <>
      {trace.length > 0 && (
        <ol className="loop-trace" aria-label="AI reasoning steps">
          {trace.map((step) => (
            <li key={step.index} className="loop-step">
              <span className="loop-phase">{PHASE_LABEL[step.phase] ?? step.phase}</span>
              <span className="loop-summary">{step.summary}</span>
              {typeof step.confidence === 'number' && <span className="loop-confidence">{Math.round(step.confidence * 100)}% confidence</span>}
            </li>
          ))}
        </ol>
      )}
      {openItems.length > 0 && (
        <ul className="advisor-list">
          {openItems.map((o, i) => (
            <li key={i} className={`advisor-item ${o.severity}`}><b>{o.field}</b><span>{o.message}</span>{o.suggestion && <em>Suggested: {o.suggestion}</em>}</li>
          ))}
        </ul>
      )}
    </>
  );
}
