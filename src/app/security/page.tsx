import { FinalCta, TrustSection } from '@/components/site';

export const metadata = { title: 'Security and Trust | ProcureIQ', description: 'Human approval, source traceability, role-based access, secure document handling, and audit logs for procurement workflows.' };

export default function SecurityPage() {
  return <main><section className="page-hero section-shell compact"><p className="eyebrow">Security and trust</p><h1>Controls for teams that need purchasing confidence.</h1><p>ProcureIQ is built around reviewable AI drafts, source-backed extraction, role-based access, document controls, and auditability.</p></section><TrustSection /><FinalCta /></main>;
}
