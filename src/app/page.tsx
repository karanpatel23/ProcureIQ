import type { Metadata } from 'next';
import {
  FilmShowcase,
  FinalCta,
  Hero,
  HowItWorks,
  ProofMetricsStrip,
  TrustSection,
  UseCasesSection,
} from '@/components/site';

export const metadata: Metadata = { alternates: { canonical: '/' } };

export default function Home() {
  return (
    <main>
      <Hero />
      <FilmShowcase />
      <ProofMetricsStrip />
      <HowItWorks />
      <UseCasesSection />
      <TrustSection />
      <FinalCta />
    </main>
  );
}
