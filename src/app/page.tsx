import {
  FinalCta,
  Hero,
  ProblemSection,
  ProductStorySection,
  ProofMetricsStrip,
  TrustSection,
  UseCasesSection,
  WorkflowPreview,
} from '@/components/site';

export default function Home() {
  return (
    <main>
      <Hero />
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
