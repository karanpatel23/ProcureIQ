import { clearSession } from '@/lib/server/auth';
import { jsonOk } from '@/lib/server/api';

export async function POST() { await clearSession(); return jsonOk({ next: '/login' }); }
