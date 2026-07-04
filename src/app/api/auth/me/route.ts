import { getCurrentUser, getPrimaryWorkspace, safeUser } from '@/lib/server/auth';
import { jsonOk } from '@/lib/server/api';

export async function GET() {
  const current = await getCurrentUser();
  if (!current) return jsonOk({ user: null, workspace: null });
  const workspace = await getPrimaryWorkspace(current.user.id);
  return jsonOk({ user: safeUser(current.user), workspace });
}
