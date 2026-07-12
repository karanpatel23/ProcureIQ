import { ApiError, handleApiError, jsonOk, parseJson } from '@/lib/server/api';
import { createSession, hashPassword, safeUser } from '@/lib/server/auth';
import { createId, findWorkspaceIdsByInvitedEmail, mutateDb, now } from '@/lib/server/db';
import { issueVerificationToken, sendVerificationEmail, verificationRequired } from '@/lib/server/email-verification';
import { sendWelcomeEmail } from '@/lib/server/welcome-email';
import { signupSchema } from '@/lib/server/validation';

export async function POST(request: Request) {
  try {
    const input = await parseJson(request, signupSchema);
    const requireVerify = verificationRequired();
    const { token, expiresAt } = issueVerificationToken();

    const user = await mutateDb((db) => {
      if (db.users.some((item) => item.email.toLowerCase() === input.email.toLowerCase())) throw new ApiError(409, 'EMAIL_EXISTS', 'An account already exists for this email.');
      const timestamp = now();
      const user = {
        id: createId('usr'),
        email: input.email.toLowerCase(),
        name: input.name,
        passwordHash: hashPassword(input.password),
        // Verified immediately when no provider is configured; otherwise pending.
        emailVerified: !requireVerify,
        verificationToken: requireVerify ? token : undefined,
        verificationTokenExpiresAt: requireVerify ? expiresAt : undefined,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      db.users.push(user);
      return user;
    });

    // Link any pending team invitations for this email so the person joins the
    // workspace they were invited to — scoped per-workspace mutations, found via
    // an indexed lookup instead of scanning every tenant.
    for (const workspaceId of await findWorkspaceIdsByInvitedEmail(user.email)) {
      await mutateDb((db) => {
        for (const member of db.workspaceMembers) {
          if (!member.userId && (member.invitedEmail ?? '').toLowerCase() === user.email) {
            member.userId = user.id; member.status = 'active'; member.invitedEmail = undefined; member.invitedName = undefined;
          }
        }
      }, { workspaceId });
    }

    if (requireVerify) {
      // Send the verification email; failure to send does not fail signup (the
      // user can request a resend). No session is created until verified.
      await sendVerificationEmail(request, user.email, token).catch(() => undefined);
      return jsonOk({ user: safeUser(user), requiresVerification: true, next: null, message: 'Account created. Check your email to verify your address before logging in.' }, { status: 201 });
    }

    // Auto-verified (no provider required verification): the account is active
    // now, so send the welcome email. When verification IS required, the welcome
    // is deferred until the address is confirmed (see the verify route).
    await sendWelcomeEmail(request, user.email, user.name).catch(() => undefined);
    await createSession(user.id);
    return jsonOk({ user: safeUser(user), requiresVerification: false, next: '/onboarding' }, { status: 201 });
  } catch (error) { return handleApiError(error); }
}
