import { describe, expect, it } from 'vitest';
import { buildWelcomeEmail } from './welcome-email';

describe('welcome email', () => {
  it('personalizes the subject and greeting with the first name only', () => {
    const { subject, html, text } = buildWelcomeEmail('Karan Patel', 'https://corven.com/onboarding');
    expect(subject).toBe('Welcome to Corven, Karan — your workspace is ready');
    expect(html).toContain('Welcome to Corven, Karan.');
    expect(text).toContain('Welcome to Corven, Karan.');
  });

  it('falls back to a friendly greeting when the name is empty', () => {
    expect(buildWelcomeEmail('', 'https://x/onboarding').subject).toBe('Welcome to Corven, there — your workspace is ready');
  });

  it('embeds the single primary CTA in both html and text', () => {
    const url = 'https://corven.com/onboarding';
    const { html, text } = buildWelcomeEmail('Alex', url);
    expect(html).toContain(`href="${url}"`);
    expect(text).toContain(url);
  });

  it('renders a complete HTML document with a human sign-off', () => {
    const { html } = buildWelcomeEmail('Sam', 'https://x/onboarding');
    expect(html.startsWith('<!DOCTYPE html>')).toBe(true);
    expect(html).toContain('Karan Patel');
    expect(html).toContain('Founder, Corven');
  });
});
