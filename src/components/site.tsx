import Link from 'next/link';
import { DecisionMatrix, PODraftPreview, QuoteStack, RFQPacket, SupplierMemoryCard, WorkflowRail } from './procurement-visuals';
export { DecisionMatrix, EvidencePin, PODraftPreview, QuoteStack, RFQPacket, SupplierMemoryCard, WorkflowRail } from './procurement-visuals';

export const TAGLINE = 'The AI decision layer for procurement';

export const navItems = [
  { href: '/platform', label: 'Platform' },
  { href: '/workflow', label: 'Workflow' },
  { href: '/security', label: 'Security' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/about', label: 'About' },
] as const;

export function Header() {
  return <header className="site-header"><Link className="brand" href="/" aria-label="ProcureIQ home"><span>ProcureIQ</span><small>{TAGLINE}</small></Link><nav aria-label="Primary navigation">{navItems.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}</nav><div className="header-actions"><Link href="/login">Login</Link><Link href="/signup">Sign Up</Link><Link className="button secondary" href="/demo-workflow">Try Demo Workflow</Link><Link className="button primary" href="/demo">Book Demo</Link></div></header>;
}

export function Footer() {
  const links = [...navItems, { href: '/login', label: 'Login' }, { href: '/signup', label: 'Sign Up' }, { href: '/demo-workflow', label: 'Try Demo Workflow' }, { href: '/demo', label: 'Book Demo' }, { href: '/privacy', label: 'Privacy' }, { href: '/terms', label: 'Terms' }, { href: '/contact', label: 'Contact' }];
  return <footer className="footer"><div><strong>ProcureIQ</strong><p>{TAGLINE}. Built for teams that need speed without losing control.</p></div><nav aria-label="Footer navigation">{links.map((item) => <Link key={`${item.href}-${item.label}`} href={item.href}>{item.label}</Link>)}</nav></footer>;
}

export function ProductFilm() {
  return <section className="product-film" aria-label="Animated procurement intelligence preview"><div className="film-orbit" /><div className="film-layer layer-one"><span>Supplier context</span><strong>Northline Metals</strong><p>Terms verified · decision note ready</p></div><div className="film-layer layer-two"><span>Review layer</span><strong>3 quotes aligned</strong><p>Exceptions surfaced for approval</p></div><div className="film-layer layer-three"><span>Decision panel</span><strong>Draft recommendation</strong><p>Human approval required</p></div><div className="film-timeline"><i /><b>RFQ</b><b>Review</b><b>Decision</b><b>Draft</b></div></section>;
}

export function Hero() {
  return <section className="hero section-shell"><div className="hero-copy"><p className="eyebrow">{TAGLINE}</p><h1>Supplier complexity, ready for decision.</h1><p className="hero-subhead">ProcureIQ brings supplier context, decisions, and approvals into one intelligent layer for modern purchasing teams.</p><div className="hero-actions"><Link className="button primary" href="/demo-workflow">Try Demo Workflow</Link><Link className="button secondary" href="/demo">Book Demo</Link><Link className="text-link" href="/platform">View Platform</Link></div></div><ProductFilm /></section>;
}
export function HeroVisual() { return <ProductFilm />; }

export function ProofMetricsStrip() { const metrics = [['Decision context', 'in one layer'], ['Approval', 'human-led'], ['Sensitive data', 'workspace-bound'], ['Outputs', 'draft before action']]; return <section className="proof-strip" aria-label="ProcureIQ principles">{metrics.map(([label, value], index) => <article key={label}><span>{String(index + 1).padStart(2, '0')}</span><strong>{value}</strong><p>{label}</p></article>)}</section>; }
export function ProblemSection() { const items = [['Supplier inputs keep multiplying', 'Pricing, terms, timing, and exceptions arrive across disconnected channels.'], ['Decisions need more confidence', 'Purchasing teams need speed while preserving judgment, context, and control.'], ['Approvals deserve a system of record', 'Critical supplier choices should not rely on scattered notes or memory.']]; return <section className="section-shell compact-section"><div className="section-heading-block"><p className="eyebrow">Why now</p><h2>Quote-heavy procurement is becoming too complex for manual coordination.</h2></div><div className="three-card-grid">{items.map(([title, body]) => <article key={title}><h3>{title}</h3><p>{body}</p></article>)}</div></section>; }
export function WorkflowPreview() { return <section className="section-shell control-section"><div><p className="eyebrow">Product experience</p><h2>From scattered inputs to decision-ready context.</h2><p>A guided workspace helps teams move through high-stakes supplier work without exposing proprietary judgment to automation.</p></div><WorkflowRail steps={['Request', 'Context', 'Review', 'Decision', 'Draft']} /></section>; }
export function TrustSection() { const controls = ['AI support stays draft-based', 'Human approval stays central', 'Workspace boundaries protect supplier context', 'Evidence remains reviewable', 'Customer data is not used for model training without explicit consent']; return <section className="section-shell trust-section"><div><p className="eyebrow">Trust posture</p><h2>Built for control before acceleration.</h2><p>ProcureIQ is designed for responsible procurement work where sensitive supplier information, approvals, and AI assistance remain governed.</p></div><ul>{controls.map((control) => <li key={control}>{control}</li>)}</ul></section>; }
export function FinalCta({ title = 'See the intelligence layer before the sales call.' }: { title?: string }) { return <section className="final-cta"><p className="eyebrow">{TAGLINE}</p><h2>{title}</h2><div className="hero-actions"><Link className="button primary" href="/demo-workflow">Try Demo Workflow</Link><Link className="button secondary" href="/demo">Book Demo</Link></div></section>; }

export const platformModules = [
  ['01', 'Intake workspace', 'A calm place to gather supplier-facing work.', 'Keeps request context, stakeholder notes, and supplier inputs together without forcing a tool migration.'],
  ['02', 'Guided review', 'Turns scattered supplier responses into reviewable context.', 'Highlights what needs attention while keeping final judgment with your team.'],
  ['03', 'Decision layer', 'Frames options, tradeoffs, and approval context.', 'Designed to help teams move quickly without burying uncertainty.'],
  ['04', 'Supplier context', 'Keeps useful supplier history available when it matters.', 'Surfaces institutional context without exposing the underlying playbook publicly.'],
  ['05', 'Drafting surface', 'Prepares downstream purchasing work for review.', 'Outputs remain drafts until an authorized person approves next steps.'],
  ['06', 'Visibility layer', 'Gives leaders practical procurement visibility.', 'Shows status, bottlenecks, and activity at the level teams need for operating rhythm.'],
] as const;

export function PlatformSystemMap() { return <section className="system-map"><div className="system-core"><span>ProcureIQ</span><strong>{TAGLINE}</strong><p>One intelligent layer for supplier context, review, and purchasing visibility.</p></div><div className="system-nodes">{platformModules.map(([num, title]) => <a href={`#module-${num}`} key={num}><span>{num}</span>{title}</a>)}</div></section>; }
export function PlatformModules() { return <section className="section-shell module-list">{platformModules.map(([num, title, summary, body]) => <article id={`module-${num}`} key={num} className="numbered-module"><span>{num}</span><div><h2>{title}</h2><p>{summary}</p><p>{body}</p></div></article>)}</section>; }

export function PricingSection() { const plans: Array<{ name: string; price: string; body: string; features: string[] }> = [{ name: 'Starter', price: 'from $99/month', body: 'For lean purchasing teams getting organized.', features: ['Core workspace', 'Guided setup', 'Foundational visibility'] }, { name: 'Growth', price: 'from $249/month', body: 'For teams managing recurring supplier quote activity.', features: ['Expanded quote volume', 'Shared review workspace', 'Decision notes'] }, { name: 'Pro', price: 'from $799/month', body: 'For multi-user procurement and operations teams.', features: ['Advanced controls', 'Supplier context', 'Export workflows'] }, { name: 'Enterprise', price: 'custom', body: 'For tailored onboarding, permissions, and integration planning.', features: ['Admin readiness', 'Workflow design', 'Security review support'] }]; return <section className="section-shell pricing"><p className="eyebrow">Pricing</p><h2>Simple starting points. Designed to scale with purchasing complexity.</h2><p>Pricing is based on quote volume, users, workflow depth, and onboarding. Implementation starts from $500.</p><div className="pricing-grid">{plans.map(({ name, price, body, features }) => <article key={name}><span>{name}</span><strong>{price}</strong><p>{body}</p><ul>{features.map((feature) => <li key={feature}>{feature}</li>)}</ul><Link className="button secondary" href="/demo">Talk to Sales</Link></article>)}</div></section>; }
export function FounderSection() { return <section className="founder section-shell"><div className="founder-card"><div className="founder-mark">KP</div><div><p className="eyebrow">Founder</p><h2>Karan Patel</h2><p>Karan Patel is building ProcureIQ to help purchasing and operations teams turn fragmented supplier context into clearer, reviewable decisions. The ambition is to make modern procurement faster, more controlled, and easier to trust without removing human judgment from critical purchasing work.</p></div></div></section>; }
export function GoalsSection() { const goals = ['Reduce manual coordination around supplier decisions', 'Improve clarity before purchasing action', 'Preserve context from request to approval', 'Build the trusted intelligence layer for supplier-driven companies']; return <section className="section-shell goals"><p className="eyebrow">Company direction</p><h2>Procurement intelligence for teams operating across complex supplier networks.</h2><div className="goal-grid">{goals.map((goal, index) => <article key={goal}><span>0{index + 1}</span><p>{goal}</p></article>)}</div></section>; }
export function IndustriesSection() { return <section className="section-shell"><p className="eyebrow">Use cases</p><h2>Designed for purchasing teams operating across manufacturers, contractors, distributors, industrial services, and facility operations.</h2></section>; }
export function FeaturesSection() { return <PlatformModules />; }
export function WorkflowSection() { return <WorkflowPreview />; }
