import { uploadPolicy } from '@/lib/server/env';
import { requirePageWorkspace } from '@/lib/server/auth';

export const metadata = { title: 'Security settings | ProcureIQ' };
export default async function SecuritySettingsPage() { await requirePageWorkspace(); return <main><section className="app-shell"><p className="eyebrow">Security settings</p><h1>Controls and audit readiness.</h1><div className="settings-card"><p>ProcureIQ keeps purchasing AI outputs in reviewable draft states and records workspace-scoped audit events for sensitive actions.</p><p>Upload policy foundation: {Math.round(uploadPolicy.maxBytes / 1_000_000)} MB maximum file size with approved quote document MIME types.</p></div></section></main>; }
