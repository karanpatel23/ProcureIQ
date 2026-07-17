import { redirect } from 'next/navigation';
import { OnboardingForm } from '@/components/auth/OnboardingForm';
import { getPrimaryWorkspace, requirePageUser } from '@/lib/server/auth';

export const metadata = { title: 'Create workspace | Corven', description: 'Set up your Corven company workspace.' };
export default async function OnboardingPage() { const { user } = await requirePageUser(); const existing = await getPrimaryWorkspace(user.id); if (existing) redirect('/app/dashboard'); return <main><section className="auth-shell onboarding-shell"><div><p className="eyebrow">Workspace setup</p><h1>Create your company workspace.</h1><p>Corven scopes every RFQ, supplier, quote document, approval, and audit event to a workspace so company data stays separated and controlled.</p></div><OnboardingForm /></section></main>; }
