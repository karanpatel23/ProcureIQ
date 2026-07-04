import { handleApiError, jsonOk } from '@/lib/server/api';
import { requireInternalAdmin } from '@/lib/server/auth';
import { readDb } from '@/lib/server/db';

export async function GET(request: Request) { try { await requireInternalAdmin(); const url = new URL(request.url); const limit = Math.min(Number(url.searchParams.get('limit') ?? 50), 100); const db = await readDb(); const workspaces = db.workspaces.slice(0, limit).map((workspace) => ({ ...workspace, members: db.workspaceMembers.filter((member) => member.workspaceId === workspace.id).length, rfqs: db.rfqs.filter((rfq) => rfq.workspaceId === workspace.id).length, quoteDocuments: db.quoteDocuments.filter((doc) => doc.workspaceId === workspace.id).length, aiExtractionRuns: db.aiExtractionRuns.filter((run) => run.workspaceId === workspace.id).length })); return jsonOk({ workspaces, limit }); } catch (error) { return handleApiError(error); } }
