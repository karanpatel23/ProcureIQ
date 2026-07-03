import Link from 'next/link';
import { requirePageWorkspace } from '@/lib/server/auth';

const nav = [
<<<<<<< HEAD
  ['Dashboard', '/app/dashboard'], ['RFQs', '/app/rfqs'], ['Suppliers', '/app/suppliers'], ['Quotes', '/app/quotes'], ['Purchase Orders', '/app/purchase-orders'], ['Analytics', '/app/analytics'], ['Billing', '/app/settings/billing'], ['Settings', '/app/settings/company'],
=======
  ['Dashboard', '/app/dashboard'], ['RFQs', '/app/rfqs'], ['Suppliers', '/app/suppliers'], ['Quotes', '/app/quotes'], ['Purchase Orders', '/app/purchase-orders'], ['Analytics', '/app/analytics'], ['Settings', '/app/settings/company'],
>>>>>>> origin/main
] as const;

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, workspace } = await requirePageWorkspace();
  return <div className="product-frame"><aside className="product-sidebar"><Link className="brand" href="/app/dashboard">ProcureIQ</Link><nav>{nav.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}</nav></aside><div className="product-main"><header className="product-topbar"><div><span>Workspace</span><strong>{workspace.name}</strong></div><div><span>{user.email}</span><Link href="/app/settings/security">Security</Link></div></header>{children}</div></div>;
}
