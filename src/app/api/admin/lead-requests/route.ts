import { handleApiError, jsonOk } from '@/lib/server/api';
import { requireInternalAdmin } from '@/lib/server/auth';
import { readDb } from '@/lib/server/db';

export async function GET() { try { await requireInternalAdmin(); const db = await readDb(); return jsonOk({ leads: db.leadRequests.sort((a, b) => b.createdAt.localeCompare(a.createdAt)) }); } catch (error) { return handleApiError(error); } }
