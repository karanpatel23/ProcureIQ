import type { Metadata } from 'next';
import {
  FilmShowcase,
  FinalCta,
  Hero,
  ProblemSection,
  ProductStorySection,
  ProofMetricsStrip,
  TrustSection,
  UseCasesSection,
  WorkflowPreview,
} from '@/components/site';

export const metadata: Metadata = { alternates: { canonical: '/' } };

export default function Home() {
  return (
    <main>
      <Hero />
      <FilmShowcase />
      <ProofMetricsStrip />
      <ProblemSection />
      <ProductStorySection />
      <WorkflowPreview />
      <UseCasesSection />
      <TrustSection />
      <FinalCta />
    </main>
  );
}
