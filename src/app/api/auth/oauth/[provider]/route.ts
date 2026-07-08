import { randomBytes } from 'node:crypto';
import { NextResponse } from 'next/server';
import { buildAuthorizationUrl, callbackUrl, isOAuthProvider, isProviderConfigured } from '@/lib/server/oauth';

const STATE_COOKIE = 'procureiq_oauth_state';

// Kicks off the authorization-code flow: stores a CSRF state value in an
// httpOnly cookie and redirects to the provider's consent screen. If the
// provider has no credentials configured, returns to /login honestly.
export async function GET(request: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  const origin = new URL(request.url).origin;
  if (!isOAuthProvider(provider) || !isProviderConfigured(provider)) {
    return NextResponse.redirect(`${origin}/login?oauth=unavailable`);
  }

  const state = randomBytes(24).toString('hex');
  const redirectUri = callbackUrl(origin, provider);
  const response = NextResponse.redirect(buildAuthorizationUrl(provider, { state, redirectUri }));
  response.cookies.set(STATE_COOKIE, `${provider}:${state}`, {
    httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 600,
  });
  return response;
}
