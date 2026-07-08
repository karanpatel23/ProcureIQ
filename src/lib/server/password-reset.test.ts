import { describe, expect, it } from 'vitest';
import { issueResetToken, resetTokenExpired } from './password-reset';

describe('password reset helpers', () => {
  it('issues a unique random token with a future expiry', () => {
    const a = issueResetToken();
    const b = issueResetToken();
    expect(a.token).toHaveLength(64);
    expect(a.token).not.toBe(b.token);
    expect(new Date(a.expiresAt).getTime()).toBeGreaterThan(Date.now());
  });

  it('gives reset tokens a short (<= 1h) lifetime', () => {
    const { expiresAt } = issueResetToken();
    const ttlMs = new Date(expiresAt).getTime() - Date.now();
    expect(ttlMs).toBeGreaterThan(0);
    expect(ttlMs).toBeLessThanOrEqual(60 * 60 * 1000);
  });

  it('detects expired / malformed token expiries', () => {
    expect(resetTokenExpired(undefined)).toBe(true);
    expect(resetTokenExpired('not-a-date')).toBe(true);
    expect(resetTokenExpired('2000-01-01T00:00:00.000Z')).toBe(true);
    expect(resetTokenExpired(new Date(Date.now() + 60_000).toISOString())).toBe(false);
  });
});
