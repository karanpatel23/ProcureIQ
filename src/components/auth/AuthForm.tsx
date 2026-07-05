'use client';

import { FormEvent, useState } from 'react';

type Mode = 'login' | 'signup';

export function AuthForm({ mode }: { mode: Mode }) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const payload = mode === 'signup'
      ? { name: String(form.get('name') ?? ''), email: String(form.get('email') ?? ''), password: String(form.get('password') ?? '') }
      : { email: String(form.get('email') ?? ''), password: String(form.get('password') ?? '') };
    try {
      const response = await fetch(`/api/auth/${mode}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (!result.ok) { setError(result.error?.message ?? 'Authentication failed.'); setLoading(false); return; }
      window.location.href = result.data.next;
    } catch {
      setError('Unable to reach the server. Please try again in a moment.');
      setLoading(false);
    }
  }

  return <form className="auth-form" onSubmit={onSubmit}>{mode === 'signup' && <label>Full name<input name="name" autoComplete="name" required minLength={2} /></label>}<label>Work email<input name="email" type="email" autoComplete="email" required /></label><label>Password<input name="password" type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} required minLength={mode === 'signup' ? 12 : 1} /></label>{mode === 'signup' && <p className="form-hint">Use at least 12 characters. OAuth-ready architecture is prepared for Google and Microsoft sign-in later.</p>}{error && <p className="form-error" role="alert">{error}</p>}<button className="button primary" disabled={loading}>{loading ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Log in'}</button></form>;
}
