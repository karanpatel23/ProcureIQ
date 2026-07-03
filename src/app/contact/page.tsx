import Link from 'next/link';

export const metadata = { title: 'Contact | ProcureIQ', description: 'Contact ProcureIQ to discuss RFQs, quote comparison, PO drafts, and supplier memory workflows.' };

export default function ContactPage() {
  return <main><section className="page-hero section-shell compact"><p className="eyebrow">Contact</p><h1>Talk with ProcureIQ about your purchasing workflow.</h1><p>Share how your team handles RFQs, quote comparison, approvals, and supplier history today. We will help map a focused demo around your buying motion.</p><div className="contact-panel"><Link className="button primary" href="mailto:founders@procureiq.ai">Email ProcureIQ</Link><Link className="button secondary" href="/demo">Book a Demo</Link></div></section></main>;
}
