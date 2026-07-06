import { NextResponse } from 'next/server';
import { checkDbHealth } from '@/lib/server/db';

export const dynamic = 'force-dynamic';

// Lightweight readiness probe: confirms the storage backend is reachable.
// Safe to expose — reports the backend name and connectivity, never secrets.
export async function GET() {
  const db = await checkDbHealth();
  const authSecretConfigured = Boolean(process.env.AUTH_SECRET && process.env.AUTH_SECRET.length >= 32);
  return NextResponse.json(
    { ok: db.ok, storage: db, authSecretConfigured, time: new Date().toISOString() },
    { status: db.ok ? 200 : 503 },
  );
}
