import { NextResponse } from 'next/server';
import { createSession } from '@/lib/server/auth';
import { mutateDb, now } from '@/lib/server/db';
import { tokenExpired } from '@/lib/server/email-verification';

// Clicked from the verification email. Marks the address verified, signs the
// user in, and sends them into onboarding. Failures redirect to /login.
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get('token') ?? '';
  const origin = new URL(request.url).origin;
  if (!token) return NextResponse.redirect(`${origin}/login?verify=invalid`);

  const user = await mutateDb((db) => {
    const target = db.users.find((item) => item.verificationToken === token);
    if (!target) return null;
    if (tokenExpired(target.verificationTokenExpiresAt)) return { expired: true } as const;
    target.emailVerified = true;
    target.verificationToken = undefined;
    target.verificationTokenExpiresAt = undefined;
    target.updatedAt = now();
    return target;
  });

  if (!user) return NextResponse.redirect(`${origin}/login?verify=invalid`);
  if ('expired' in user) return NextResponse.redirect(`${origin}/login?verify=expired`);

  await createSession(user.id);
  return NextResponse.redirect(`${origin}/onboarding`);
}
