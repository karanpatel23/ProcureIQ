import { ApiError, handleApiError, jsonOk, parseJson } from '@/lib/server/api';
import { createSession, getPrimaryWorkspace, safeUser, verifyPassword } from '@/lib/server/auth';
import { readDb } from '@/lib/server/db';
import { loginSchema } from '@/lib/server/validation';

export async function POST(request: Request) {
  try {
    const input = await parseJson(request, loginSchema);
    const db = await readDb();
    const user = db.users.find((item) => item.email.toLowerCase() === input.email.toLowerCase());
    if (!user || !verifyPassword(input.password, user.passwordHash)) throw new ApiError(401, 'INVALID_CREDENTIALS', 'Invalid email or password.');
    await createSession(user.id);
    const workspace = await getPrimaryWorkspace(user.id);
    return jsonOk({ user: safeUser(user), next: workspace ? '/app/dashboard' : '/onboarding' });
  } catch (error) { return handleApiError(error); }
}
