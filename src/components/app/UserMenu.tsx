'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

export function UserMenu({ email, role, persona }: { email: string; role: string; persona?: string | null }) {
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  async function signOut() {
    setSigningOut(true);
    try { await fetch('/api/auth/logout', { method: 'POST' }); } catch { /* proceed to login regardless */ }
    window.location.href = '/login';
  }

  return (
    <div className="user-menu" ref={ref}>
      <button type="button" className="user-menu-trigger" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <span className="user-avatar" aria-hidden="true">{(email[0] ?? 'U').toUpperCase()}</span>
        <span className="user-menu-id"><b>{email}</b>{persona && <em>{persona}</em>}</span>
        <span className="user-menu-caret" aria-hidden="true" />
      </button>
      {open && (
        <div className="user-menu-panel" role="menu">
          <div className="user-menu-head"><b>{email}</b><span>{persona ? `${persona} · ${role}` : role}</span></div>
          <Link role="menuitem" href="/app/settings/company" onClick={() => setOpen(false)}>Company settings</Link>
          <Link role="menuitem" href="/app/settings/team" onClick={() => setOpen(false)}>Team &amp; roles</Link>
          <Link role="menuitem" href="/app/settings/security" onClick={() => setOpen(false)}>Security</Link>
          <Link role="menuitem" href="/app/settings/account" onClick={() => setOpen(false)}>Account</Link>
          <button type="button" role="menuitem" className="user-menu-signout" onClick={signOut} disabled={signingOut}>{signingOut ? 'Signing out…' : 'Sign out'}</button>
        </div>
      )}
    </div>
  );
}
