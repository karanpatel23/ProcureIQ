import Link from 'next/link';
import { AuthForm } from '@/components/auth/AuthForm';

export const metadata = { title: 'Sign up | ProcureIQ', description: 'Create a ProcureIQ account and start setting up your company workspace.' };
export default function SignupPage() { return <main><section className="auth-shell"><div><p className="eyebrow">Create your account</p><h1>Build your procurement workspace.</h1><p>Start with secure email and password access. Then create your company workspace for supplier-heavy purchasing workflows.</p><p className="auth-switch">Already have an account? <Link href="/login">Log in</Link>.</p></div><AuthForm mode="signup" /></section></main>; }
