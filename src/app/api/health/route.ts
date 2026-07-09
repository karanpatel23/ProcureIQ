import { NextResponse } from 'next/server';
import { checkDbHealth } from '@/lib/server/db';
import { emailProviderConfigured } from '@/lib/server/email';
import { env } from '@/lib/server/env';
import { enabledProviders } from '@/lib/server/oauth';

export const dynamic = 'force-dynamic';

// Lightweight readiness probe: storage, auth, email, and OAuth configuration
// at a glance. Safe to expose — reports configuration state only, never secrets.
export async function GET() {
  const db = await checkDbHealth();
  const authSecretConfigured = Boolean(process.env.AUTH_SECRET && process.env.AUTH_SECRET.length >= 32);
  const email = {
    configured: emailProviderConfigured(),
    // Only the sender identity (already public on every email sent) — no keys.
    from: env.EMAIL_FROM ?? null,
  };
  return NextResponse.json(
    { ok: db.ok, storage: db, authSecretConfigured, email, oauthProviders: enabledProviders(), appUrl: env.APP_URL ?? null, time: new Date().toISOString() },
    { status: db.ok ? 200 : 503 },
  );
}
