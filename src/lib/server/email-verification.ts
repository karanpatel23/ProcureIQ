import { randomBytes } from 'node:crypto';
import { env } from './env';
import { emailProviderConfigured, sendEmail } from './email';

/*
 * Email verification, provider-gated by design.
 *
 * When an email provider (RESEND_API_KEY + EMAIL_FROM) is configured, new
 * accounts must verify their address before they can log in. When it is NOT
 * configured — e.g. a demo deployment — accounts are auto-verified so the
 * product stays fully usable and no one is ever locked out. The mechanism is
 * real and flips on the moment a provider is set; it is never faked.
 */
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

/** True when the deployment should require verification before login. */
export function verificationRequired(): boolean {
  return emailProviderConfigured();
}

export function issueVerificationToken(): { token: string; expiresAt: string } {
  return { token: randomBytes(32).toString('hex'), expiresAt: new Date(Date.now() + TOKEN_TTL_MS).toISOString() };
}

/** A user is treated as verified unless explicitly marked false — grandfathers pre-existing accounts. */
export function isVerified(user: { emailVerified?: boolean }): boolean {
  return user.emailVerified !== false;
}

export function tokenExpired(expiresAt?: string): boolean {
  return !expiresAt || Number.isNaN(Date.parse(expiresAt)) || new Date(expiresAt) < new Date();
}

function baseUrl(request: Request): string {
  if (env.APP_URL) return env.APP_URL.replace(/\/$/, '');
  try { return new URL(request.url).origin; } catch { return ''; }
}

export async function sendVerificationEmail(request: Request, to: string, token: string) {
  const url = `${baseUrl(request)}/api/auth/verify?token=${token}`;
  return sendEmail({
    to,
    subject: 'Verify your Corven email',
    text: `Welcome to Corven.\n\nConfirm this email address to activate your account:\n${url}\n\nThis link expires in 24 hours. If you did not create a Corven account, you can ignore this message.`,
  });
}
