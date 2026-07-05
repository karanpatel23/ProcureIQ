import { LeadForm } from '@/components/leads/LeadForm';

export const metadata = { title: 'Book a Demo | ProcureIQ', description: 'Book a ProcureIQ demo for RFQs, supplier quote ingestion, comparison, PO draft workflows, and purchasing visibility.' };

export default function DemoPage() {
  return <main><section className="page-hero section-shell compact"><p className="eyebrow">Book a Demo</p><h1>See ProcureIQ on your purchasing workflow.</h1><p>Share how your team manages supplier quotes today. We will tailor the demo around RFQs, quote comparison, PO draft review, supplier memory, and purchasing visibility.</p><LeadForm type="demo" cta="Request demo" /></section></main>;
}
