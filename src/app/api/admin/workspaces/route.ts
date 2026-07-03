import { handleApiError, jsonOk } from '@/lib/server/api';
import { requireInternalAdmin } from '@/lib/server/auth';
import { readDb } from '@/lib/server/db';

export async function GET() { try { await requireInternalAdmin(); const db = await readDb(); return jsonOk({ workspaces: db.workspaces.map((workspace) => ({ ...workspace, members: db.workspaceMembers.filter((member) => member.workspaceId === workspace.id).length, rfqs: db.rfqs.filter((rfq) => rfq.workspaceId === workspace.id).length, quoteDocuments: db.quoteDocuments.filter((doc) => doc.workspaceId === workspace.id).length, aiExtractionRuns: db.aiExtractionRuns.filter((run) => run.workspaceId === workspace.id).length })) }); } catch (error) { return handleApiError(error); } }
