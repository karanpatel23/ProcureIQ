import Link from 'next/link';
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
      <Link className="brand" href="/" aria-label="Corven home">Corven</Link>
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
        <strong>Corven</strong>
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
    <div className="film-stage" aria-label="Animated preview of the Corven decision layer">
      <div className="film-frame">
        <div className="film-titlebar">
          <span>Corven · Decision workspace</span>
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

/* ------------------------------------------------------------------
   The Line — the signature hero motif. A purchase order travels one
   continuous line through ingestion → extraction → match, and the line
   ends at the only warm moment on the page: the human approval.
   Pure SVG + CSS/SMIL, no WebGL, static under prefers-reduced-motion.
------------------------------------------------------------------- */
const LINE_PATH = 'M 0 92 C 87 92, 123 76, 210 76 C 331 76, 379 102, 500 102 C 621 102, 669 70, 790 70 C 911 70, 959 90, 1080 90';

export function HeroLine() {
  const nodes = [
    { x: 210, y: 76 },
    { x: 500, y: 102 },
    { x: 790, y: 70 },
  ] as const;

  return (
    <div className="hero-line" aria-label="A purchase order moves through ingestion, extraction, and match; a person approves at the end">
      <svg viewBox="0 52 1160 66" fill="none" aria-hidden="true">
        <defs>
          <linearGradient id="line-g" x1="0" y1="0" x2="1080" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#7d8ba1" stopOpacity="0" />
            <stop offset="0.1" stopColor="#7d8ba1" />
            <stop offset="0.8" stopColor="#7d8ba1" />
            <stop offset="1" stopColor="#c97b5a" />
          </linearGradient>
        </defs>
        <path className="line-path" d={LINE_PATH} pathLength={1} stroke="url(#line-g)" strokeWidth="1.6" />
        {nodes.map(({ x, y }) => (
          <g className="line-node" key={x}>
            <circle cx={x} cy={y} r="5" fill="var(--bg-0)" stroke="#7d8ba1" strokeWidth="1.6" />
            <circle cx={x} cy={y} r="1.8" fill="#a7b4c9" />
          </g>
        ))}
        <g className="line-node">
          <circle className="line-pulse" cx="1080" cy="90" r="9" fill="none" stroke="#c97b5a" strokeWidth="1.4" />
          <circle cx="1080" cy="90" r="6.5" fill="var(--bg-0)" stroke="#c97b5a" strokeWidth="1.8" />
          <circle cx="1080" cy="90" r="2.4" fill="#e0997a" />
        </g>
        <circle className="line-traveler" r="3.4" fill="#cdd2da">
          <animateMotion dur="7s" begin="3.2s" repeatCount="indefinite" calcMode="linear" keyPoints="0;1;1" keyTimes="0;0.62;1" path={LINE_PATH} />
        </circle>
      </svg>
      <div className="line-labels" aria-hidden="true">
        <span style={{ left: '18.1%' }}>Ingest</span>
        <span style={{ left: '43.1%' }}>Extract</span>
        <span style={{ left: '68.1%' }}>Match</span>
        <span className="ember" style={{ left: '93.1%' }}>You approve</span>
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section className="ink-hero">
      <div className="ink-hero-center">
        <p className="ink-kicker">The AI decision layer for procurement</p>
        <h1 className="ink-title">Procurement without <em>guesswork</em>.</h1>
        <p className="ink-sub">AI reads every supplier quote, flags what&apos;s off, and drafts the order. <b className="ember-note">You approve.</b></p>
        <div className="ink-cta">
          <Link className="button primary" href="/demo-workflow" data-track="hero_live_demo">See it work</Link>
        </div>
      </div>
      <HeroLine />
    </section>
  );
}

export function FilmShowcase() {
  return (
    <section id="product-film" className="section-shell film-showcase">
      <div className="section-heading-block centered">
        <p className="eyebrow">The decision workspace</p>
        <h2>Three quotes. Three formats. One defensible choice.</h2>
      </div>
      <ProductFilm />
    </section>
  );
}

export function ProofMetricsStrip() {
  const metrics = [
    ['Quote comparison', 'Minutes, not afternoons'],
    ['Exceptions', 'Nothing silently missing'],
    ['Approvals', 'Humans decide — always'],
    ['Audit trail', 'Every step recorded'],
  ] as const;

  return (
    <section className="proof-strip" aria-label="What the decision layer guarantees">
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

export function HowItWorks() {
  const steps = [
    ['Ingest', 'Quotes come in as they are — PDF, email, spreadsheet.'],
    ['Extract', 'AI pulls price, terms, freight, lead time — sources shown.'],
    ['Match', 'Options line up side by side. Gaps get flagged, not guessed.'],
    ['You approve', 'One recommendation, its evidence, your call.'],
  ] as const;

  return (
    <section className="section-shell compact-section">
      <div className="section-heading-block">
        <p className="eyebrow">How it works</p>
        <h2>AI does the work. You make the call.</h2>
      </div>
      <div className="stage-grid">
        {steps.map(([title, body], index) => (
          <article key={title} className={index === steps.length - 1 ? 'human' : undefined}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <h3>{title}</h3>
            <p>{body}</p>
          </article>
        ))}
      </div>
      <div className="hero-actions">
        <Link className="text-link" href="/workflow">Walk the full workflow →</Link>
      </div>
    </section>
  );
}

export function UseCasesSection() {
  const cases = [
    ['Manufacturing', 'Components and materials, alternates in view.'],
    ['Construction', 'Bid packages, substitutions, live lead times.'],
    ['Distribution', 'Landed costs and replenishment decisions.'],
    ['Industrial services', 'Field teams, repairs, urgent requests.'],
    ['Facilities', 'Recurring parts and service quotes, clean approvals.'],
    ['Operations', 'The context behind every recommendation.'],
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
    'A person approves every purchasing action',
    'Every field shows its confidence and source',
    'Gaps stay flagged — never guessed',
    'Your data is scoped to your workspace',
    'Full audit trail of decisions and overrides',
    'No autonomous purchasing — ever',
  ] as const;

  return (
    <section className="section-shell trust-section">
      <div>
        <p className="eyebrow">Trust model</p>
        <h2>Intelligence you can review. Decisions you control.</h2>
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
      <p className="eyebrow">Corven</p>
      <h2>{title}</h2>
      <p>Live demo with sample data — no account required.</p>
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
        <span>Corven decision layer</span>
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
            Karan Patel founded Corven with a conviction: purchasing teams do not need more automation that acts for
            them — they need a decision layer that thinks with them. Corven turns fragmented supplier quotes into
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
