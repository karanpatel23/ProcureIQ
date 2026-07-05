import { ApiError, handleApiError, jsonOk, parseJson } from '@/lib/server/api';
import { createSession, hashPassword, safeUser } from '@/lib/server/auth';
import { createId, mutateDb, now } from '@/lib/server/db';
import { signupSchema } from '@/lib/server/validation';

export async function POST(request: Request) {
  try {
    const input = await parseJson(request, signupSchema);
    const user = await mutateDb((db) => {
      if (db.users.some((item) => item.email.toLowerCase() === input.email.toLowerCase())) throw new ApiError(409, 'EMAIL_EXISTS', 'An account already exists for this email.');
      const timestamp = now();
      const user = { id: createId('usr'), email: input.email.toLowerCase(), name: input.name, passwordHash: hashPassword(input.password), createdAt: timestamp, updatedAt: timestamp };
      db.users.push(user);
      return user;
    });
    await createSession(user.id);
    return jsonOk({ user: safeUser(user), next: '/onboarding' }, { status: 201 });
  } catch (error) { return handleApiError(error); }
}
