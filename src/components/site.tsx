import Link from 'next/link';

export const TAGLINE = 'The AI decision layer for procurement';

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
      <div className="nav-shell">
        <Link className="brand" href="/" aria-label="ProcureIQ home">
          <span>ProcureIQ</span>
          <small>{TAGLINE}</small>
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
        <p>{TAGLINE}. Built for quote-heavy teams that need confidence before action.</p>
      </div>
      <nav aria-label="Footer navigation">
        {links.map((item) => (
          <Link key={`${item.href}-${item.label}`} href={item.href}>{item.label}</Link>
        ))}
      </nav>
    </footer>
  );
}

export function ProductFilm() {
  const scenes = ['Supplier signal', 'Context forms', 'Decision layer', 'Approval state', 'Action ready'];

  return (
    <section className="product-film" aria-label="Procurement intelligence preview">
      <div className="film-ambient" />
      <div className="film-topline"><span>Apex Industrial Works</span><b>Live workspace</b></div>
      <div className="signal-stream" aria-hidden="true"><i /><i /><i /></div>
      <article className="film-card film-card-a"><span>Supplier signal</span><strong>Northline Metals</strong><p>Commercial context received</p></article>
      <article className="film-card film-card-b"><span>Context panel</span><strong>Decision-ready view</strong><p>Terms, timing, and exceptions aligned</p></article>
      <article className="film-card film-card-c"><span>Approval state</span><strong>Human review required</strong><p>Draft output is ready for control</p></article>
      <div className="film-decision"><span>ProcureIQ layer</span><b>Confidence before action</b><em>Draft recommendation</em></div>
      <ol className="film-steps">
        {scenes.map((scene, index) => <li key={scene}><span>{String(index + 1).padStart(2, '0')}</span>{scene}</li>)}
      </ol>
    </section>
  );
}

export function Hero() {
  return (
    <section className="hero section-shell">
      <div className="hero-copy">
        <p className="eyebrow">{TAGLINE}</p>
        <h1>Supplier decisions with intelligence and control.</h1>
        <p className="hero-subhead">ProcureIQ brings supplier context, guided review, and approval visibility into one focused workspace for modern purchasing teams.</p>
        <div className="hero-actions">
          <Link className="button primary" href="/demo-workflow">Try Demo Workflow</Link>
          <Link className="button secondary" href="/demo">Book Demo</Link>
          <Link className="text-link" href="/platform">View Platform</Link>
        </div>
      </div>
      <ProductFilm />
    </section>
  );
}

export function ProofMetricsStrip() {
  const metrics = [['Built for', 'quote-heavy teams'], ['Control model', 'human-led'], ['Workspace', 'source-aware'], ['Output state', 'draft before action']];
  return <section className="proof-strip" aria-label="ProcureIQ principles">{metrics.map(([label, value]) => <article key={label}><span>{label}</span><strong>{value}</strong></article>)}</section>;
}

export function ProblemSection() {
  const items = [
    ['Supplier context is scattered', 'Critical decisions still depend on disconnected messages, attachments, notes, and tribal knowledge.'],
    ['Speed can weaken control', 'Teams need momentum without turning purchasing judgment into an opaque automated step.'],
    ['Approvals need better memory', 'The reason behind a supplier decision should stay visible when work moves downstream.'],
  ];
  return <section className="section-shell narrative-section"><div className="section-kicker"><p className="eyebrow">Why procurement needs a new layer</p><h2>Procurement teams are moving faster than their decision systems.</h2></div><div className="insight-grid">{items.map(([title, body], index) => <article key={title}><span>0{index + 1}</span><h3>{title}</h3><p>{body}</p></article>)}</div></section>;
}

export function ProductStory() {
  const moments = [['Signal', 'Supplier activity enters one controlled workspace.'], ['Context', 'Commercial details become easier to review and discuss.'], ['Decision', 'Tradeoffs stay visible for the people accountable.'], ['Approval', 'Draft outputs wait for human authorization.']];
  return <section className="section-shell product-story"><div><p className="eyebrow">Product narrative</p><h2>From scattered inputs to operational clarity.</h2><p>ProcureIQ presents the surface area a purchasing team needs, while keeping the deeper intelligence layer discreet and governed.</p></div><div className="story-board">{moments.map(([title, body]) => <article key={title}><span>{title}</span><p>{body}</p></article>)}</div></section>;
}

export function UseCaseSection() {
  const cases = [['Manufacturing teams', 'Move faster across recurring supplier decisions without losing review discipline.'], ['Contractors', 'Keep project purchasing context clear when pricing, timing, and scope shift.'], ['Distribution operations', 'Bring supplier activity into a shared layer for better operating rhythm.'], ['Industrial services', 'Give operators and purchasing teams a cleaner way to align before action.']];
  return <section className="section-shell use-case-section"><div className="section-kicker"><p className="eyebrow">Use cases</p><h2>Designed for purchasing teams operating across complex supplier networks.</h2></div><div className="use-case-grid">{cases.map(([title, body]) => <article key={title}><h3>{title}</h3><p>{body}</p></article>)}</div></section>;
}

