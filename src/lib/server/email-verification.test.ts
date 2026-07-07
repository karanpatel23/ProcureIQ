import { describe, expect, it } from 'vitest';
import { isVerified, issueVerificationToken, tokenExpired } from './email-verification';

describe('email verification helpers', () => {
  it('treats a user as verified unless explicitly marked false (grandfathers old accounts)', () => {
    expect(isVerified({})).toBe(true); // no field → verified
    expect(isVerified({ emailVerified: true })).toBe(true);
    expect(isVerified({ emailVerified: false })).toBe(false);
  });

  it('issues a random token with a future expiry', () => {
    const a = issueVerificationToken();
    const b = issueVerificationToken();
    expect(a.token).toHaveLength(64);
    expect(a.token).not.toBe(b.token);
    expect(new Date(a.expiresAt).getTime()).toBeGreaterThan(Date.now());
  });

  it('detects expired / malformed token expiries', () => {
    expect(tokenExpired(undefined)).toBe(true);
    expect(tokenExpired('not-a-date')).toBe(true);
    expect(tokenExpired('2000-01-01T00:00:00.000Z')).toBe(true);
    expect(tokenExpired(new Date(Date.now() + 60_000).toISOString())).toBe(false);
  });
});
