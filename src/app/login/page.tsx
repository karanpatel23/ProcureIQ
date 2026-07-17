import Link from 'next/link';
import { AuthForm } from '@/components/auth/AuthForm';
import { OAuthButtons } from '@/components/auth/OAuthButtons';

export const metadata = { title: 'Log in | Corven', description: 'Log in to your Corven procurement workspace.' };

const oauthMessages: Record<string, string> = {
  unavailable: 'That sign-in provider isn’t enabled on this deployment yet.',
  denied: 'Sign-in was cancelled. You can try again.',
  state: 'Your sign-in session expired. Please try again.',
  exchange: 'We couldn’t complete provider sign-in. Please try again or use your password.',
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ oauth?: string; reset?: string }> }) {
  const { oauth, reset } = await searchParams;
  const notice = reset === 'success' ? 'Your password has been updated. Log in with your new password.' : undefined;
  const error = oauth ? (oauthMessages[oauth] ?? 'Sign-in could not be completed.') : undefined;
  return (
    <main>
      <section className="auth-shell">
        <div>
          <p className="eyebrow">Secure workspace access</p>
          <h1>Log in to Corven.</h1>
          <p>Access RFQ workspaces, quote comparisons, supplier memory, and purchase order draft workflows.</p>
          <p className="auth-switch">Need an account? <Link href="/signup">Create one</Link>.</p>
        </div>
        <div className="auth-panel">
          {notice && <p className="form-success" role="status">{notice}</p>}
          {error && <p className="form-error" role="alert">{error}</p>}
          <AuthForm mode="login" />
          <p className="auth-meta"><Link href="/forgot-password">Forgot your password?</Link></p>
          <OAuthButtons verb="Log in" />
        </div>
      </section>
    </main>
  );
}