export function TrustSection() {
  const controls = ['Draft-based AI assistance', 'Human approval before purchasing action', 'Workspace boundaries for supplier context', 'Reviewable source-aware decisions', 'No customer-data model training without explicit consent'];
  return <section className="section-shell trust-section"><div><p className="eyebrow">Trust posture</p><h2>Enterprise control without theatrical claims.</h2><p>ProcureIQ is designed around sensitive supplier information, governed decisions, and responsible AI boundaries.</p></div><ul>{controls.map((control) => <li key={control}>{control}</li>)}</ul></section>;
}

export function FinalCta({ title = 'See procurement intelligence in motion.' }: { title?: string }) {
  return <section className="final-cta"><p className="eyebrow">ProcureIQ</p><h2>{title}</h2><div className="hero-actions"><Link className="button primary" href="/demo-workflow">Try Demo Workflow</Link><Link className="button secondary" href="/demo">Book Demo</Link></div></section>;
}

export const platformModules = [
  ['01', 'Intelligence layer', 'One surface for supplier context, commercial visibility, and purchasing decisions.'],
  ['02', 'Guided review', 'A focused environment for reviewing supplier inputs without exposing the underlying logic.'],
  ['03', 'Decision workspace', 'A place to evaluate tradeoffs, record judgment, and keep stakeholders aligned.'],
  ['04', 'Approval visibility', 'Draft outputs and next actions stay governed until an authorized person moves them forward.'],
  ['05', 'Operating memory', 'Useful supplier context remains available for future work without turning the public site into the product playbook.'],
] as const;

export function PlatformSystemMap() {
  return <section className="system-map"><div className="system-core"><span>ProcureIQ</span><strong>{TAGLINE}</strong><p>A discreet intelligence layer between supplier activity and purchasing action.</p></div><div className="system-arc" aria-hidden="true"><i /><i /><i /></div><div className="system-nodes">{platformModules.map(([num, title]) => <a href={`#module-${num}`} key={num}><span>{num}</span>{title}</a>)}</div></section>;
}

export function PlatformModules() {
  return <section className="section-shell module-list">{platformModules.map(([num, title, body]) => <article id={`module-${num}`} key={num} className="numbered-module"><span>{num}</span><div><h2>{title}</h2><p>{body}</p></div></article>)}</section>;
}

export function PricingSection() {
  const plans: Array<{ name: string; price: string; body: string; features: string[] }> = [
    { name: 'Starter', price: 'from $99/month', body: 'For lean purchasing teams getting organized.', features: ['Core workspace', 'Guided onboarding', 'Foundational visibility'] },
    { name: 'Growth', price: 'from $249/month', body: 'For teams managing recurring supplier quote activity.', features: ['Expanded usage', 'Shared review layer', 'Decision notes'] },
    { name: 'Pro', price: 'from $799/month', body: 'For multi-user procurement and operations teams.', features: ['Advanced controls', 'Supplier context', 'Export-ready workflows'] },
    { name: 'Enterprise', price: 'custom', body: 'For tailored onboarding, permissions, and integration planning.', features: ['Admin readiness', 'Workflow design', 'Security review support'] },
  ];
  return <section className="section-shell pricing"><div className="section-kicker"><p className="eyebrow">Pricing</p><h2>Credible starting points for serious purchasing work.</h2><p>Pricing is based on quote volume, users, workflow depth, and onboarding. Implementation starts from $500.</p></div><div className="pricing-grid">{plans.map(({ name, price, body, features }) => <article key={name}><span>{name}</span><strong>{price}</strong><p>{body}</p><ul>{features.map((feature) => <li key={feature}>{feature}</li>)}</ul><Link className="button secondary" href="/demo">Talk to Sales</Link></article>)}</div></section>;
}

export function FounderSection() {
  return <section className="founder section-shell"><div className="founder-card"><div className="founder-mark">KP</div><div><p className="eyebrow">Founder</p><h2>Karan Patel</h2><p>Karan Patel is building ProcureIQ to help purchasing and operations teams bring clarity to fragmented supplier decisions. The mission is to make procurement faster and more trustworthy while preserving the human judgment that high-stakes purchasing requires.</p></div></div></section>;
}

export function GoalsSection() {
  const goals = ['Reduce manual coordination around supplier decisions', 'Improve clarity before purchasing action', 'Preserve context from request to approval', 'Build the trusted intelligence layer for supplier-driven companies'];
  return <section className="section-shell goals"><div className="section-kicker"><p className="eyebrow">Mission</p><h2>Procurement intelligence for teams operating across complex supplier networks.</h2></div><div className="goal-grid">{goals.map((goal, index) => <article key={goal}><span>0{index + 1}</span><p>{goal}</p></article>)}</div></section>;
}
