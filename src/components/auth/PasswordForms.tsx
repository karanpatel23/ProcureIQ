'use client';

import { FormEvent, useState } from 'react';

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(''); setLoading(true);
    const email = String(new FormData(event.currentTarget).get('email') ?? '');
    try {
      const response = await fetch('/api/auth/forgot-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
      const result = await response.json();
      if (!result.ok) { setError(result.error?.message ?? 'Could not start the reset.'); setLoading(false); return; }
      setSent(true);
    } catch {
      setError('Unable to reach the server. Please try again in a moment.');
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="auth-form" role="status">
        <h2>Check your email</h2>
        <p>If an account exists for that email, a reset link is on its way. The link expires in one hour.</p>
        <p className="form-hint">Didn’t get it? Check spam, or try again in a few minutes.</p>
      </div>
    );
  }

  return (
    <form className="auth-form" onSubmit={onSubmit}>
      <label>Work email<input name="email" type="email" autoComplete="email" required /></label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="button primary" disabled={loading}>{loading ? 'Sending…' : 'Send reset link'}</button>
    </form>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(''); setLoading(true);
    const form = new FormData(event.currentTarget);
    const password = String(form.get('password') ?? '');
    const confirm = String(form.get('confirm') ?? '');
    if (password !== confirm) { setError('Passwords do not match.'); setLoading(false); return; }
    try {
      const response = await fetch('/api/auth/reset-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, password }) });
      const result = await response.json();
      if (!result.ok) { setError(result.error?.message ?? 'Could not reset your password.'); setLoading(false); return; }
      window.location.href = '/login?reset=success';
    } catch {
      setError('Unable to reach the server. Please try again in a moment.');
      setLoading(false);
    }
  }

  if (!token) {
    return <p className="form-error" role="alert">This reset link is missing its token. Request a new link from the <a href="/forgot-password">forgot password</a> page.</p>;
  }

  return (
    <form className="auth-form" onSubmit={onSubmit}>
      <label>New password<input name="password" type="password" autoComplete="new-password" required minLength={12} /></label>
      <label>Confirm new password<input name="confirm" type="password" autoComplete="new-password" required minLength={12} /></label>
      <p className="form-hint">Use at least 12 characters. Setting a new password signs out all existing sessions.</p>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="button primary" disabled={loading}>{loading ? 'Updating…' : 'Update password'}</button>
    </form>
  );
}
