import Link from 'next/link';
import { features, industries, navItems, pricingPlans, trustControls, workflowSteps } from '@/lib/site-content';

export function Header() {
  return <header className="site-header"><Link className="brand" href="/">ProcureIQ</Link><nav aria-label="Primary navigation">{navItems.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}</nav><Link className="nav-cta" href="/demo">Book a Demo</Link></header>;
}

export function Footer() {
  return <footer className="footer"><div><strong>ProcureIQ</strong><p>Procurement intelligence for supplier-heavy teams.</p></div><div><Link href="/platform">Platform</Link><Link href="/security">Security</Link><Link href="/pricing">Pricing</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/contact">Contact</Link></div></footer>;
}

export function Hero() {
  return <section className="hero section-shell"><div className="hero-copy"><p className="eyebrow">Quote comparison workflow</p><h1>Turn supplier quotes into clear purchasing decisions.</h1><p className="hero-subhead">ProcureIQ helps growing teams collect RFQs, compare supplier quotes, draft purchase orders, and track supplier history without replacing their current tools.</p><div className="hero-actions"><Link className="button primary" href="/demo">Book a Demo</Link><Link className="button secondary" href="/platform">View Platform</Link></div></div><HeroVisual /></section>;
}

export function HeroVisual() {
  return <div className="hero-visual" aria-label="Supplier quote emails and documents transformed into a comparison table and purchase order draft"><div className="visual-source email"><span>Email quote</span><b>Atlas Components</b><p>Lead time: 18 days · Freight excluded</p></div><div className="visual-source doc"><span>PDF quote</span><b>Northline Metals</b><p>Unit price: $42.80 · Terms: Net 30</p></div><div className="visual-table"><div className="table-head"><span>Supplier</span><span>Total</span><span>Confidence</span></div>{['Northline Metals', 'Atlas Components', 'Kinetic Supply'].map((supplier, index) => <div className="table-row" key={supplier}><span>{supplier}</span><strong>{['$42,840', '$44,120', '$45,300'][index]}</strong><em>{['94%', '89%', '82%'][index]}</em></div>)}</div><div className="po-card"><span>PO draft</span><strong>Requires approval</strong><p>All fields linked to source quote evidence.</p></div></div>;
}

export function ProblemSection() {
  return <section className="problem dark-panel"><div><p className="eyebrow">The purchasing bottleneck</p><h2>Supplier quotes arrive messy. Decisions still need to be precise.</h2></div><div className="problem-grid">{['Critical quote details are buried in email threads, PDF attachments, and spreadsheets.', 'Pricing, lead times, freight terms, alternates, and exceptions are easy to miss.', 'Teams lose hours normalizing supplier responses before anyone can make a decision.', 'Purchase order work is often manual, repetitive, and disconnected from the original quote.', 'Supplier history lives across inboxes and tribal knowledge instead of a searchable memory.'].map((item) => <article key={item}>{item}</article>)}</div></section>;
}

export function WorkflowSection() {
  return <section className="section-shell light-section"><p className="eyebrow">Platform workflow</p><h2>From RFQ to approved PO draft, with traceability at every step.</h2><div className="workflow-grid">{workflowSteps.map(([title, body], index) => <article key={title}><span>{String(index + 1).padStart(2, '0')}</span><h3>{title}</h3><p>{body}</p></article>)}</div></section>;
}

export function IndustriesSection() {
  return <section className="section-shell"><p className="eyebrow">Built for supplier-heavy work</p><h2>Workflows for teams that buy from complex supplier networks.</h2><div className="card-grid industries">{industries.map(([title, body]) => <article key={title}><h3>{title}</h3><p>{body}</p></article>)}</div></section>;
}

export function FeaturesSection() {
  return <section className="section-shell light-section"><p className="eyebrow">Product capabilities</p><h2>The operating layer for RFQs, quotes, approvals, and supplier knowledge.</h2><div className="card-grid features">{features.map(([title, body]) => <article key={title}><h3>{title}</h3><p>{body}</p></article>)}</div></section>;
}

export function TrustSection() {
  return <section className="trust-section dark-panel"><div><p className="eyebrow">Security and control</p><h2>AI drafts. Procurement teams decide.</h2><p>ProcureIQ is designed for controlled purchasing workflows where every recommendation can be reviewed, traced, approved, rejected, or exported by an authorized person.</p></div><ul>{trustControls.map((control) => <li key={control}>{control}</li>)}</ul></section>;
}

export function GoalsSection() {
  const goals = ['Reduce manual quote comparison work', 'Improve purchasing clarity', 'Help teams avoid supplier and pricing mistakes', 'Become the trusted procurement intelligence layer for supplier-heavy companies'];
  return <section className="section-shell goals"><p className="eyebrow">Company goals</p><h2>ProcureIQ is built to make supplier decisions cleaner and faster.</h2><div className="goal-grid">{goals.map((goal, index) => <article key={goal}><span>Goal {index + 1}</span><p>{goal}</p></article>)}</div></section>;
}

export function FounderSection() {
  return <section className="founder light-section"><div className="founder-card"><div className="founder-mark">FN</div><div><p className="eyebrow">About the Founder</p><h2>[Founder Name]</h2><p>Mission: building ProcureIQ to help operations and purchasing teams make faster, cleaner, more confident supplier decisions.</p><p>This section is intentionally editable so the founding story, operating background, and customer focus can be refined as the company grows.</p></div></div></section>;
}

export function PricingSection() {
  return <section className="section-shell pricing"><p className="eyebrow">Pricing preview</p><h2>Choose the workflow depth that matches your purchasing motion.</h2><div className="pricing-grid">{pricingPlans.map(([name, description, items]) => <article key={name}><h3>{name}</h3><p>{description}</p><ul>{items.map((item) => <li key={item}>{item}</li>)}</ul><Link className="button secondary" href={`/demo?plan=${name.toLowerCase()}`}>Talk to Sales</Link></article>)}</div></section>;
}

export function FinalCta() {
  return <section className="final-cta"><p className="eyebrow">ProcureIQ</p><h2>Ready to modernize your purchasing workflow?</h2><div className="hero-actions"><Link className="button primary" href="/demo">Book a Demo</Link><Link className="button secondary" href="/contact">Contact Us</Link></div></section>;
}
export {
  DecisionMatrix,
  EvidencePin,
  PODraftPreview,
  QuoteStack,
  RFQPacket,
  SupplierMemoryCard,
  WorkflowRail,
} from './procurement-visuals';