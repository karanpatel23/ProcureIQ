'use client';
import { FormEvent, useState } from 'react';

/** Bulk supplier import from a CSV / QuickBooks vendor export. */
export function ImportSuppliers() {
  const [msg, setMsg] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMsg(''); setError(''); setBusy(true);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch('/api/suppliers/import', { method: 'POST', body: form });
      const result = await response.json();
      if (!result.ok) { setError(result.error?.message ?? 'Import failed.'); setBusy(false); return; }
      setMsg(result.data.message + (result.data.skipped.length ? ` First skip: ${result.data.skipped[0].reason}` : ''));
      setTimeout(() => window.location.reload(), 1400);
    } catch { setError('Unable to reach the server.'); setBusy(false); }
  }
  return (
    <details className="add-supplier">
      <summary>Import from CSV / QuickBooks</summary>
      <form className="auth-form" onSubmit={onSubmit} style={{ paddingBottom: 22 }}>
        <label>Vendor CSV file<input name="file" type="file" accept=".csv,text/csv" required /><span>Works with QuickBooks vendor exports — needs a Vendor/Name/Company column; email, phone, terms, and category map automatically. Existing suppliers are never overwritten.</span></label>
        {error && <p className="form-error" role="alert">{error}</p>}
        {msg && <p className="form-success" role="status">{msg}</p>}
        <div className="form-actions"><button className="button primary" disabled={busy}>{busy ? 'Importing…' : 'Import suppliers'}</button></div>
      </form>
    </details>
  );
}
