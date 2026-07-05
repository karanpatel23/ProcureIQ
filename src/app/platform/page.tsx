import { FinalCta, PlatformModules, PlatformSystemMap } from '@/components/site';

export const metadata = { title: 'Platform | ProcureIQ', description: 'ProcureIQ is an AI-native procurement intelligence layer for modern purchasing teams.' };

export default function PlatformPage() {
  return <main><section className="page-hero section-shell"><div><p className="eyebrow">Platform</p><h1>An intelligent layer between supplier activity and purchasing action.</h1><p>ProcureIQ gives teams a precise operating surface for context, review, decisions, and approvals without exposing the deeper procurement playbook publicly.</p></div><PlatformSystemMap /></section><PlatformModules /><FinalCta title="Bring procurement intelligence into your purchasing motion." /></main>;
}
