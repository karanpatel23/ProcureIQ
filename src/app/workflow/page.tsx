import Link from 'next/link';

export const metadata = { title: 'Workflow | ProcureIQ', description: 'A conceptual ProcureIQ journey for supplier-aware purchasing teams.' };
const journey = [
  ['01', 'Signal', 'Supplier activity becomes visible in a shared purchasing context.', 'signal-card'],
  ['02', 'Context', 'Commercial details, stakeholder notes, and open questions move into one review surface.', 'context-card'],
  ['03', 'Judgment', 'Teams evaluate tradeoffs without turning the workflow into autonomous purchasing.', 'judgment-card'],
  ['04', 'Approval', 'Next actions remain draft-based until an authorized person moves work forward.', 'approval-card'],
] as const;
export default function WorkflowPage() { return <main><section className="page-hero section-shell compact workflow-hero"><p className="eyebrow">Workflow</p><h1>A calmer path through supplier complexity.</h1><p>ProcureIQ is designed as a guided layer for quote-heavy teams: supplier context, decision visibility, and confidence before action.</p><div className="hero-actions"><Link className="button primary" href="/demo-workflow">Try Demo Workflow</Link><Link className="button secondary" href="/demo">Book Demo</Link></div></section><section className="section-shell journey-shell">{journey.map(([num, title, body, visual]) => <article className="journey-step" key={title}><div><span>{num}</span><h2>{title}</h2><p>{body}</p></div><div className={`journey-visual ${visual}`} aria-hidden="true"><i /><b>{title}</b><em>ProcureIQ</em></div></article>)}</section><section className="section-shell workflow-close"><p className="eyebrow">Controlled by design</p><h2>The public story stays simple. The product experience carries the depth.</h2><p>ProcureIQ keeps advanced review, supplier context, and operating intelligence inside the workspace where it belongs.</p></section></main>; }
