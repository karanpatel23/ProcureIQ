import { FinalCta, PlatformModules, PlatformSystemMap } from '@/components/site';

export const metadata = {
  title: 'Platform',
  description: 'A tour of the Corven decision layer: RFQ workspace, quote intake, extraction review, comparison, supplier context, PO drafts, and audit trail.',
};

export default function PlatformPage() {
  return (
    <main>
      <section className="page-hero section-shell">
        <div>
          <p className="eyebrow">Platform</p>
          <h1>One decision layer for the whole quote lifecycle.</h1>
          <p>A controlled procurement record for RFQs, supplier quote evidence, comparison decisions, supplier context, and draft purchase orders.</p>
        </div>
        <PlatformSystemMap />
      </section>
      <PlatformModules />
      <FinalCta />
    </main>
  );
}
