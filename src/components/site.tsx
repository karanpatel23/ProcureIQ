import Link from 'next/link';

export const navItems = [
  { href: '/platform', label: 'Platform' },
  { href: '/workflow', label: 'Workflow' },
  { href: '/security', label: 'Security' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/about', label: 'About' },
] as const;

export function Header() {
  return (
    <header className="site-header">
      <Link className="brand" href="/" aria-label="ProcureIQ home">
        <span>ProcureIQ</span>
        <small>Procurement control room</small>
      </Link>
      <nav aria-label="Primary navigation">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>{item.label}</Link>
        ))}
      </nav>
      <div className="header-actions">
        <Link href="/login">Login</Link>
        <Link href="/signup">Sign Up</Link>
        <Link className="button secondary" href="/demo-workflow">Try Demo Workflow</Link>
        <Link className="button primary" href="/demo">Book Demo</Link>
      </div>
    </header>
  );
}

export function Footer() {
  const links = [
    ...navItems,
    { href: '/login', label: 'Login' },
    { href: '/signup', label: 'Sign Up' },
    { href: '/demo-workflow', label: 'Try Demo Workflow' },
    { href: '/demo', label: 'Book Demo' },
    { href: '/privacy', label: 'Privacy' },
    { href: '/terms', label: 'Terms' },
    { href: '/contact', label: 'Contact' },
  ];

  return (
    <footer className="footer">
      <div>
        <strong>ProcureIQ</strong>
        <p>Source-backed quote comparison and purchase-order draft control for purchasing teams.</p>
      </div>
      <nav aria-label="Footer navigation">
        {links.map((item) => (
          <Link key={`${item.href}-${item.label}`} href={item.href}>{item.label}</Link>
        ))}
      </nav>
    </footer>
  );
}

export function EvidencePin({ label = 'Source evidence', confidence }: { label?: string; confidence?: string }) {
  return <span className="evidence-pin"><i aria-hidden="true" />{label}{confidence && <b>{confidence}</b>}</span>;
}

export function RFQPacket() {
  return (
    <article className="rfq-packet">
      <span className="module-kicker">RFQ packet</span>
      <h3>Conveyor Guard Bracket Package</h3>
      <dl>
        <div><dt>Needed by</dt><dd>Aug 14</dd></div>
        <div><dt>Line items</dt><dd>4</dd></div>
        <div><dt>Suppliers</dt><dd>3 invited</dd></div>
      </dl>
      <EvidencePin label="Spec sheet pinned" confidence="v2" />
    </article>
  );
}

export function QuoteStack() {
  const quotes = [
    ['Northline Metals', '$18,420', 'Freight included', '94%'],
    ['Atlas Components', '$17,980', 'Freight excluded', '88%'],
    ['Kinetic Supply', '$19,150', 'Net 45', '91%'],
  ];

  return (
    <div className="quote-stack" aria-label="Supplier quote snippets">
      {quotes.map(([name, price, note, confidence]) => (
        <article key={name}>
          <span>{name}</span>
          <strong>{price}</strong>
          <p>{note}</p>
          <EvidencePin label="field evidence" confidence={confidence} />
        </article>
      ))}
    </div>
  );
}

export function DecisionMatrix() {
  const rows = [
    ['Atlas', 'Lowest cost', 'Freight missing'],
    ['Northline', 'Complete', 'Best control'],
    ['Kinetic', 'Fastest lead', 'Higher price'],
  ];

  return (
    <article className="decision-matrix">
      <div className="matrix-head"><span>Decision panel</span><b>Draft recommendation</b><em>Risk</em></div>
      {rows.map(([supplier, reason, risk]) => (
        <div className="matrix-row" key={supplier}>
          <strong>{supplier}</strong>
          <span>{reason}</span>
          <em>{risk}</em>
        </div>
      ))}
      <EvidencePin label="Human approval required" confidence="locked" />
    </article>
  );
}

export function PODraftPreview() {
  return (
    <article className="po-draft-preview">
      <span>PO draft status</span>
      <strong>Requires human approval</strong>
      <p>Prepared from selected quote, RFQ line items, terms, and source evidence. Not sent automatically.</p>
    </article>
  );
}

export function SupplierMemoryCard() {
  return (
    <article className="supplier-memory-card">
      <span>Supplier memory</span>
      <h3>Northline Metals</h3>
      <p>4 prior quotes · 2 selected · average lead time 12 days · complete terms on last 3 responses.</p>
    </article>
  );
}

export function WorkflowRail({ steps = ['RFQ', 'Quote intake', 'Extraction review', 'Comparison', 'PO draft'] }: { steps?: readonly string[] }) {
  return (
    <ol className="workflow-rail">
      {steps.map((step, index) => (
        <li key={step}>
          <span>{String(index + 1).padStart(2, '0')}</span>
          <Link href={index < 2 ? '/workflow' : '/platform'}>{step}</Link>
        </li>
      ))}
    </ol>
  );
}

