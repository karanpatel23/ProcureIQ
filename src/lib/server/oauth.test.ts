import { describe, expect, it } from 'vitest';
import { ALL_PROVIDERS, buildAuthorizationUrl, callbackUrl, isOAuthProvider, isProviderConfigured, providerLabel } from './oauth';

describe('oauth architecture', () => {
  it('exposes the two supported providers', () => {
    expect(ALL_PROVIDERS).toEqual(['google', 'microsoft']);
    expect(providerLabel('google')).toBe('Google');
    expect(providerLabel('microsoft')).toBe('Microsoft');
  });

  it('narrows unknown provider strings safely', () => {
    expect(isOAuthProvider('google')).toBe(true);
    expect(isOAuthProvider('microsoft')).toBe(true);
    expect(isOAuthProvider('facebook')).toBe(false);
    expect(isOAuthProvider('')).toBe(false);
  });

  it('reports providers as not configured until credentials are set (honest default)', () => {
    // No GOOGLE_/MICROSOFT_ credentials in the test env, so both are disabled.
    expect(isProviderConfigured('google')).toBe(false);
    expect(isProviderConfigured('microsoft')).toBe(false);
  });

  it('derives the callback URL from the request origin', () => {
    expect(callbackUrl('https://app.example.com', 'google')).toBe('https://app.example.com/api/auth/oauth/google/callback');
  });

  it('builds a spec-compliant authorization URL with state and redirect', () => {
    const url = new URL(buildAuthorizationUrl('google', { state: 'abc123', redirectUri: 'https://app.example.com/api/auth/oauth/google/callback' }));
    expect(url.origin + url.pathname).toBe('https://accounts.google.com/o/oauth2/v2/auth');
    expect(url.searchParams.get('response_type')).toBe('code');
    expect(url.searchParams.get('state')).toBe('abc123');
    expect(url.searchParams.get('redirect_uri')).toBe('https://app.example.com/api/auth/oauth/google/callback');
    expect(url.searchParams.get('scope')).toContain('email');
  });

  it('targets the configured Microsoft tenant in the authorize endpoint', () => {
    const url = new URL(buildAuthorizationUrl('microsoft', { state: 's', redirectUri: 'https://x/cb' }));
    expect(url.pathname).toContain('/common/oauth2/v2.0/authorize');
  });
});
