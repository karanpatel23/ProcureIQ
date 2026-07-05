import { FinalCta, FounderSection, GoalsSection } from '@/components/site';

export const metadata = { title: 'About | ProcureIQ', description: 'ProcureIQ is building procurement intelligence for supplier-driven companies.' };
export default function AboutPage() { return <main><section className="page-hero section-shell compact"><p className="eyebrow">About ProcureIQ</p><h1>Where supplier complexity becomes clarity.</h1><p>ProcureIQ is building an AI-native procurement intelligence layer for teams that need faster decisions without losing control, context, or trust.</p></section><FounderSection /><GoalsSection /><FinalCta title="See the future purchasing workspace." /></main>; }
