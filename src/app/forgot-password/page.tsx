import Link from 'next/link';
import { ForgotPasswordForm } from '@/components/auth/PasswordForms';

export const metadata = { title: 'Reset password | Corven', description: 'Request a link to reset your Corven password.' };

export default function ForgotPasswordPage() {
  return (
    <main>
      <section className="auth-shell">
        <div>
          <p className="eyebrow">Account recovery</p>
          <h1>Reset your password.</h1>
          <p>Enter the email on your account and we’ll send a secure, single-use link to set a new password.</p>
          <p className="auth-switch">Remembered it? <Link href="/login">Log in</Link>.</p>
        </div>
        <div className="auth-panel"><ForgotPasswordForm /></div>
      </section>
    </main>
  );
}
