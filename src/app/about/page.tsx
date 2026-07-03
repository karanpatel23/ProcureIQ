import { FinalCta, FounderSection, GoalsSection } from '@/components/site';

export const metadata = { title: 'About | ProcureIQ', description: 'ProcureIQ is building procurement intelligence for supplier-heavy companies and modern purchasing teams.' };

export default function AboutPage() {
  return <main><section className="page-hero section-shell compact"><p className="eyebrow">About ProcureIQ</p><h1>Building the procurement intelligence layer for supplier-heavy companies.</h1><p>ProcureIQ exists to help operations teams, procurement teams, manufacturers, contractors, distributors, and industrial companies make supplier decisions with more speed and control.</p></section><GoalsSection /><FounderSection /><FinalCta /></main>;
}
