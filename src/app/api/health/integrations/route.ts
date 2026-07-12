import { handleApiError, jsonOk } from '@/lib/server/api';
import { claudePing } from '@/lib/server/ai';
import { requireUser } from '@/lib/server/auth';
import { emailProviderConfigured, sandboxActive } from '@/lib/server/email';
import { env } from '@/lib/server/env';

export const dynamic = 'force-dynamic';

// Live integration verification (signed-in users only — the Anthropic check
// spends one real token). Reports what is ACTUALLY working, not just what env
// vars exist: a real 1-token Claude call and Resend domain status.
export async function GET() {
  try {
    await requireUser();
    const [anthropic, resend] = await Promise.all([
      claudePing(),
      (async () => {
        if (!emailProviderConfigured()) return { configured: false, live: false, error: 'RESEND_API_KEY or EMAIL_FROM missing' };
        try {
          const response = await fetch('https://api.resend.com/domains', { headers: { authorization: `Bearer ${env.RESEND_API_KEY}` }, signal: AbortSignal.timeout(10_000) });
          if (!response.ok) return { configured: true, live: false, error: `Resend responded ${response.status}` };
          const body = (await response.json().catch(() => ({}))) as { data?: Array<{ name?: string; status?: string }> };
          return { configured: true, live: true, from: env.EMAIL_FROM, domains: (body.data ?? []).map((d) => ({ name: d.name, status: d.status })) };
        } catch (error) {
          return { configured: true, live: false, error: error instanceof Error ? error.message : 'unreachable' };
        }
      })(),
    ]);
    return jsonOk({ anthropic, resend, sandbox: { active: sandboxActive(), redirectTo: env.SANDBOX_EMAIL_TO ?? null }, aiProvider: env.AI_PROVIDER });
  } catch (error) { return handleApiError(error); }
}
