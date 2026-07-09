import Link from 'next/link';
import { CinematicBackdrop } from '@/components/cinematic-backdrop';
import { MobileNav } from '@/components/mobile-nav';

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
      <MobileNav items={navItems} />
      <nav aria-label="Primary navigation">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>{item.label}</Link>
        ))}
      </nav>
      <Link className="brand" href="/" aria-label="ProcureIQ home">ProcureIQ</Link>
      <div className="header-actions">
        <Link href="/login">Log in</Link>
        <Link className="button primary" href="/demo" data-track="nav_book_demo">Book a demo</Link>
      </div>
    </header>
  );
}

export function Footer() {
  const links = [
    ...navItems,
    { href: '/faq', label: 'FAQ' },
    { href: '/demo-workflow', label: 'Live demo' },
    { href: '/demo', label: 'Book a demo' },
    { href: '/login', label: 'Log in' },
    { href: '/signup', label: 'Sign up' },
    { href: '/contact', label: 'Contact' },
    { href: '/privacy', label: 'Privacy' },
    { href: '/terms', label: 'Terms' },
  ];

  return (
    <footer className="footer">
      <div>
        <strong>ProcureIQ</strong>
        <p>The AI decision layer for procurement. Supplier quotes, exceptions, and approvals in one human-controlled decision workflow.</p>
      </div>
      <nav aria-label="Footer navigation">
        {links.map((item) => (
          <Link key={`${item.href}-${item.label}`} href={item.href}>{item.label}</Link>
        ))}
      </nav>
    </footer>
  );
}

/* ------------------------------------------------------------------
   Cinematic product film — a CSS-animated decision-layer sequence:
   supplier signals arrive, the decision layer wakes field by field,
   and a human-approval state appears. Reduced-motion renders the
   final state statically.
------------------------------------------------------------------- */
export function ProductFilm() {
  return (
    <div className="film-stage" aria-label="Animated preview of the ProcureIQ decision layer">
      <div className="film-frame">
        <div className="film-titlebar">
          <span>ProcureIQ · Decision workspace</span>
          <span className="film-live"><i aria-hidden="true" />Guided review</span>
        </div>
        <div className="film-grid">
          <div className="film-signals">
            <article className="film-signal">
              <span>Quote received</span>
              <strong>Northline Metals</strong>
              <p>$18,420 · freight included</p>
            </article>
            <article className="film-signal">
              <span>Quote received</span>
              <strong>Atlas Components</strong>
              <p>$17,980 · freight excluded</p>
            </article>
            <article className="film-signal">
              <span>Quote received</span>
              <strong>Kinetic Supply</strong>
              <p>$19,150 · fastest lead time</p>
            </article>
          </div>
          <div className="film-core">
            <div className="film-core-label">
              <span>Decision layer</span>
              <span>3 quotes normalized</span>
            </div>
            <div className="film-field"><b>Total price delta</b><span className="film-chip">verified</span></div>
            <div className="film-field"><b>Lead time spread · 8–18 days</b><span className="film-chip">verified</span></div>
            <div className="film-field"><b>Freight exception · Atlas</b><span className="film-chip review">needs review</span></div>
            <div className="film-field"><b>Payment terms missing · Kinetic</b><span className="film-chip violet">flagged</span></div>
          </div>
        </div>
        <div className="film-approval">
          <div>
            <strong>Recommendation ready for approval</strong>
            <p>Human decision required before any purchasing action.</p>
          </div>
          <span className="film-chip">awaiting approver</span>
        </div>
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section className="cine-hero">
      <div className="cine-bg" aria-hidden="true">
        <CinematicBackdrop />
        <span className="cine-card card-1" />
        <span className="cine-card card-2" />
        <span className="cine-card card-3" />
        <span className="cine-card card-4" />
        <i className="cine-grain" />
      </div>
      <div className="cine-center">
        <p className="cine-kicker">The AI decision layer for procurement</p>
        <h1 className="cine-title">Procurement without guesswork.</h1>
        <p className="cine-sub">Supplier quotes, exceptions, and approvals — turned into decisions your team can stand behind.</p>
        <div className="hero-actions cine-actions">
          <Link className="button primary" href="/demo-workflow" data-track="hero_live_demo">Explore the live demo</Link>
          <Link className="button secondary" href="/demo" data-track="hero_book_demo">Book a demo</Link>
        </div>
      </div>
      <a className="cine-scroll" href="#product-film" aria-label="Scroll to product preview"><span>Scroll</span><i /></a>
    </section>
  );
}

