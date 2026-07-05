import { FinalCta, PlatformModules, PlatformSystemMap } from '@/components/site';

export const metadata = { title: 'Platform | ProcureIQ', description: 'ProcureIQ is an AI-native procurement intelligence layer for modern purchasing teams.' };

export default function PlatformPage() {
  return <main><section className="page-hero section-shell"><div><p className="eyebrow">Platform</p><h1>An intelligent layer for modern purchasing.</h1><p>ProcureIQ gives teams a calmer way to bring supplier context, review, decisions, and approvals into one operating surface.</p></div><PlatformSystemMap /></section><PlatformModules /><FinalCta title="Bring supplier context into one intelligent layer." /></main>;
}
