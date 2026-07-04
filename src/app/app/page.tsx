import { redirect } from 'next/navigation';
import { requirePageWorkspace } from '@/lib/server/auth';

export const metadata = { title: 'ProcureIQ App' };
export default async function AppPage() { await requirePageWorkspace(); redirect('/app/dashboard'); }
