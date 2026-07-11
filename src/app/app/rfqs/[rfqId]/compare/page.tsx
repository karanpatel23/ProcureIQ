import { ComparisonAiPanel } from '@/components/loops/ComparisonAiPanel';
import { ComparisonDecisionForm } from '@/components/quotes/ComparisonDecisionForm';
import { requirePageWorkspace } from '@/lib/server/auth';
import { buildRfqComparison, evaluateComparisonPolicy } from '@/lib/server/comparison';
import { buildDecisionBrief } from '@/lib/server/decision-brief';
import { BriefPanel } from '@/components/quotes/BriefPanel';
import { readDb } from '@/lib/server/db';
import { writeAuditLog } from '@/lib/server/audit';
import { notFound } from 'next/navigation';

export const metadata = { title: 'Quote comparison | ProcureIQ' };
const SYMBOLS: Record<string, string> = { USD: '$', EUR: '\u20ac', GBP: '\u00a3', CAD: 'CA$', AUD: 'A$', INR: '\u20b9', JPY: '\u00a5', CNY: 'CN\u00a5' };
const moneyIn = (currency?: string) => (value: number | null) => value ? `${SYMBOLS[(currency ?? 'USD').toUpperCase()] ?? `${currency} `}${value.toLocaleString()}` : 'Missing';
export default async function ComparePage({ params }: { params: Promise<{ rfqId: string }> }) { const { user, workspace } = await requirePageWorkspace(); const { rfqId } = await params; const db = await readDb(); const rfq = db.rfqs.find((item) => item.id === rfqId && item.workspaceId === workspace.id) as any; if (!rfq) notFound(); const comparison = buildRfqComparison(db, rfq); const money = moneyIn(workspace.currency); const policy = evaluateComparisonPolicy(db, rfq, workspace, comparison); const brief = comparison.recommendation ? buildDecisionBrief({ rfqTitle: rfq.title, currency: workspace.currency, confidence: comparison.recommendation.confidence, policy, quotes: comparison.quotes.map((q) => ({ supplierName: q.supplierName, totalPrice: q.totalPrice, leadTime: q.leadTime, paymentTerms: q.paymentTerms, recommended: q.supplierName === comparison.recommendation!.overall.supplierName })) }) : null; await writeAuditLog({ workspaceId: workspace.id, actorUserId: user.id, action: 'comparison.viewed', entityType: 'rfq', entityId: rfq.id }); const pendingReviews = comparison.quotes.filter((item) => item.quote.status === 'needs_review').length; return <main><section className="app-shell"><div className="comparison-header"><div><p className="eyebrow">Quote comparison</p><h1>{rfq.title}</h1><p>Status: {rfq.status} · Needed by {rfq.neededBy || 'not set'} · {rfq.supplierIds.length} suppliers invited · {comparison.quotes.length} quotes received · {pendingReviews} pending reviews</p></div></div>{comparison.quotes.length === 0 ? <div className="settings-card"><h2>No quotes ready to compare.</h2><p>Add supplier quotes from the RFQ detail page to see side-by-side analysis.</p></div> : <><ComparisonAiPanel rfqId={rfq.id} />{brief && <BriefPanel brief={brief} />}{policy && (
  <section className={`policy-panel ${policy.status}`}>
    <div className="policy-head">
      <p className="eyebrow">Purchasing policy</p>
      <h2>{policy.status === 'in_policy' ? 'In policy — ready to approve' : policy.status === 'exceptions' ? `${policy.exceptions.length} exception${policy.exceptions.length === 1 ? '' : 's'} need your judgment` : 'No policy configured yet'}</h2>
      <p>{policy.summary}</p>
    </div>
    {policy.exceptions.length > 0 && (
      <ul className="policy-exceptions">
        {policy.exceptions.map((exception) => (
          <li key={exception.code}><b>{exception.title}.</b> {exception.detail}</li>
        ))}
      </ul>
    )}
    <details className="policy-checks">
      <summary>All checks ({policy.checks.filter((c) => !c.skipped).length} applied, {policy.checks.filter((c) => c.skipped).length} skipped)</summary>
      <ul>
        {policy.checks.map((check) => (
          <li key={check.code} className={check.skipped ? 'skipped' : check.pass ? 'pass' : 'fail'}>
            {check.skipped ? '◦' : check.pass ? '✓' : '✕'} {check.label}{check.detail ? ` — ${check.detail}` : ''}
          </li>
        ))}
      </ul>
    </details>
  </section>
)}<section className="recommendation-card"><p className="eyebrow">ProcureIQ draft recommendation</p><h2>{comparison.recommendation?.overall.supplierName}</h2>{comparison.recommendation?.needsReview && <span className="risk-badge high">Needs human review — open risks or low extraction confidence</span>}<p>Confidence level: {comparison.recommendation?.confidence}%</p><ul>{comparison.recommendation?.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul><p>Lowest cost: {comparison.recommendation?.lowestCost.supplierName} · Fastest lead time: {comparison.recommendation?.fastest.supplierName}</p><p>Risks and tradeoffs: {comparison.recommendation?.tradeoffs.join(', ') || 'No major automated flags.'}</p></section><div className="comparison-table"><table><thead><tr><th>Supplier</th><th>Total price</th><th>Line item unit prices</th><th>Lead time</th><th>Freight/shipping</th><th>Payment terms</th><th>Validity</th><th>Taxes</th><th>Missing fields</th><th>Notes/exclusions</th><th>Confidence</th><th>Score</th></tr></thead><tbody>{comparison.quotes.map((item) => <tr key={item.quote.id}><th>{item.supplierName}</th><td>{money(item.totalPrice)}</td><td>{item.lineItems.map((line) => <span className="mini-line" key={line.id}>{line.itemName || line.description}: {money(Number(line.unitPrice))}</span>)}</td><td>{item.leadTime || 'Missing'}</td><td>{item.freightTerms || 'Missing'}</td><td>{item.paymentTerms || 'Missing'}</td><td>{item.validUntil || 'Missing'}</td><td>{money(item.taxes)}</td><td>{item.risks.filter((risk) => risk.code.startsWith('missing')).map((risk) => <span className="risk-badge" key={risk.code}>{risk.label}</span>)}</td><td>{item.notes || 'None'}</td><td><span className={item.confidence < 60 ? 'confidence low' : 'confidence'}>{item.confidence < 60 ? 'Needs Review' : `${item.confidence}%`}</span></td><td>{item.score}</td></tr>)}</tbody></table></div><section className="risk-board">{comparison.quotes.flatMap((item) => item.risks.map((risk) => <span className={`risk-badge ${risk.severity}`} key={`${item.quote.id}-${risk.code}`}>{item.supplierName}: {risk.label}</span>))}</section><ComparisonDecisionForm rfqId={rfq.id} recommendedId={comparison.recommendation?.overall.quote.id} quotes={comparison.quotes.map((item) => ({ id: item.quote.id, supplierName: item.supplierName }))} /></>}</section></main>; }
