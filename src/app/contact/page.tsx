import { LeadForm } from '@/components/leads/LeadForm';

export const metadata = { title: 'Contact | Corven', description: 'Contact Corven to discuss RFQs, quote comparison, PO drafts, and supplier memory workflows.' };

export default function ContactPage() {
  return <main><section className="page-hero section-shell compact"><p className="eyebrow">Contact</p><h1>Talk with Corven about a cleaner purchasing workflow.</h1><p>Tell us about your RFQ volume, supplier quote process, current tools, and where visibility breaks down. The Corven team will respond with practical next steps.</p><LeadForm type="contact" cta="Send message" /></section></main>;
}
