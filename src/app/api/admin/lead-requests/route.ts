import { handleApiError, jsonOk } from '@/lib/server/api';
import { requireInternalAdmin } from '@/lib/server/auth';
import { readDb } from '@/lib/server/db';

export async function GET(request: Request) { try { await requireInternalAdmin(); const url = new URL(request.url); const limit = Math.min(Number(url.searchParams.get('limit') ?? 50), 100); const db = await readDb(); const leads = db.leadRequests.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit); return jsonOk({ leads, limit }); } catch (error) { return handleApiError(error); } }
