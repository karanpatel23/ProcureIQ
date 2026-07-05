import { FinalCta, PlatformModules, PlatformSystemMap } from '@/components/site';

export const metadata = { title: 'Platform | ProcureIQ', description: 'A product architecture tour of ProcureIQ RFQ, quote intake, extraction review, comparison, supplier memory, PO draft, analytics, and audit workflows.' };

export default function PlatformPage() {
  return <main><section className="page-hero section-shell"><div><p className="eyebrow">Platform</p><h1>ProcureIQ operating layer.</h1><p>One controlled procurement record for RFQs, supplier quote evidence, comparison decisions, supplier memory, and draft purchase orders.</p></div><PlatformSystemMap /></section><PlatformModules /><FinalCta /></main>;
}
