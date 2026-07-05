import Link from 'next/link';
import { DecisionMatrix, PODraftPreview, QuoteStack, RFQPacket, SupplierMemoryCard, WorkflowRail } from '@/components/site';

export const metadata = { title: 'Workflow | ProcureIQ', description: 'A conceptual ProcureIQ walkthrough for supplier-aware purchasing teams.' };
const steps = [
  ['01', 'Frame the request', 'Capture the purchasing context your team needs without turning the public site into an implementation manual.'],
  ['02', 'Bring suppliers into view', 'Keep supplier responses and stakeholder context close to the decision.'],
  ['03', 'Review what matters', 'Use guided review to focus attention on terms, timing, and exceptions.'],
  ['04', 'Compare tradeoffs', 'See where options differ so the team can move with confidence.'],
  ['05', 'Record the decision', 'Keep the reasoning visible for the people who approve and execute purchasing work.'],
  ['06', 'Prepare the draft', 'Move toward downstream purchasing documents only after review.'],
] as const;
export default function WorkflowPage() { return <main><section className="page-hero section-shell"><div><p className="eyebrow">Workflow</p><h1>Built for speed without losing control.</h1><p>ProcureIQ keeps the experience buyer-friendly: guided review, decision context, approval visibility, and supplier-aware workspace patterns.</p><div className="hero-actions"><Link className="button primary" href="/demo-workflow">Try Demo Workflow</Link><Link className="button secondary" href="/demo">Book Demo</Link></div></div><div className="workflow-stage-visual"><RFQPacket /><QuoteStack /></div></section><section className="section-shell workflow-page"><WorkflowRail steps={steps.map(([, title]) => title)} />{steps.map(([num, title, body]) => <article className="numbered-module" key={title}><span>{num}</span><div><h2>{title}</h2><p>{body}</p></div></article>)}</section><section className="section-shell demo-grid"><DecisionMatrix /><PODraftPreview /><SupplierMemoryCard /></section></main>; }
