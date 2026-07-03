<<<<<<< HEAD
import { LeadForm } from '@/components/leads/LeadForm';
=======
import Link from 'next/link';
>>>>>>> origin/main

export const metadata = { title: 'Contact | ProcureIQ', description: 'Contact ProcureIQ to discuss RFQs, quote comparison, PO drafts, and supplier memory workflows.' };

export default function ContactPage() {
<<<<<<< HEAD
  return <main><section className="page-hero section-shell compact"><p className="eyebrow">Contact</p><h1>Talk with ProcureIQ about a cleaner purchasing workflow.</h1><p>Tell us about your RFQ volume, supplier quote process, current tools, and where visibility breaks down. The ProcureIQ team will respond with practical next steps.</p><LeadForm type="contact" cta="Send message" /></section></main>;
=======
  return <main><section className="page-hero section-shell compact"><p className="eyebrow">Contact</p><h1>Talk with ProcureIQ about your purchasing workflow.</h1><p>Share how your team handles RFQs, quote comparison, approvals, and supplier history today. We will help map a focused demo around your buying motion.</p><div className="contact-panel"><Link className="button primary" href="mailto:founders@procureiq.ai">Email ProcureIQ</Link><Link className="button secondary" href="/demo">Book a Demo</Link></div></section></main>;
>>>>>>> origin/main
}
