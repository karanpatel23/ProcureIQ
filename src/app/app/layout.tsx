import Link from 'next/link';
import { UserMenu } from '@/components/app/UserMenu';
import { requirePageWorkspace } from '@/lib/server/auth';

const nav = [
  ['Dashboard', '/app/dashboard'],
  ['RFQs', '/app/rfqs'],
  ['Suppliers', '/app/suppliers'],
  ['Quotes', '/app/quotes'],
  ['Purchase Orders', '/app/purchase-orders'],
  ['Analytics', '/app/analytics'],
] as const;

const settingsNav = [
  ['Team & roles', '/app/settings/team'],
  ['Company', '/app/settings/company'],
  ['Billing', '/app/settings/billing'],
] as const;

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, workspace, membership } = await requirePageWorkspace();
  return (
    <div className="product-frame">
      <aside className="product-sidebar">
        <Link className="brand" href="/app/dashboard">ProcureIQ</Link>
        <nav aria-label="Primary">
          {nav.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}
        </nav>
        <nav aria-label="Settings" className="product-sidebar-settings">
          <span className="sidebar-label">Settings</span>
          {settingsNav.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}
        </nav>
      </aside>
      <div className="product-main">
        <header className="product-topbar">
          <div className="topbar-workspace"><span>Workspace</span><strong>{workspace.name}</strong></div>
          <UserMenu email={user.email} role={membership.role} persona={membership.title ?? null} />
        </header>
        {children}
      </div>
    </div>
  );
}
