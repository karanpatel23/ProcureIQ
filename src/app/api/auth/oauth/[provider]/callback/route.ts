import { NextResponse } from 'next/server';
import { createSession } from '@/lib/server/auth';
import { createId, mutateDb, now } from '@/lib/server/db';
import { callbackUrl, exchangeCodeForProfile, isOAuthProvider, isProviderConfigured } from '@/lib/server/oauth';
import { logServerError } from '@/lib/server/observability';
import type { OAuthProvider } from '@/lib/server/schema';

const STATE_COOKIE = 'procureiq_oauth_state';

// Provider redirects back here with a code. We verify the state cookie, exchange
// the code for a verified profile, find-or-create the user, link the external
// identity, sign them in, and route them to onboarding or the dashboard.
export async function GET(request: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  const url = new URL(request.url);
  const origin = url.origin;
  const fail = (reason: string) => NextResponse.redirect(`${origin}/login?oauth=${reason}`);

  if (!isOAuthProvider(provider) || !isProviderConfigured(provider)) return fail('unavailable');

  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const cookieState = request.headers.get('cookie')?.match(/procureiq_oauth_state=([^;]+)/)?.[1];
  if (url.searchParams.get('error') || !code || !state) return fail('denied');
  if (!cookieState || decodeURIComponent(cookieState) !== `${provider}:${state}`) return fail('state');

  let profile;
  try {
    profile = await exchangeCodeForProfile(provider as OAuthProvider, { code, redirectUri: callbackUrl(origin, provider as OAuthProvider) });
  } catch (error) {
    logServerError(error);
    return fail('exchange');
  }

  const { userId, hasWorkspace } = await mutateDb((db) => {
    // 1) Existing link → same account.
    const link = db.oauthAccounts.find((a) => a.provider === provider && a.providerAccountId === profile!.providerAccountId);
    let user = link ? db.users.find((u) => u.id === link.userId) : undefined;
    // 2) Existing account with the same verified email → link it.
    if (!user) user = db.users.find((u) => u.email.toLowerCase() === profile!.email);
    // 3) Brand-new user (no password — they sign in via the provider).
    if (!user) {
      const timestamp = now();
      user = { id: createId('usr'), email: profile!.email, name: profile!.name, passwordHash: '', emailVerified: true, createdAt: timestamp, updatedAt: timestamp };
      db.users.push(user);
      for (const member of db.workspaceMembers) {
        if (!member.userId && (member.invitedEmail ?? '').toLowerCase() === user.email) {
          member.userId = user.id; member.status = 'active'; member.invitedEmail = undefined; member.invitedName = undefined;
        }
      }
    } else {
      user.emailVerified = true;
      user.updatedAt = now();
    }
    if (!link) {
      db.oauthAccounts.push({ id: createId('oau'), userId: user.id, provider: provider as OAuthProvider, providerAccountId: profile!.providerAccountId, email: profile!.email, createdAt: now() });
    }
    const hasWorkspace = db.workspaceMembers.some((m) => m.userId === user!.id);
    return { userId: user.id, hasWorkspace };
  });

  await createSession(userId);
  const response = NextResponse.redirect(`${origin}${hasWorkspace ? '/app/dashboard' : '/onboarding'}`);
  response.cookies.delete(STATE_COOKIE);
  return response;
}
