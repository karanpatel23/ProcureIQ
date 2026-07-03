import { FinalCta, FounderSection, GoalsSection } from '@/components/site';

export const metadata = { title: 'About | ProcureIQ', description: 'ProcureIQ is building procurement intelligence for supplier-heavy companies and modern purchasing teams.' };

<<<<<<< HEAD
const principles = ['Clarity over complexity', 'Human approval for purchasing', 'Source traceability', 'Practical automation', 'Trust-first AI'];

export default function AboutPage() {
  return <main><section className="page-hero section-shell compact"><p className="eyebrow">About ProcureIQ</p><h1>Building the procurement intelligence layer for supplier-heavy companies.</h1><p>ProcureIQ exists to help operations teams, procurement teams, manufacturers, contractors, distributors, and industrial companies make supplier decisions with more speed, context, and control.</p></section><section className="section-shell light-section"><p className="eyebrow">Why ProcureIQ exists</p><h2>Purchasing teams deserve software that understands RFQs, quotes, terms, approvals, and source evidence.</h2><p>We are building ProcureIQ so supplier-heavy companies can collect quote information, compare options, preserve supplier memory, and prepare purchasing documents without losing trust in the process.</p><div className="card-grid features">{principles.map((principle) => <article key={principle}><h3>{principle}</h3><p>{principle === 'Trust-first AI' ? 'AI assists with drafts, extraction, and recommendations while teams stay in control.' : 'A product principle that keeps ProcureIQ focused on practical procurement workflows.'}</p></article>)}</div></section><GoalsSection /><FounderSection /><FinalCta /></main>;
=======
export default function AboutPage() {
  return <main><section className="page-hero section-shell compact"><p className="eyebrow">About ProcureIQ</p><h1>Building the procurement intelligence layer for supplier-heavy companies.</h1><p>ProcureIQ exists to help operations teams, procurement teams, manufacturers, contractors, distributors, and industrial companies make supplier decisions with more speed and control.</p></section><GoalsSection /><FounderSection /><FinalCta /></main>;
>>>>>>> origin/main
}
