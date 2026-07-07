'use client';

import { FormEvent, useState } from 'react';

type Mode = 'login' | 'signup';

export function AuthForm({ mode }: { mode: Mode }) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [resendMsg, setResendMsg] = useState('');

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(''); setResendMsg('');
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') ?? '');
    const payload = mode === 'signup'
      ? { name: String(form.get('name') ?? ''), email, password: String(form.get('password') ?? '') }
      : { email, password: String(form.get('password') ?? '') };
    try {
      const response = await fetch(`/api/auth/${mode}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (!result.ok) {
        // Login blocked because the address is unverified — offer a resend.
        if (result.error?.code === 'EMAIL_NOT_VERIFIED') { setPendingEmail(email); setError(result.error.message); setLoading(false); return; }
        setError(result.error?.message ?? 'Authentication failed.'); setLoading(false); return;
      }
      // Signup that requires verification returns no session — show a check-your-email state.
      if (result.data?.requiresVerification) { setPendingEmail(email); setLoading(false); return; }
      window.location.href = result.data.next;
    } catch {
      setError('Unable to reach the server. Please try again in a moment.');
      setLoading(false);
    }
  }

  async function resend() {
    setResendMsg(''); setError('');
    try {
      const response = await fetch('/api/auth/resend-verification', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: pendingEmail }) });
      const result = await response.json();
      setResendMsg(result.data?.message ?? 'If that email needs verification, a new link is on its way.');
    } catch {
      setResendMsg('Unable to reach the server. Please try again.');
    }
  }

  if (pendingEmail && mode === 'signup') {
    return (
      <div className="auth-form" role="status">
        <h2>Check your email</h2>
        <p>We sent a verification link to <b>{pendingEmail}</b>. Click it to activate your account, then log in.</p>
        <p className="form-hint">Didn’t get it? Check spam, or request a new link.</p>
        {resendMsg && <p className="form-hint" role="status">{resendMsg}</p>}
        <div className="form-actions"><button className="button secondary" type="button" onClick={resend}>Resend verification email</button></div>
      </div>
    );
  }

  return (
    <form className="auth-form" onSubmit={onSubmit}>
      {mode === 'signup' && <label>Full name<input name="name" autoComplete="name" required minLength={2} /></label>}
      <label>Work email<input name="email" type="email" autoComplete="email" required /></label>
      <label>Password<input name="password" type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} required minLength={mode === 'signup' ? 12 : 1} /></label>
      {mode === 'signup' && <p className="form-hint">Use at least 12 characters. OAuth-ready architecture is prepared for Google and Microsoft sign-in later.</p>}
      {error && <p className="form-error" role="alert">{error}</p>}
      {pendingEmail && mode === 'login' && (
        <>
          {resendMsg && <p className="form-hint" role="status">{resendMsg}</p>}
          <button className="button secondary" type="button" onClick={resend}>Resend verification email</button>
        </>
      )}
      <button className="button primary" disabled={loading}>{loading ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Log in'}</button>
    </form>
  );
}
