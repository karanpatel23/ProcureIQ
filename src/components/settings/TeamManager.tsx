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
      <div className="settings-card">
        <h2>People &amp; roles</h2>
        <p className="form-hint">Each person has a permission role (what they can do) and a persona (their job function). {members.length} profile{members.length === 1 ? '' : 's'} in this workspace.</p>
        <ul className="member-list">
          {members.map((m) => (
            <li key={m.id} className="member-row">
              <span className="member-avatar" aria-hidden="true">{(m.name[0] ?? '?').toUpperCase()}</span>
              <div className="member-id"><b>{m.name}</b><em>{m.email}</em></div>
              <span className="member-persona">{m.title ?? '—'}</span>
              {canManage && m.role !== 'owner' ? (
                <select className="member-role-select" value={m.role} onChange={(e) => updateRole(m.id, e.target.value)} aria-label={`Role for ${m.name}`}>
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              ) : (
                <span className={`member-role ${m.role}`}>{m.role}</span>
              )}
              <span className={`member-status ${m.status}`}>{m.status}</span>
              {canManage && m.role !== 'owner' ? <button type="button" className="member-remove" onClick={() => remove(m.id)} aria-label={`Remove ${m.name}`}>Remove</button> : <span />}
            </li>
          ))}
        </ul>
      </div>

      {canManage && (
        <div className="settings-card">
          <h2>Add a teammate</h2>
          <p className="form-hint">Give a colleague their own role profile. If they don’t have an account yet, they’ll join this workspace automatically when they sign up with this email.</p>
          <form className="member-form" onSubmit={addMember}>
            <div className="form-grid">
              <label>Full name<input name="name" required minLength={2} /></label>
              <label>Work email<input name="email" type="email" required /></label>
            </div>
            <div className="form-grid">
              <label>Persona<select name="title" defaultValue="Procurement manager">{PERSONAS.map((p) => <option key={p} value={p}>{p}</option>)}</select></label>
              <label>Permission role<select name="role" defaultValue="member">{ROLES.map((r) => <option key={r} value={r}>{r}</option>)}</select></label>
            </div>
            {error && <p className="form-error" role="alert">{error}</p>}
            {notice && <p className="form-hint" role="status">{notice}</p>}
            <div className="form-actions"><button className="button primary" disabled={adding}>{adding ? 'Adding…' : 'Add teammate'}</button></div>
          </form>
        </div>
      )}
      {!canManage && error && <p className="form-error" role="alert">{error}</p>}
    </div>
  );
}
