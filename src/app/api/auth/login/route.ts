import { ApiError, handleApiError, jsonOk, parseJson } from '@/lib/server/api';
import { createSession, getPrimaryWorkspace, safeUser, verifyPassword } from '@/lib/server/auth';
import { mutateDb, now, readDb } from '@/lib/server/db';
import { isVerified, verificationRequired } from '@/lib/server/email-verification';
import { loginSchema } from '@/lib/server/validation';

// Brute-force lockout: 8 straight failures locks password login for 15 minutes.
// Counted on the user record in the database, so it holds across serverless
// instances — an in-memory limiter would reset on every cold start.
const MAX_FAILED_ATTEMPTS = 8;
const LOCKOUT_MINUTES = 15;

export async function POST(request: Request) {
  try {
    const input = await parseJson(request, loginSchema);
    const db = await readDb();
    const user = db.users.find((item) => item.email.toLowerCase() === input.email.toLowerCase());
    // Accounts created through Google/Microsoft sign-in have no password, so a
    // password attempt can never succeed. Saying "invalid credentials" there is
    // misleading and locks people out of their own accounts — tell them how this
    // account actually signs in. (Deliberate tradeoff: this reveals the sign-in
    // method for a known email, in exchange for not stranding real users.)
    if (user && !user.passwordHash) {
      const providers = [...new Set(db.oauthAccounts.filter((a) => a.userId === user.id).map((a) => a.provider === 'google' ? 'Google' : 'Microsoft'))];
      const label = providers.length ? providers.join(' or ') : 'a sign-in provider';
      throw new ApiError(403, 'EMAIL_USES_OAUTH', `This account signs in with ${label}. Use the ${label} button below — or set a password first via “Forgot your password?”.`);
    }

    if (user?.lockedUntil && new Date(user.lockedUntil) > new Date()) {
      const minutes = Math.max(1, Math.ceil((new Date(user.lockedUntil).getTime() - Date.now()) / 60_000));
      throw new ApiError(429, 'ACCOUNT_LOCKED', `Too many failed attempts. Try again in ${minutes} minute(s), or reset your password.`);
    }

    if (!user || !verifyPassword(input.password, user.passwordHash)) {
      if (user) {
        await mutateDb((draft) => {
          const target = draft.users.find((item) => item.id === user.id);
          if (!target) return;
          target.failedLoginAttempts = (target.failedLoginAttempts ?? 0) + 1;
          if (target.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
            target.lockedUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60_000).toISOString();
            target.failedLoginAttempts = 0;
          }
          target.updatedAt = now();
        });
      }
      throw new ApiError(401, 'INVALID_CREDENTIALS', 'Invalid email or password.');
    }

    // Enforce verification only when a provider is configured (so demos are never locked out).
    if (verificationRequired() && !isVerified(user)) {
      throw new ApiError(403, 'EMAIL_NOT_VERIFIED', 'Verify your email address before logging in. Check your inbox or request a new verification link.');
    }

    if (user.failedLoginAttempts || user.lockedUntil) {
      await mutateDb((draft) => {
        const target = draft.users.find((item) => item.id === user.id);
        if (target) { target.failedLoginAttempts = 0; target.lockedUntil = undefined; target.updatedAt = now(); }
      });
    }

    await createSession(user.id);
    const workspace = await getPrimaryWorkspace(user.id);
    return jsonOk({ user: safeUser(user), next: workspace ? '/app/dashboard' : '/onboarding' });
  } catch (error) { return handleApiError(error); }
}
