import Link from 'next/link';

export const metadata = { title: 'ProcureIQ App Preview', description: 'ProcureIQ application access preview.' };

export default function AppPreviewPage() {
  return <main><section className="page-hero section-shell compact"><p className="eyebrow">Application preview</p><h1>The ProcureIQ workspace is invite-only during Phase 1.</h1><p>Public access is focused on product education and demos while the authenticated RFQ workspace, approval controls, and supplier memory are prepared for private pilots.</p><Link className="button primary" href="/demo">Book a Demo</Link></section></main>;
}
