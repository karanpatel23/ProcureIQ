import Link from 'next/link';
import { DecisionMatrix, PODraftPreview, QuoteStack, RFQPacket, SupplierMemoryCard, WorkflowRail } from '@/components/site';

export const metadata = { title: 'Workflow | ProcureIQ', description: 'Walk through the ProcureIQ procurement workflow from RFQ creation to approved PO draft export.' };
const steps = [
  ['01', 'Create RFQ', 'Build the Conveyor Guard Bracket Package with specs, quantities, needed-by date, and delivery location.'],
  ['02', 'Add suppliers', 'Invite Northline Metals, Atlas Components, and Kinetic Supply for comparable quote coverage.'],
  ['03', 'Upload or paste quote', 'Bring PDF quotes or supplier emails into the RFQ without connecting an inbox.'],
  ['04', 'Review extracted fields', 'Check payment terms, freight, lead time, total, and source pins before approval.'],
  ['05', 'Compare side by side', 'Quote A is cheapest but excludes freight. Quote B is fastest but missing payment terms. Quote C is higher price but complete and valid longer.'],
  ['06', 'Select supplier with decision note', 'Record why the team selected the supplier and whether the draft recommendation was overridden.'],
  ['07', 'Draft PO', 'Generate an editable purchase-order draft from the selected quote, RFQ line items, and terms.'],
  ['08', 'Export only after approval', 'Export CSV or PDF after internal approval. ProcureIQ never sends purchase orders automatically.'],
] as const;
export default function WorkflowPage() { return <main><section className="page-hero section-shell"><div><p className="eyebrow">Workflow</p><h1>A controlled path from supplier request to PO draft.</h1><p>ProcureIQ keeps quote evidence, missing information, decision notes, and approval status visible at every step.</p><div className="hero-actions"><Link className="button primary" href="/demo-workflow">Explore the live demo</Link><Link className="button secondary" href="/demo">Book a demo</Link></div></div><div className="workflow-stage-visual"><RFQPacket /><QuoteStack /></div></section><section className="section-shell workflow-page"><WorkflowRail steps={steps.map(([, title]) => title)} />{steps.map(([num, title, body]) => <article className="numbered-module" key={title}><span>{num}</span><div><h2>{title}</h2><p>{body}</p></div></article>)}</section><section className="section-shell demo-grid"><DecisionMatrix /><PODraftPreview /><SupplierMemoryCard /></section></main>; }
