import { RfqForm } from '@/components/auth/RfqForm';
import { requirePageWorkspace } from '@/lib/server/auth';
import { readDb } from '@/lib/server/db';

export const metadata = { title: 'Create RFQ | Corven' };
export default async function NewRfqPage() { const { workspace } = await requirePageWorkspace(); const db = await readDb(); const suppliers = db.suppliers.filter((item) => item.workspaceId === workspace.id && item.status === 'active' && !item.archivedAt); return <main><section className="app-shell"><p className="eyebrow">RFQ builder</p><h1>Create a supplier request.</h1><RfqForm suppliers={suppliers} /></section></main>; }