export function FilmShowcase() {
  return (
    <section id="product-film" className="section-shell film-showcase">
      <div className="section-heading-block centered">
        <p className="eyebrow">The decision workspace</p>
        <h2>Watch a supplier decision come together.</h2>
        <p className="lead">Quotes arrive, the decision layer normalizes them, exceptions surface, and the recommendation waits for a person.</p>
      </div>
      <ProductFilm />
    </section>
  );
}

export function ProofMetricsStrip() {
  const metrics = [
    ['Quote comparison', 'Minutes, not afternoons', 'Normalized side-by-side review of every supplier response.'],
    ['Exception visibility', 'Nothing silently missing', 'Missing terms, freight gaps, and expiring quotes are flagged.'],
    ['Approval control', 'Humans decide', 'Recommendations wait for an authorized approver — always.'],
    ['Audit readiness', 'Every step recorded', 'Decisions, overrides, and exports leave a reviewable trail.'],
  ] as const;

  return (
    <section className="proof-strip" aria-label="What the decision layer guarantees">
      {metrics.map(([label, value, detail], index) => (
        <article key={label}>
          <span>[ {String(index + 1).padStart(2, '0')} ]</span>
          <strong>{value}</strong>
          <p>{label} — {detail}</p>
        </article>
      ))}
    </section>
  );
}

export function ProblemSection() {
  const items = [
    ['Quotes arrive fragmented', 'Supplier pricing lands across email threads, PDFs, spreadsheets, and copied notes — each in its own format.'],
    ['Comparison is manual', 'Teams re-key totals, freight, lead times, and exceptions into spreadsheets before a decision is even possible.'],
    ['Decisions lose their context', 'Why a supplier was chosen — and what was missing from the losing quotes — disappears once the PO goes out.'],
  ] as const;

  return (
    <section className="section-shell compact-section">
      <div className="section-heading-block">
        <p className="eyebrow">Why procurement needs a decision layer</p>
        <h2>Quote-heavy purchasing breaks down between the inbox and the purchase order.</h2>
        <p className="lead">The information exists. What is missing is a layer that assembles it into a decision your team can stand behind.</p>
      </div>
      <div className="three-card-grid">
        {items.map(([title, body]) => (
          <article key={title}><h3>{title}</h3><p>{body}</p></article>
        ))}
      </div>
    </section>
  );
}

