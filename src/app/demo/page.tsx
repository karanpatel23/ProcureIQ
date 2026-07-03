<<<<<<< HEAD
import { LeadForm } from '@/components/leads/LeadForm';
=======
import Link from 'next/link';
>>>>>>> origin/main

export const metadata = { title: 'Book a Demo | ProcureIQ', description: 'Book a ProcureIQ demo for RFQs, supplier quote ingestion, comparison, PO draft workflows, and purchasing visibility.' };

export default function DemoPage() {
<<<<<<< HEAD
  return <main><section className="page-hero section-shell compact"><p className="eyebrow">Book a Demo</p><h1>See ProcureIQ on your purchasing workflow.</h1><p>Share how your team manages supplier quotes today. We will tailor the demo around RFQs, quote comparison, PO draft review, supplier memory, and purchasing visibility.</p><LeadForm type="demo" cta="Request demo" /></section></main>;
=======
  return <main><section className="page-hero section-shell compact"><p className="eyebrow">Book a Demo</p><h1>See how ProcureIQ turns supplier quotes into decisions.</h1><p>Demo scheduling is currently handled by the founding team. Send a note with your purchasing workflow, supplier volume, and current tools.</p><div className="contact-panel"><Link className="button primary" href="mailto:founders@procureiq.ai?subject=ProcureIQ%20Demo%20Request">Request Demo Time</Link><Link className="button secondary" href="/platform">View Platform</Link></div></section></main>;
>>>>>>> origin/main
}
