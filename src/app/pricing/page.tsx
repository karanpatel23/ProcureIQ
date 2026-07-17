import { FinalCta, PricingSection } from '@/components/site';

export const metadata = {
  title: 'Pricing',
  description: 'Starter from $99/month, Growth from $249/month, Pro from $799/month, and custom Enterprise plans for Corven.',
};

export default function PricingPage() {
  return (
    <main>
      <section className="page-hero section-shell compact">
        <p className="eyebrow">Pricing</p>
        <h1>Published starting points for serious purchasing workflows.</h1>
        <p>Plans scale by quote volume, users, workflow depth, and onboarding needs. Every rollout starts with a guided implementation.</p>
      </section>
      <PricingSection />
      <section className="section-shell compact-section">
        <div className="section-heading-block">
          <p className="eyebrow">Implementation</p>
          <h2>Implementation starts from $500.</h2>
          <p className="lead">
            Implementation covers workflow setup, RFQ templates, supplier import support, and a guided review of quote
            extraction controls — so your team starts with a working decision workflow, not an empty tool.
          </p>
        </div>
      </section>
      <FinalCta />
    </main>
  );
}
