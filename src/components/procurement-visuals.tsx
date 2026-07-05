import Link from 'next/link';

export function EvidencePin({ label = 'Source evidence', confidence }: { label?: string; confidence?: string }) {
  return <span className="evidence-pin"><i aria-hidden="true" />{label}{confidence && <b>{confidence}</b>}</span>;
}

export function RFQPacket() {
  return <article className="rfq-packet"><span className="module-kicker">RFQ packet</span><h3>Conveyor Guard Bracket Package</h3><dl><div><dt>Needed by</dt><dd>Aug 14</dd></div><div><dt>Line items</dt><dd>4</dd></div><div><dt>Suppliers</dt><dd>3 invited</dd></div></dl><EvidencePin label="Spec sheet pinned" confidence="v2" /></article>;
}

export function QuoteStack() {
  const quotes = [['Northline Metals', '$18,420', 'Freight included', '94%'], ['Atlas Components', '$17,980', 'Freight excluded', '88%'], ['Kinetic Supply', '$19,150', 'Net 45', '91%']];
  return <div className="quote-stack" aria-label="Supplier quote snippets">{quotes.map(([name, price, note, confidence]) => <article key={name}><span>{name}</span><strong>{price}</strong><p>{note}</p><EvidencePin label="field evidence" confidence={confidence} /></article>)}</div>;
}

export function DecisionMatrix() {
  return <article className="decision-matrix"><div className="matrix-head"><span>Decision panel</span><b>Draft recommendation</b></div>{[['Atlas', 'Lowest cost', 'Freight missing'], ['Northline', 'Complete', 'Best control'], ['Kinetic', 'Fastest lead', 'Higher price']].map((row) => <div className="matrix-row" key={row[0]}><strong>{row[0]}</strong><span>{row[1]}</span><em>{row[2]}</em></div>)}<EvidencePin label="Human approval required" confidence="locked" /></article>;
}

export function PODraftPreview() {
  return <article className="po-draft-preview"><span>PO draft status</span><strong>Requires human approval</strong><p>Prepared from selected quote, RFQ line items, terms, and source evidence. Not sent automatically.</p></article>;
}

export function SupplierMemoryCard() {
  return <article className="supplier-memory-card"><span>Supplier memory</span><h3>Northline Metals</h3><p>4 prior quotes · 2 selected · average lead time 12 days · complete terms on last 3 responses.</p></article>;
}

export function WorkflowRail({ steps = ['RFQ', 'Quote intake', 'Extraction review', 'Comparison', 'PO draft'] }: { steps?: readonly string[] }) {
  return <ol className="workflow-rail">{steps.map((step, index) => <li key={step}><span>{String(index + 1).padStart(2, '0')}</span><Link href={index < 2 ? '/workflow' : '/platform'}>{step}</Link></li>)}</ol>;
}
