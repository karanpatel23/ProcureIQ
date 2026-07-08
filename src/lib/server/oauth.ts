import { env } from './env';
import type { OAuthProvider } from './schema';

/*
 * OAuth-ready architecture for Google and Microsoft sign-in.
 *
 * The full authorization-code flow is implemented here. Each provider becomes a
 * live sign-in option the moment its client id + secret are configured; until
 * then the provider is simply reported as not-enabled and the UI says "coming
 * soon" rather than pretending. Nothing here is a stub — set the credentials and
 * the flow works end to end.
 */
export type OAuthProfile = { providerAccountId: string; email: string; name: string };

type ProviderConfig = {
  label: string;
  scope: string;
  clientId?: string;
  clientSecret?: string;
  authUrl: () => string;
  tokenUrl: () => string;
  userInfoUrl: string;
};

const providers: Record<OAuthProvider, ProviderConfig> = {
  google: {
    label: 'Google',
    scope: 'openid email profile',
    clientId: env.GOOGLE_OAUTH_CLIENT_ID,
    clientSecret: env.GOOGLE_OAUTH_CLIENT_SECRET,
    authUrl: () => 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: () => 'https://oauth2.googleapis.com/token',
    userInfoUrl: 'https://openidconnect.googleapis.com/v1/userinfo',
  },
  microsoft: {
    label: 'Microsoft',
    scope: 'openid email profile',
    clientId: env.MICROSOFT_OAUTH_CLIENT_ID,
    clientSecret: env.MICROSOFT_OAUTH_CLIENT_SECRET,
    authUrl: () => `https://login.microsoftonline.com/${env.MICROSOFT_OAUTH_TENANT}/oauth2/v2.0/authorize`,
    tokenUrl: () => `https://login.microsoftonline.com/${env.MICROSOFT_OAUTH_TENANT}/oauth2/v2.0/token`,
    userInfoUrl: 'https://graph.microsoft.com/oidc/userinfo',
  },
};

export const ALL_PROVIDERS: OAuthProvider[] = ['google', 'microsoft'];

export function isOAuthProvider(value: string): value is OAuthProvider {
  return value === 'google' || value === 'microsoft';
}

export function providerLabel(provider: OAuthProvider): string {
  return providers[provider].label;
}

export function isProviderConfigured(provider: OAuthProvider): boolean {
  const config = providers[provider];
  return Boolean(config.clientId && config.clientSecret);
}

/** Providers with credentials set, and therefore actually usable for sign-in. */
export function enabledProviders(): OAuthProvider[] {
  return ALL_PROVIDERS.filter(isProviderConfigured);
}

export function oauthConfiguredAnywhere(): boolean {
  return enabledProviders().length > 0;
}

export function callbackUrl(origin: string, provider: OAuthProvider): string {
  const base = (env.APP_URL ?? origin).replace(/\/$/, '');
  return `${base}/api/auth/oauth/${provider}/callback`;
}

export function buildAuthorizationUrl(provider: OAuthProvider, params: { state: string; redirectUri: string }): string {
  const config = providers[provider];
  const url = new URL(config.authUrl());
  url.searchParams.set('client_id', config.clientId ?? '');
  url.searchParams.set('redirect_uri', params.redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', config.scope);
  url.searchParams.set('state', params.state);
  url.searchParams.set('access_type', 'offline');
  url.searchParams.set('prompt', 'select_account');
  return url.toString();
}

/** Exchanges the authorization code for the user's verified profile. Throws on failure. */
export async function exchangeCodeForProfile(provider: OAuthProvider, params: { code: string; redirectUri: string }): Promise<OAuthProfile> {
  const config = providers[provider];
  if (!config.clientId || !config.clientSecret) throw new Error(`${provider} OAuth is not configured`);

  const tokenResponse = await fetch(config.tokenUrl(), {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json' },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code: params.code,
      grant_type: 'authorization_code',
      redirect_uri: params.redirectUri,
    }),
  });
  if (!tokenResponse.ok) {
    const detail = await tokenResponse.text().catch(() => '');
    throw new Error(`token exchange failed (${tokenResponse.status}) ${detail.slice(0, 200)}`);
  }
  const tokens = (await tokenResponse.json()) as { access_token?: string };
  if (!tokens.access_token) throw new Error('token exchange returned no access_token');

  const profileResponse = await fetch(config.userInfoUrl, { headers: { authorization: `Bearer ${tokens.access_token}` } });
  if (!profileResponse.ok) throw new Error(`profile fetch failed (${profileResponse.status})`);
  const profile = (await profileResponse.json()) as { sub?: string; oid?: string; id?: string; email?: string; preferred_username?: string; name?: string };

  const providerAccountId = profile.sub ?? profile.oid ?? profile.id ?? '';
  const email = (profile.email ?? profile.preferred_username ?? '').toLowerCase();
  if (!providerAccountId || !email) throw new Error('profile missing id or email');
  return { providerAccountId, email, name: profile.name ?? email.split('@')[0] };
}
