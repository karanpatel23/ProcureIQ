import { ApiError, handleApiError, jsonOk, parseJson } from '@/lib/server/api';
import { hashPassword } from '@/lib/server/auth';
import { mutateDb, now } from '@/lib/server/db';
import { resetTokenExpired } from '@/lib/server/password-reset';
import { resetPasswordSchema } from '@/lib/server/validation';

// Completes the reset: validates the single-use token, sets the new password,
// and revokes every existing session for that user so a leaked session can't
// outlive the reset. The user then logs in fresh with the new password.
export async function POST(request: Request) {
  try {
    const input = await parseJson(request, resetPasswordSchema);

    const outcome = await mutateDb((db) => {
      const user = db.users.find((item) => item.resetToken === input.token);
      if (!user) return { error: 'invalid' as const };
      if (resetTokenExpired(user.resetTokenExpiresAt)) return { error: 'expired' as const };
      user.passwordHash = hashPassword(input.password);
      user.resetToken = undefined;
      user.resetTokenExpiresAt = undefined;
      user.emailVerified = true; // proving control of the inbox verifies the address
      user.updatedAt = now();
      db.sessions = db.sessions.filter((session) => session.userId !== user.id);
      return { ok: true as const };
    });

    if ('error' in outcome) {
      throw new ApiError(400, outcome.error === 'expired' ? 'RESET_EXPIRED' : 'RESET_INVALID',
        outcome.error === 'expired' ? 'This reset link has expired. Request a new one.' : 'This reset link is invalid or has already been used.');
    }
    return jsonOk({ message: 'Your password has been updated. Log in with your new password.' });
  } catch (error) { return handleApiError(error); }
}
