import { handleApiError, jsonOk } from '@/lib/server/api';
import { requireWorkspace } from '@/lib/server/auth';
import { getWorkspaceAnalytics } from '@/lib/server/analytics';
import { readDb } from '@/lib/server/db';
export async function GET() { try { const { workspace } = await requireWorkspace(); const db = await readDb(); return jsonOk(getWorkspaceAnalytics(db, workspace)); } catch (error) { return handleApiError(error); } }