export function ProductStorySection() {
  const steps = [
    ['Supplier context in', 'Quotes, terms, exceptions, and supplier history enter one source-aware workspace.'],
    ['Guided review', 'The decision layer normalizes options, surfaces gaps, and preserves uncertainty instead of hiding it.'],
    ['Confidence before action', 'Approvers see the recommendation, the risks, and the evidence — then decide. ProcureIQ never purchases on its own.'],
  ] as const;

  return (
    <section className="section-shell control-section">
      <div>
        <p className="eyebrow">The decision layer</p>
        <h2>Between supplier quotes and purchase decisions sits a layer of judgment. ProcureIQ makes it visible.</h2>
        <p>
          Instead of replacing your process, ProcureIQ structures it: every quote is tied to its source, every gap is
          flagged, and every recommendation waits for a human decision.
        </p>
        <div className="hero-actions">
          <Link className="text-link" href="/platform">See the full platform →</Link>
        </div>
      </div>
      <ol className="workflow-rail">
        {steps.map(([title, body], index) => (
          <li key={title}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <div><b>{title}</b><p style={{ margin: '4px 0 0', fontSize: '0.88rem' }}>{body}</p></div>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function WorkflowPreview() {
  return (
    <section className="section-shell compact-section">
      <div className="section-heading-block">
        <p className="eyebrow">Workflow overview</p>
        <h2>Five controlled stages from request to purchase-order draft.</h2>
        <p className="lead">Each stage keeps your team in review, with supplier evidence and confidence visible before purchasing action.</p>
      </div>
      <WorkflowRail />
      <div className="hero-actions">
        <Link className="text-link" href="/workflow">Walk through the full workflow →</Link>
      </div>
    </section>
  );
}

export function UseCasesSection() {
  const cases = [
    ['Manufacturing', 'Compare component and materials quotes with technical requirements, alternates, and exceptions in view.'],
    ['Construction', 'Coordinate bid packages, substitutions, lead times, and vendor terms across active jobs.'],
    ['Distribution', 'Track landed costs, supplier responsiveness, and recurring replenishment decisions in one record.'],
    ['Industrial services', 'Standardize purchasing across field teams, project work, repairs, and urgent supplier requests.'],
    ['Facilities and maintenance', 'Turn recurring parts and service quotes into clean approvals with full visibility.'],
    ['Operations teams', 'Give approvers the context behind every supplier recommendation before money moves.'],
  ] as const;

  return (
    <section className="section-shell compact-section">
      <div className="section-heading-block">
        <p className="eyebrow">Use cases</p>
        <h2>Built for teams that buy on quotes, not catalogs.</h2>
      </div>
      <div className="three-card-grid">
        {cases.map(([title, body]) => (
          <article key={title}><h3>{title}</h3><p>{body}</p></article>
        ))}
      </div>
    </section>
  );
}

export function TrustSection() {
  const controls = [
    'Recommendations are drafts — an authorized person approves every purchasing action',
    'Extracted fields keep confidence and source context visible for review',
    'Missing information stays flagged; the system never fills gaps with guesses',
    'Supplier data, quotes, and decisions are scoped to your workspace',
    'Decisions, overrides, approvals, and exports are recorded for audit',
    'No autonomous purchasing — ever',
  ] as const;

  return (
    <section className="section-shell trust-section">
      <div>
        <p className="eyebrow">Trust model</p>
        <h2>Intelligence you can review. Decisions you control.</h2>
        <p>
          ProcureIQ is designed for accountable procurement: source-aware reasoning, visible uncertainty, and approval
          by the people responsible for the outcome.
        </p>
        <div className="hero-actions">
          <Link className="text-link" href="/security">Read the security model →</Link>
        </div>
      </div>
      <ul>{controls.map((control) => <li key={control}>{control}</li>)}</ul>
    </section>
  );
}

export function FinalCta({ title = 'See your next supplier decision, before you make it.' }: { title?: string }) {
  return (
    <section className="final-cta">
      <p className="eyebrow">ProcureIQ</p>
      <h2>{title}</h2>
      <p>Explore the live demo workflow with sample data — no account required.</p>
      <div className="hero-actions">
        <Link className="button primary" href="/demo-workflow" data-track="cta_live_demo">Explore the live demo</Link>
        <Link className="button secondary" href="/demo" data-track="cta_book_demo">Book a demo</Link>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------
   Shared product-visual components used across workflow and demo pages.
------------------------------------------------------------------- */
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
  ] as const;

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
    ['Northline', 'Complete terms', 'Best overall control'],
    ['Kinetic', 'Fastest lead', 'Higher price'],
  ] as const;

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
      <p>Prepared from the selected quote, RFQ line items, terms, and source evidence. Never sent automatically.</p>
    </article>
  );
}

export function SupplierMemoryCard() {
  return (
    <article className="supplier-memory-card">
      <span>Supplier context</span>
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

/* ------------------------------------------------------------------
   Platform page building blocks.
------------------------------------------------------------------- */
export const platformModules = [
  ['01', 'RFQ workspace', 'Build structured supplier requests from project context, specs, line items, due dates, and delivery needs.', 'RFQ title, item specs, quantities, supplier list, internal reference.', 'RFQ scope, supplier selection, requested timeline.', 'Workspace access and audit trail.'],
  ['02', 'Quote intake', 'Upload quote documents, paste supplier emails, or enter manual quote details for review.', 'Original quote file or pasted source text, supplier identity, RFQ link.', 'Supplier match and source completeness.', 'Private quote storage and workspace scoping.'],
  ['03', 'Extraction review', 'Extract supplier name, dates, terms, pricing, lead times, exclusions, and line items with confidence.', 'Field-level values, confidence, source snippets, missing information.', 'Every field before approval.', 'AI output remains a draft.'],
  ['04', 'Comparison engine', 'Normalize quote options into a side-by-side decision matrix with risks and tradeoffs.', 'Approved quote fields, RFQ items, supplier data, pricing and timing.', 'Recommendation reasons, risk flags, decision notes.', 'Human selection required.'],
  ['05', 'Supplier context', 'Preserve prior quote behavior, selection history, pricing patterns, and completeness issues.', 'Quote history, lead-time history, selected supplier records, notes.', 'Supplier context before reuse.', 'Workspace-only supplier intelligence.'],
  ['06', 'PO draft and export', 'Generate editable PO drafts from selected quotes and RFQ context.', 'Buyer info, supplier info, line items, terms, taxes, freight, source quote.', 'PO number, line items, totals, approval note.', 'Draft until approved; never sent automatically.'],
  ['07', 'Analytics and audit trail', 'Track RFQs, quote volume, missing-info rate, PO draft value, and recent procurement events.', 'Workspace activity, audit logs, quote review outcomes, exports.', 'Operational visibility and exceptions.', 'Auditable changes and exports.'],
] as const;

export function PlatformSystemMap() {
  return (
    <section className="system-map">
      <div className="system-core">
        <span>ProcureIQ decision layer</span>
        <strong>RFQ → quote evidence → comparison → PO draft</strong>
        <p>One controlled record for supplier decisions.</p>
      </div>
      <div className="system-nodes">
        {platformModules.map(([num, title]) => <a href={`#module-${num}`} key={num}><span>{num}</span>{title}</a>)}
      </div>
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
            <div className="module-grid">
              <p><b>What it does</b>{does}</p>
              <p><b>Data handled</b>{data}</p>
              <p><b>You review</b>{review}</p>
              <p><b>Trust control</b>{control}</p>
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}

/* ------------------------------------------------------------------
   Pricing.
------------------------------------------------------------------- */
export function PricingSection() {
  const plans: Array<{ name: string; price: string; body: string; features: string[]; featured?: boolean }> = [
    { name: 'Starter', price: 'from $99/month', body: 'For lean purchasing teams getting organized.', features: ['RFQ workspace', 'Supplier records', 'Quote intake and review', 'Guided onboarding'] },
    { name: 'Growth', price: 'from $249/month', body: 'For teams comparing supplier quotes every week.', features: ['Everything in Starter', 'Extraction review with confidence', 'Comparison workspace', 'Decision notes and audit events'], featured: true },
    { name: 'Pro', price: 'from $799/month', body: 'For multi-user procurement and operations teams.', features: ['Everything in Growth', 'Supplier context and history', 'PO draft and export', 'Analytics and audit trail'] },
    { name: 'Enterprise', price: 'Custom', body: 'For advanced controls and tailored onboarding.', features: ['Admin controls', 'Integration planning', 'Security review support', 'Dedicated rollout path'] },
  ];

  return (
    <section className="section-shell pricing">
      <div className="section-heading-block">
        <p className="eyebrow">Plans</p>
        <h2>Start with the workflow depth your team needs.</h2>
        <p className="lead">Plans scale by quote volume, users, and workflow depth. Implementation starts from $500.</p>
      </div>
      <div className="pricing-grid">
        {plans.map(({ name, price, body, features, featured }) => (
          <article key={name} className={featured ? 'featured' : undefined}>
            <span>{name}</span>
            <strong>{price}</strong>
            <p>{body}</p>
            <ul>{features.map((feature) => <li key={feature}>{feature}</li>)}</ul>
            <Link className={featured ? 'button primary' : 'button secondary'} href="/demo" data-track="pricing_talk_to_sales">Talk to sales</Link>
          </article>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------
   About page building blocks.
------------------------------------------------------------------- */
export function FounderSection() {
  return (
    <section className="founder section-shell">
      <div className="founder-card">
        <div className="founder-mark">KP</div>
        <div>
          <p className="eyebrow">Founder</p>
          <h2>Karan Patel</h2>
          <p>
            Karan Patel founded ProcureIQ with a conviction: purchasing teams do not need more automation that acts for
            them — they need a decision layer that thinks with them. ProcureIQ turns fragmented supplier quotes into
            structured, source-aware decisions so teams can move faster without giving up control, context, or
            accountability.
          </p>
        </div>
      </div>
    </section>
  );
}

export function GoalsSection() {
  const goals = [
    'Eliminate manual quote re-keying and side-by-side spreadsheet work',
    'Make every supplier decision explainable, with its evidence attached',
    'Preserve purchasing context from RFQ through PO draft',
    'Become the trusted decision layer for quote-driven purchasing',
  ] as const;

  return (
    <section className="section-shell goals">
      <p className="eyebrow">What we are building toward</p>
      <h2>The purchasing record teams wish they already had.</h2>
      <div className="goal-grid">
        {goals.map((goal, index) => <article key={goal}><span>Goal {String(index + 1).padStart(2, '0')}</span><p>{goal}</p></article>)}
      </div>
    </section>
  );
}
