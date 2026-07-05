'use client';
import Link from 'next/link';
import { useState } from 'react';

type NavItem = { readonly href: string; readonly label: string };

export function MobileNav({ items }: { items: readonly NavItem[] }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <div className="mobile-nav">
      <button
        type="button"
        className="mobile-nav-toggle"
        aria-expanded={open}
        aria-label={open ? 'Close menu' : 'Open menu'}
        onClick={() => setOpen((value) => !value)}
      >
        <i aria-hidden="true" data-open={open} />
      </button>
      {open && (
        <nav className="mobile-nav-panel" aria-label="Mobile navigation">
          {items.map((item) => (
            <Link key={item.href} href={item.href} onClick={close}>{item.label}</Link>
          ))}
          <div className="mobile-nav-actions">
            <Link href="/login" onClick={close}>Log in</Link>
            <Link href="/signup" onClick={close}>Sign up</Link>
            <Link className="button secondary" href="/demo-workflow" onClick={close} data-track="nav_live_demo">Live demo</Link>
            <Link className="button primary" href="/demo" onClick={close} data-track="nav_book_demo">Book a demo</Link>
          </div>
        </nav>
      )}
    </div>
  );
}