export function ControlRoomVisual() {
  return <section className="control-room-visual" aria-label="ProcureIQ procurement operating console"><RFQPacket /><QuoteStack /><DecisionMatrix /><PODraftPreview /></section>;
}

export function Hero() {
  return (
    <section className="hero section-shell">
      <div className="hero-copy">
        <p className="eyebrow">Procurement control room</p>
        <h1>Supplier quotes, ready for decision.</h1>
        <p className="hero-subhead">ProcureIQ helps purchasing and operations teams collect RFQs, review supplier quotes, compare tradeoffs, and draft purchase orders with source-backed confidence.</p>
        <div className="hero-actions">
          <Link className="button primary" href="/demo-workflow">Try Demo Workflow</Link>
          <Link className="button secondary" href="/demo">Book Demo</Link>
          <Link className="text-link" href="/platform">View Platform</Link>
        </div>
      </div>
      <ControlRoomVisual />
    </section>
  );
}

export function HeroVisual() { return <ControlRoomVisual />; }

export function ProofMetricsStrip() {
  const metrics = [
    ['Quote comparison', 'minutes, not hours'],
    ['Approval', 'human-controlled'],
    ['Source traceability', 'field-level'],
    ['PO status', 'draft before export'],
  ];

  return (
    <section className="proof-strip" aria-label="Workflow promises">
      {metrics.map(([label, value], index) => (
        <article key={label}>
          <span>[ {String(index + 1).padStart(2, '0')} ]</span>
          <strong>{value}</strong>
          <p>{label}</p>
        </article>
      ))}
    </section>
  );
}

export function ProblemSection() {
  const items = [
    ['Quotes arrive fragmented', 'Supplier details land across email threads, PDFs, spreadsheets, and copied notes.'],
    ['Comparison is manual', 'Teams normalize pricing, freight, lead times, and exceptions before they can decide.'],
    ['Decisions lose context', 'Approval notes and supplier evidence are separated from the final PO draft.'],
  ];

  return (
    <section className="section-shell compact-section">
      <div className="section-heading-block">
        <p className="eyebrow">Operational drag</p>
        <h2>Purchasing decisions break down when quote evidence is scattered.</h2>
      </div>
      <div className="three-card-grid">
        {items.map(([title, body]) => <article key={title}><h3>{title}</h3><p>{body}</p></article>)}
      </div>
    </section>
  );
}

export function WorkflowPreview() {
  return (
    <section className="section-shell control-section">
      <div>
        <p className="eyebrow">Workflow preview</p>
        <h2>Five controlled stages from request to PO draft.</h2>
        <p>Each stage keeps the user in review, with supplier evidence and confidence visible before purchasing action.</p>
      </div>
      <WorkflowRail />
    </section>
  );
}

export function TrustSection() {
  const controls = [
    'AI never sends purchase orders automatically',
    'Every extracted field links back to source quote evidence',
    'Human approval is required before purchasing action',
    'Workspace-scoped quote data',
    'No customer-data model training without explicit consent',
  ];

  return (
    <section className="section-shell trust-section">
      <div>
        <p className="eyebrow">Trust model</p>
        <h2>Assistance without autonomous purchasing.</h2>
        <p>ProcureIQ is designed for reviewable procurement work: draft outputs, visible uncertainty, and approvals by authorized people.</p>
      </div>
      <ul>{controls.map((control) => <li key={control}>{control}</li>)}</ul>
    </section>
  );
}

export function FinalCta({ title = 'See the workflow before the sales call.' }: { title?: string }) {
  return (
    <section className="final-cta">
      <p className="eyebrow">ProcureIQ</p>
      <h2>{title}</h2>
      <div className="hero-actions">
        <Link className="button primary" href="/demo-workflow">Try Demo Workflow</Link>
        <Link className="button secondary" href="/demo">Book Demo</Link>
      </div>
    </section>
  );
}

