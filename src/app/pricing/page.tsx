import { FinalCta, PricingSection } from '@/components/site';

export const metadata = { title: 'Pricing | ProcureIQ', description: 'Starter, Growth, Pro, and Enterprise pricing previews for quote comparison, RFQs, PO drafts, and supplier memory.' };

export default function PricingPage() {
  return <main><section className="page-hero section-shell compact"><p className="eyebrow">Pricing</p><h1>Pricing for teams turning supplier quotes into purchasing clarity.</h1><p>Choose a sales-guided plan based on RFQ volume, quote complexity, approval needs, and supplier visibility goals. Billing is not active yet, so every plan starts with a consultative setup conversation.</p></section><PricingSection /><FinalCta /></main>;
}
