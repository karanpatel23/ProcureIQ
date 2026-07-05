import { LeadForm } from '@/components/leads/LeadForm';

export const metadata = { title: 'Book a Demo | ProcureIQ', description: 'Book a ProcureIQ demo for procurement intelligence and supplier decision workflows.' };

export default function DemoPage() {
  return <main><section className="page-hero section-shell compact"><p className="eyebrow">Book a Demo</p><h1>See the AI decision layer on your purchasing motion.</h1><p>Share how your team manages supplier decisions today. We will tailor the demo around speed, control, review, and approval visibility.</p><LeadForm type="demo" cta="Request demo" /></section></main>;
}