export const platformModules = [
  ['01', 'RFQ workspace', 'Build structured supplier requests from project context, specs, line items, due dates, and delivery needs.', 'RFQ title, item specs, quantities, supplier list, internal reference.', 'RFQ scope, supplier selection, requested timeline.', 'Workspace access and audit trail.'],
  ['02', 'Quote intake', 'Upload quote documents, paste supplier emails, or enter manual quote details for review.', 'Original quote file or pasted source text, supplier identity, RFQ link.', 'Supplier match and source completeness.', 'Private quote storage and workspace scoping.'],
  ['03', 'Extraction review', 'Extract supplier name, dates, terms, pricing, lead times, exclusions, and line items with confidence.', 'Field-level values, confidence, source snippets, missing information.', 'Every field before approval.', 'AI output remains a draft.'],
  ['04', 'Comparison engine', 'Normalize quote options into a side-by-side decision matrix with risks and tradeoffs.', 'Approved quote fields, RFQ items, supplier data, pricing and timing.', 'Recommendation reasons, risk flags, decision notes.', 'Human selection required.'],
  ['05', 'Supplier memory', 'Preserve prior quote behavior, selected history, pricing patterns, and completeness issues.', 'Quote history, lead-time history, selected supplier records, notes.', 'Supplier context before reuse.', 'Workspace-only supplier intelligence.'],
  ['06', 'PO draft/export', 'Generate editable PO drafts from selected quotes and RFQ context.', 'Buyer info, supplier info, line items, terms, taxes, freight, source quote.', 'PO number, line items, totals, approval note.', 'Draft until approved; never sent automatically.'],
  ['07', 'Analytics and audit trail', 'Track RFQs, quote volume, missing-info rate, PO draft value, and recent procurement events.', 'Workspace activity, audit logs, quote review outcomes, exports.', 'Operational visibility and exceptions.', 'Auditable changes and exports.'],
] as const;

export function PlatformSystemMap() {
  return (
    <section className="system-map">
      <div className="system-core"><span>ProcureIQ operating layer</span><strong>RFQ → quote evidence → comparison → PO draft</strong><p>One controlled record for supplier decisions.</p></div>
      <div className="system-nodes">{platformModules.map(([num, title]) => <a href={`#module-${num}`} key={num}><span>{num}</span>{title}</a>)}</div>
    </section>
  );
}

export function PlatformModules() {
  return (
    <section className="section-shell module-list">
      {platformModules.map(([num, title, does, data, review, control]) => (
        <article id={`module-${num}`} key={num} className="numbered-module">
          <span>{num}</span>
          <div>
            <h2>{title}</h2>
            <div className="module-grid"><p><b>What it does</b>{does}</p><p><b>Data handled</b>{data}</p><p><b>User reviews</b>{review}</p><p><b>Trust control</b>{control}</p></div>
          </div>
        </article>
      ))}
    </section>
  );
}

export function PricingSection() {
  const plans: Array<{ name: string; price: string; body: string; features: string[] }> = [
    { name: 'Starter', price: 'from $99/month', body: 'For lean purchasing teams getting organized.', features: ['RFQ workspace', 'Supplier records', 'Demo workflow onboarding'] },
    { name: 'Growth', price: 'from $249/month', body: 'For recurring supplier quote comparison.', features: ['Quote intake', 'Extraction review', 'Comparison workspace'] },
    { name: 'Pro', price: 'from $799/month', body: 'For multi-user procurement and operations teams.', features: ['Supplier memory', 'PO draft export', 'Analytics and audit trail'] },
    { name: 'Enterprise', price: 'custom', body: 'For advanced controls and tailored onboarding.', features: ['Admin controls', 'Integration planning', 'Security review support'] },
  ];

  return (
    <section className="section-shell pricing">
      <p className="eyebrow">Pricing</p>
      <h2>Start with the workflow depth your team needs.</h2>
      <p>Pricing is based on quote volume, users, workflow depth, and onboarding. Implementation starts from $500.</p>
      <div className="pricing-grid">
        {plans.map(({ name, price, body, features }) => (
          <article key={name}><span>{name}</span><strong>{price}</strong><p>{body}</p><ul>{features.map((feature) => <li key={feature}>{feature}</li>)}</ul><Link className="button secondary" href="/demo">Talk to Sales</Link></article>
        ))}
      </div>
    </section>
  );
}

export function FounderSection() {
  return (
    <section className="founder section-shell">
      <div className="founder-card">
        <div className="founder-mark">KP</div>
        <div><p className="eyebrow">Founder</p><h2>Karan Patel</h2><p>Karan Patel is building ProcureIQ to help purchasing and operations teams turn fragmented supplier quotes into clear, reviewable decisions. The mission is to make quote comparison, approval, and purchase-order preparation faster, more controlled, and easier to trust.</p></div>
      </div>
    </section>
  );
}

export function GoalsSection() {
  const goals = ['Reduce manual quote comparison work', 'Improve supplier decision clarity', 'Preserve purchasing context from RFQ to PO draft', 'Build the trusted procurement intelligence layer for supplier-driven companies'];
  return <section className="section-shell goals"><p className="eyebrow">Company goals</p><h2>Designed for the purchasing record teams wish they already had.</h2><div className="goal-grid">{goals.map((goal, index) => <article key={goal}><span>Goal {index + 1}</span><p>{goal}</p></article>)}</div></section>;
}

export function IndustriesSection() { return <section className="section-shell"><p className="eyebrow">Use cases</p><h2>Built for manufacturers, contractors, distributors, industrial services, and facility operations.</h2></section>; }
export function FeaturesSection() { return <PlatformModules />; }
export function WorkflowSection() { return <WorkflowPreview />; }
