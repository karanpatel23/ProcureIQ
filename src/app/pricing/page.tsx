import { FinalCta, PricingSection } from '@/components/site';

export const metadata = { title: 'Pricing | ProcureIQ', description: 'Starter, Growth, and Pro pricing previews for procurement workflow teams.' };

export default function PricingPage() {
  return <main><section className="page-hero section-shell compact"><p className="eyebrow">Pricing</p><h1>Start with quote clarity, then scale into supplier intelligence.</h1><p>Billing is not active yet. Talk with the ProcureIQ team to map the right pilot and rollout path.</p></section><PricingSection /><FinalCta /></main>;
}
