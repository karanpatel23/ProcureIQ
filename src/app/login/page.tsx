import Link from 'next/link';
import { AuthForm } from '@/components/auth/AuthForm';

export const metadata = { title: 'Log in | ProcureIQ', description: 'Log in to your ProcureIQ procurement workspace.' };
export default function LoginPage() { return <main><section className="auth-shell"><div><p className="eyebrow">Secure workspace access</p><h1>Log in to ProcureIQ.</h1><p>Access RFQ workspaces, quote comparisons, supplier memory, and purchase order draft workflows.</p><p className="auth-switch">Need an account? <Link href="/signup">Create one</Link>.</p></div><AuthForm mode="login" /></section></main>; }
