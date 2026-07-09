import { handleApiError, jsonOk, parseJson } from '@/lib/server/api';
import { mutateDb, now } from '@/lib/server/db';
import { emailProviderConfigured } from '@/lib/server/email';
import { issueResetToken, sendPasswordResetEmail } from '@/lib/server/password-reset';
import { forgotPasswordSchema } from '@/lib/server/validation';

// Starts the reset flow. Always returns the same generic response whether or not
// the email has an account, so it cannot be used to enumerate users.
export async function POST(request: Request) {
  try {
    const input = await parseJson(request, forgotPasswordSchema);
    // emailConfigured reflects deployment configuration only (not whether the
    // account exists), so returning it cannot be used to enumerate users.
    const emailConfigured = emailProviderConfigured();
    const generic = { emailConfigured, message: 'If an account exists for that email, a reset link is on its way.' };

    const result = await mutateDb((db) => {
      const user = db.users.find((item) => item.email.toLowerCase() === input.email.toLowerCase());
      // OAuth-only accounts are included on purpose: for them this flow SETS a
      // first password (proving inbox control), so email+password login starts
      // working alongside the provider button instead of being impossible.
      if (!user) return null;
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
