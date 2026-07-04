import { FeaturesSection, FinalCta, HeroVisual, WorkflowSection } from '@/components/site';

export const metadata = { title: 'Platform | ProcureIQ', description: 'RFQ creation, quote ingestion, quote comparison, PO drafts, supplier memory, and purchasing visibility.' };

export default function PlatformPage() {
  return <main><section className="page-hero section-shell"><div><p className="eyebrow">Platform</p><h1>One workflow for RFQs, supplier quotes, approvals, and PO drafts.</h1><p>ProcureIQ organizes the buying motion around source-backed quote data, side-by-side supplier decisions, and controlled exports into the tools teams already use.</p></div><HeroVisual /></section><WorkflowSection /><FeaturesSection /><FinalCta /></main>;
}
