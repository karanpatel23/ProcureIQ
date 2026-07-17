import Link from 'next/link';
import { QuoteStack, RFQPacket } from '@/components/site';

export const metadata = {
  title: 'Workflow',
  description: 'How Corven runs a supplier decision: RFQ, quote intake, extraction review, comparison, human approval, and PO draft — with the checks that protect each step.',
};

const steps = [
  ['01', 'Create the RFQ', {
    do: 'Define line items with specs, quantities, units, needed-by dates, delivery location, and an internal reference your team can trace later.',
    surface: 'A structured request record and a supplier-ready email draft that asks every supplier for the same things: unit pricing, lead time, freight terms, payment terms, validity, and exceptions.',
    matters: 'Most bad comparisons start with an inconsistent request. When suppliers answer different questions, no tool can line their quotes up honestly.',
  }],
  ['02', 'Add suppliers', {
    do: 'Attach supplier records — contacts, typical items, payment terms, notes — and invite enough of them for real coverage.',
    surface: 'Prior quote behavior for each supplier in your workspace: response history, lead-time patterns, and how complete their last quotes were.',
    matters: 'Two quotes is a coin flip; three or more comparable quotes is a decision. Supplier context tells you who tends to quote fully and deliver on time.',
  }],
  ['03', 'Bring quotes in', {
    do: 'Upload the PDF or spreadsheet, or paste the supplier email — no inbox connection required. The original source is stored with the quote.',
    surface: 'A quote record linked to the RFQ and supplier, with the raw source preserved next to everything extracted from it.',
    matters: 'When a number is questioned three weeks later, the answer should be one click away — the source document, not someone’s memory.',
  }],
  ['04', 'Review the extraction', {
    do: 'Approve or correct each extracted field — totals, lead time, freight, payment terms, validity, line items — before anything is compared.',
    surface: 'Field-level confidence scores and source snippets. Low-confidence fields are flagged for review; missing fields stay visibly empty instead of being guessed.',
    matters: 'An extraction error that slips into a comparison becomes a purchasing error. Nothing enters the decision until a person has cleared it.',
  }],
  ['05', 'Compare side by side', {
    do: 'Read one normalized table instead of five documents: totals, unit prices, lead-time spread, freight and payment terms, validity, and taxes.',
    surface: 'Risk flags per supplier — missing terms, expiring or expired quotes, price variance beyond 20% of the group average, exclusions buried in notes, incomplete line coverage.',
    matters: 'The cheapest number is rarely the whole cost. Freight, terms, and lead time change the real ranking — the table makes those tradeoffs explicit.',
  }],
  ['06', 'Decide, with a note', {
    do: 'Select the supplier and record the reasoning — including when you override the draft recommendation and why.',
    surface: 'A draft recommendation with its reasons and open risks, plus a needs-review warning whenever confidence is low or high-severity flags are open.',
    matters: 'A decision note written at decision time is what makes the choice defensible in an audit, a dispute, or next quarter’s review.',
  }],
  ['07', 'Draft the purchase order', {
    do: 'Generate an editable PO draft from the selected quote and RFQ lines, then adjust totals, taxes, freight, and delivery details.',
    surface: 'A draft carrying the quote reference, supplier details, line items, and terms — statused as requiring human approval from the moment it exists.',
    matters: 'Retyping a quote into a PO is where transposition errors are born. Drafting from the approved quote keeps the paper trail consistent.',
  }],
  ['08', 'Approve, then export', {
    do: 'Approve internally, then export CSV or PDF for your ERP, accounting system, or the supplier.',
    surface: 'An audit trail of who reviewed, selected, approved, and exported — every step attributable after the fact.',
    matters: 'Corven never sends purchase orders on its own. The system prepares; your team commits.',
  }],
] as const;

const quoteTraps = [
  ['Expiring validity', 'Metal, resin, and freight-linked quotes often hold for 15–30 days. A quote that expires mid-approval reopens the whole negotiation — Corven flags validity windows and expired quotes automatically.'],
  ['Freight exclusions', 'Two totals are not comparable if one includes delivery and the other quietly excludes it. Freight terms are extracted per quote and their absence is flagged as a risk.'],
  ['Substitutions and alternates', 'A lower price sometimes buys a different part. Notes mentioning substitutions, alternates, or exclusions are surfaced next to the comparison, not buried in an attachment.'],
  ['Minimum order quantities', 'A great unit price at 500 units is not a price at your quantity of 120. Reviewing extracted line items against RFQ quantities catches coverage gaps before selection.'],
  ['Payment-term cash impact', 'Net 15 versus Net 60 changes what a quote costs your cash flow. Terms sit beside price in the comparison so the tradeoff is visible, not discovered at invoice time.'],
  ['Unit and currency ambiguity', 'Per-piece versus per-hundred, USD versus CAD — small ambiguities create large errors. Extraction keeps units and currency explicit, and uncertain fields stay marked for review.'],
] as const;

export default function WorkflowPage() {
  return (
    <main>
      <section className="page-hero section-shell">
        <div>
          <p className="eyebrow">Workflow</p>
          <h1>A controlled path from supplier request to PO draft.</h1>
          <p>Eight stages, each with a clear owner: your team makes the calls, Corven keeps the evidence, exceptions, and status visible.</p>
          <div className="hero-actions">
            <Link className="button primary" href="/demo-workflow" data-track="workflow_live_demo">Explore the live demo</Link>
            <Link className="button secondary" href="/demo" data-track="workflow_book_demo">Book a demo</Link>
          </div>
        </div>
        <div className="workflow-stage-visual"><RFQPacket /><QuoteStack /></div>
      </section>

      <section className="section-shell module-list">
        {steps.map(([num, title, detail]) => (
          <article className="numbered-module" key={title}>
            <span>{num}</span>
            <div>
              <h2>{title}</h2>
              <div className="module-grid three-col">
                <p><b>What you do</b>{detail.do}</p>
                <p><b>What Corven surfaces</b>{detail.surface}</p>
                <p><b>Why it matters</b>{detail.matters}</p>
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="section-shell compact-section trap-section">
        <div className="section-heading-block">
          <p className="eyebrow">Field guide</p>
          <h2>Six quote traps this workflow is built to catch.</h2>
          <p className="lead">Patterns every purchasing team has been burned by at least once — and the checks that keep them out of your purchase orders.</p>
        </div>
        <div className="three-card-grid">
          {quoteTraps.map(([title, body]) => (
            <article key={title}><h3>{title}</h3><p>{body}</p></article>
          ))}
        </div>
      </section>

      <section className="final-cta">
        <p className="eyebrow">Next step</p>
        <h2>Walk the workflow yourself on sample data.</h2>
        <p>The live demo runs this exact flow — no account required.</p>
        <div className="hero-actions">
          <Link className="button primary" href="/demo-workflow" data-track="workflow_cta_live_demo">Explore the live demo</Link>
          <Link className="button secondary" href="/demo" data-track="workflow_cta_book_demo">Book a demo</Link>
        </div>
      </section>
    </main>
  );
}
