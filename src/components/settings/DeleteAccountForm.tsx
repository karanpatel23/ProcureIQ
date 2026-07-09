'use client';

import { FormEvent, useState } from 'react';

export function DeleteAccountForm({ email, ownsSharedWorkspace }: { email: string; ownsSharedWorkspace: boolean }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(''); setBusy(true);
    try {
      const response = await fetch('/api/account', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ confirm: value }) });
      const result = await response.json();
      if (!result.ok) { setError(result.error?.message ?? 'Could not delete the account.'); setBusy(false); return; }
      window.location.href = '/?deleted=1';
    } catch {
      setError('Unable to reach the server. Please try again.');
      setBusy(false);
    }
  }

  return (
    <div className="danger-zone">
      <div className="danger-head">
        <div>
          <h2>Delete account</h2>
          <p className="form-hint">Permanently deletes your account and sign-in. This cannot be undone.</p>
        </div>
        {!open && <button type="button" className="button danger" onClick={() => setOpen(true)}>Delete account…</button>}
      </div>

      {open && (
        <form className="danger-confirm" onSubmit={onSubmit}>
          <ul className="danger-list">
            <li>Your login, profile, and team memberships are removed.</li>
            {ownsSharedWorkspace
              ? <li><b>You own a workspace with other members.</b> Transfer ownership or remove them first — this deletion will be blocked otherwise.</li>
              : <li>Any workspace you solely own is deleted along with its suppliers, RFQs, quotes, and purchase orders.</li>}
            <li>This action is immediate and permanent.</li>
          </ul>
          <label className="field">
            <span className="field-label">Type <b>{email}</b> to confirm</span>
            <input value={value} onChange={(e) => setValue(e.target.value)} placeholder={email} autoComplete="off" aria-label="Confirm account email" />
          </label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="form-actions">
            <button type="button" className="button secondary" onClick={() => { setOpen(false); setValue(''); setError(''); }} disabled={busy}>Cancel</button>
            <button type="submit" className="button danger" disabled={busy || value.trim().toLowerCase() !== email.toLowerCase()}>{busy ? 'Deleting…' : 'Permanently delete account'}</button>
          </div>
        </form>
      )}
    </div>
  );
}
