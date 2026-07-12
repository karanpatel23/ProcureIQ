import { env } from './env';

/*
 * Claude integration — the LLM behind extraction, intake, and drafting when
 * AI_PROVIDER=anthropic. Direct HTTP to the Messages API (no SDK dependency,
 * same pattern as the Resend client). Design rules:
 *
 * - The deterministic local parser is ALWAYS the fallback: a Claude timeout,
 *   quota error, or malformed response degrades to the local path — the
 *   workflow never breaks because the model was unreachable.
 * - Callers validate Claude's JSON through the same zod schemas as local
 *   extraction, so a hallucinated shape can't leak into the data model.
 * - Raw responses are returned so extraction runs can store them for audit.
 */
export function claudeConfigured(): boolean {
  return env.AI_PROVIDER === 'anthropic' && Boolean(env.ANTHROPIC_API_KEY);
}

export type ClaudeJsonResult = { ok: true; json: unknown; raw: string; model: string } | { ok: false; error: string };

/** Ask Claude for a single JSON object. Returns ok:false on any failure — callers fall back. */
export async function claudeExtractJson(input: { system: string; prompt: string; maxTokens?: number }): Promise<ClaudeJsonResult> {
  if (!claudeConfigured()) return { ok: false, error: 'anthropic provider not configured' };
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25_000);
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': env.ANTHROPIC_API_KEY as string, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({
        model: env.ANTHROPIC_MODEL,
        max_tokens: input.maxTokens ?? 2048,
        system: `${input.system}\n\nRespond with ONLY a single valid JSON object — no prose, no markdown fences.`,
        messages: [{ role: 'user', content: input.prompt }],
      }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timer));
    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      console.error(JSON.stringify({ level: 'error', event: 'claude.request_failed', status: response.status, detail: detail.slice(0, 200) }));
      return { ok: false, error: `Claude responded ${response.status}` };
    }
    const body = (await response.json()) as { content?: Array<{ type: string; text?: string }> };
    const text = body.content?.find((block) => block.type === 'text')?.text ?? '';
    const jsonText = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    return { ok: true, json: JSON.parse(jsonText), raw: text, model: env.ANTHROPIC_MODEL };
  } catch (error) {
    console.error(JSON.stringify({ level: 'error', event: 'claude.request_error', message: error instanceof Error ? error.message : 'unknown' }));
    return { ok: false, error: error instanceof Error ? error.message : 'request failed' };
  }
}

/** Live 1-token ping to verify the Anthropic key actually works (integrations health). */
export async function claudePing(): Promise<{ configured: boolean; live: boolean; error?: string; model?: string }> {
  if (!claudeConfigured()) return { configured: false, live: false, error: env.AI_PROVIDER === 'anthropic' ? 'ANTHROPIC_API_KEY missing' : 'AI_PROVIDER is not anthropic' };
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10_000);
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': env.ANTHROPIC_API_KEY as string, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: env.ANTHROPIC_MODEL, max_tokens: 1, messages: [{ role: 'user', content: 'ping' }] }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timer));
    if (!response.ok) return { configured: true, live: false, error: `Anthropic responded ${response.status}`, model: env.ANTHROPIC_MODEL };
    return { configured: true, live: true, model: env.ANTHROPIC_MODEL };
  } catch (error) {
    return { configured: true, live: false, error: error instanceof Error ? error.message : 'unreachable' };
  }
}
