import { FinalCta, PricingSection } from '@/components/site';

export const metadata = { title: 'Pricing | ProcureIQ', description: 'Starter, Growth, Pro, and Enterprise pricing for ProcureIQ procurement workflows.' };

export default function PricingPage() {
  return <main><section className="page-hero section-shell compact"><p className="eyebrow">Pricing</p><h1>Published starting points for serious purchasing workflows.</h1><p>Plans scale by quote volume, users, workflow depth, and onboarding needs. Billing is not active yet; teams start with a guided rollout.</p></section><PricingSection /><section className="section-shell compact-section"><h2>Implementation starts from $500.</h2><p>Implementation covers workflow setup, RFQ templates, supplier import support, and a guided review of quote extraction controls.</p></section><FinalCta /></main>;
}
