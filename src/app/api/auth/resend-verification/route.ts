import { z } from 'zod';
import { handleApiError, jsonOk, parseJson } from '@/lib/server/api';
import { mutateDb, now } from '@/lib/server/db';
import { issueVerificationToken, sendVerificationEmail, verificationRequired } from '@/lib/server/email-verification';

const schema = z.object({ email: z.string().email() });

// Re-issues a verification link. Always returns the same generic response so it
// cannot be used to probe which emails have accounts.
export async function POST(request: Request) {
  try {
    const input = await parseJson(request, schema);
    const generic = { message: 'If that email needs verification, a new link is on its way.' };
    if (!verificationRequired()) return jsonOk(generic);

    const result = await mutateDb((db) => {
      const user = db.users.find((item) => item.email.toLowerCase() === input.email.toLowerCase());
      if (!user || user.emailVerified) return null;
      const { token, expiresAt } = issueVerificationToken();
      user.verificationToken = token;
      user.verificationTokenExpiresAt = expiresAt;
      user.updatedAt = now();
      return { email: user.email, token };
    });

    if (result) await sendVerificationEmail(request, result.email, result.token).catch(() => undefined);
    return jsonOk(generic);
  } catch (error) { return handleApiError(error); }
}
