'use client';

import { FormEvent, useState } from 'react';

type Member = { id: string; role: string; title: string | null; status: string; name: string; email: string };
const ROLES = ['admin', 'member', 'viewer'] as const;
const PERSONAS = ['Procurement manager', 'Finance approver', 'Operations', 'Admin', 'Supplier manager', 'Approver', 'Viewer', 'Other'] as const;

export function TeamManager({ initialMembers, canManage }: { initialMembers: Member[]; canManage: boolean }) {
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function addMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setNotice(''); setAdding(true);
    const formEl = event.currentTarget;
    const form = new FormData(formEl);
    try {
      const response = await fetch('/api/workspaces/members', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: form.get('name'), email: form.get('email'), role: form.get('role'), title: form.get('title') }) });
      const result = await response.json();
      if (!result.ok) { setError(result.error?.message ?? 'Could not add the teammate.'); return; }
      const m = result.data.member;
      setMembers((prev) => [...prev, { id: m.id, role: m.role, title: m.title, status: m.status, name: m.invitedName ?? form.get('name') as string, email: m.invitedEmail ?? form.get('email') as string }]);
      setNotice(m.status === 'invited' ? `Invited ${form.get('email')} — they’ll join automatically when they sign up.` : `${form.get('name')} added to the team.`);
      formEl.reset();
    } catch {
      setError('Unable to reach the server. Please try again.');
    } finally {
      setAdding(false);
    }
  }

  async function updateRole(id: string, role: string) {
    setError('');
    const response = await fetch(`/api/workspaces/members/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role }) });
    const result = await response.json();
    if (!result.ok) { setError(result.error?.message ?? 'Could not update the role.'); return; }
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, role } : m)));
  }

  async function remove(id: string) {
    setError('');
    const response = await fetch(`/api/workspaces/members/${id}`, { method: 'DELETE' });
    const result = await response.json();
    if (!result.ok) { setError(result.error?.message ?? 'Could not remove the teammate.'); return; }
    setMembers((prev) => prev.filter((m) => m.id !== id));
  }

  return (
    <div className="team-manager">
      <section className="settings-card">
        <header className="settings-card-head">
          <div>
            <h2>People &amp; roles</h2>
            <p className="form-hint">A <b>permission role</b> controls what a person can do; a <b>persona</b> describes their job function.</p>
          </div>
          <span className="count-pill">{members.length} {members.length === 1 ? 'profile' : 'profiles'}</span>
        </header>

        <ul className="member-list">
          {members.map((m) => (
            <li key={m.id} className="member-row">
              <span className="member-avatar" aria-hidden="true">{(m.name[0] ?? '?').toUpperCase()}</span>
              <div className="member-id">
                <b>{m.name}</b>
                <em>{m.email}</em>
              </div>
              <span className={`member-persona ${m.title ? '' : 'is-empty'}`}>{m.title ?? 'No persona set'}</span>
              <div className="member-controls">
                {canManage && m.role !== 'owner' ? (
                  <select className="member-role-select" value={m.role} onChange={(e) => updateRole(m.id, e.target.value)} aria-label={`Permission role for ${m.name}`}>
                    {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                ) : (
                  <span className={`role-tag ${m.role}`}>{m.role}</span>
                )}
                <span className={`status-tag ${m.status}`}>{m.status}</span>
                {canManage && m.role !== 'owner' && (
                  <button type="button" className="member-remove" onClick={() => remove(m.id)} aria-label={`Remove ${m.name}`}>Remove</button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {canManage && (
        <section className="settings-card">
          <header className="settings-card-head">
            <div>
              <h2>Add a teammate</h2>
              <p className="form-hint">Give a colleague their own role profile. If they don’t have an account yet, they’ll join this workspace automatically when they sign up with this email.</p>
            </div>
          </header>

          <form className="member-form" onSubmit={addMember}>
            <div className="field-grid">
              <label className="field">
                <span className="field-label">Full name</span>
                <input name="name" required minLength={2} placeholder="Alex Rivera" autoComplete="off" />
              </label>
              <label className="field">
                <span className="field-label">Work email</span>
                <input name="email" type="email" required placeholder="alex@company.com" autoComplete="off" />
              </label>
              <label className="field">
                <span className="field-label">Persona <span className="field-sub">job function</span></span>
                <select name="title" defaultValue="Procurement manager">{PERSONAS.map((p) => <option key={p} value={p}>{p}</option>)}</select>
              </label>
              <label className="field">
                <span className="field-label">Permission role <span className="field-sub">what they can do</span></span>
                <select name="role" defaultValue="member">{ROLES.map((r) => <option key={r} value={r}>{r}</option>)}</select>
              </label>
            </div>

            {error && <p className="form-error" role="alert">{error}</p>}
            {notice && <p className="form-success" role="status">{notice}</p>}

            <div className="form-actions">
              <button className="button primary" disabled={adding}>{adding ? 'Adding…' : 'Add teammate'}</button>
            </div>
          </form>
        </section>
      )}

      {!canManage && error && <p className="form-error" role="alert">{error}</p>}
    </div>
  );
}
