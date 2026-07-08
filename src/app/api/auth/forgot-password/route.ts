import { handleApiError, jsonOk, parseJson } from '@/lib/server/api';
import { mutateDb, now } from '@/lib/server/db';
import { issueResetToken, sendPasswordResetEmail } from '@/lib/server/password-reset';
import { forgotPasswordSchema } from '@/lib/server/validation';

// Starts the reset flow. Always returns the same generic response whether or not
// the email has an account, so it cannot be used to enumerate users.
export async function POST(request: Request) {
  try {
    const input = await parseJson(request, forgotPasswordSchema);
    const generic = { message: 'If an account exists for that email, a reset link is on its way.' };

    const result = await mutateDb((db) => {
      const user = db.users.find((item) => item.email.toLowerCase() === input.email.toLowerCase());
      // Skip password-less (OAuth-only) accounts — they have nothing to reset.
      if (!user || !user.passwordHash) return null;
      const { token, expiresAt } = issueResetToken();
      user.resetToken = token;
      user.resetTokenExpiresAt = expiresAt;
      user.updatedAt = now();
      return { email: user.email, token };
    });

    if (result) await sendPasswordResetEmail(request, result.email, result.token).catch(() => undefined);
    return jsonOk(generic);
  } catch (error) { return handleApiError(error); }
}
