import { createId } from './db';

export function createRequestId() { return createId('req'); }
export function logServerError(error: unknown, context: Record<string, unknown> = {}) {
  const message = error instanceof Error ? error.message : 'Unknown server error';
  console.error(JSON.stringify({ level: 'error', message, context, at: new Date().toISOString() }));
}
