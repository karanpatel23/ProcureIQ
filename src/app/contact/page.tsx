import { LeadForm } from '@/components/leads/LeadForm';

export const metadata = { title: 'Contact | ProcureIQ', description: 'Contact ProcureIQ to discuss procurement intelligence for supplier-heavy purchasing work.' };

export default function ContactPage() {
  return <main><section className="page-hero section-shell compact"><p className="eyebrow">Contact</p><h1>Talk with ProcureIQ about supplier decision complexity.</h1><p>Tell us where supplier context, approvals, and purchasing visibility become difficult. We will respond with practical next steps.</p><LeadForm type="contact" cta="Send message" /></section></main>;
}
