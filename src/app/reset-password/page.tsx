import Link from 'next/link';
import { ResetPasswordForm } from '@/components/auth/PasswordForms';

export const metadata = { title: 'Set a new password | Corven', description: 'Choose a new password for your Corven account.' };

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return (
    <main>
      <section className="auth-shell">
        <div>
          <p className="eyebrow">Account recovery</p>
          <h1>Choose a new password.</h1>
          <p>Set a strong password for your Corven account. This link works once and expires an hour after it was sent.</p>
          <p className="auth-switch">Need a new link? <Link href="/forgot-password">Request one</Link>.</p>
        </div>
        <div className="auth-panel"><ResetPasswordForm token={token ?? ''} /></div>
      </section>
    </main>
  );
}
