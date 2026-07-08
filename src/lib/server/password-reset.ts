import { randomBytes } from 'node:crypto';
import { env } from './env';
import { sendEmail } from './email';

/*
 * Password reset, real and provider-aware.
 *
 * A reset token is a single-use, time-limited secret stored on the user record
 * (mirrors the verification-token mechanism). The request endpoint always
 * responds the same way whether or not the email exists, so it cannot be used
 * to enumerate accounts. When an email provider is configured the link is
 * delivered; otherwise sendEmail records it to the server log (delivery:
 * 'logged') so the flow still completes and nothing is silently faked.
 */
const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour — resets are short-lived by design.

export function issueResetToken(): { token: string; expiresAt: string } {
  return { token: randomBytes(32).toString('hex'), expiresAt: new Date(Date.now() + TOKEN_TTL_MS).toISOString() };
}

export function resetTokenExpired(expiresAt?: string): boolean {
  return !expiresAt || Number.isNaN(Date.parse(expiresAt)) || new Date(expiresAt) < new Date();
}

function baseUrl(request: Request): string {
  if (env.APP_URL) return env.APP_URL.replace(/\/$/, '');
  try { return new URL(request.url).origin; } catch { return ''; }
}

export async function sendPasswordResetEmail(request: Request, to: string, token: string) {
  const url = `${baseUrl(request)}/reset-password?token=${token}`;
  return sendEmail({
    to,
    subject: 'Reset your ProcureIQ password',
    text: `We received a request to reset the password for your ProcureIQ account.\n\nChoose a new password using this link:\n${url}\n\nThis link expires in 1 hour and can be used once. If you did not request a reset, you can safely ignore this email — your password will not change.`,
  });
}
