import { NextResponse } from 'next/server';
import { ZodError, type ZodSchema } from 'zod';

export type ApiSuccess<T> = { ok: true; data: T };
export type ApiFailure = { ok: false; error: { code: string; message: string; details?: unknown } };

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public details?: unknown) { super(message); }
}

export function jsonOk<T>(data: T, init?: ResponseInit) { return NextResponse.json<ApiSuccess<T>>({ ok: true, data }, init); }
export function jsonError(error: ApiError) { return NextResponse.json<ApiFailure>({ ok: false, error: { code: error.code, message: error.message, details: error.details } }, { status: error.status }); }
export function handleApiError(error: unknown) {
  if (error instanceof ApiError) return jsonError(error);
  if (error instanceof ZodError) return jsonError(new ApiError(400, 'VALIDATION_ERROR', 'Request validation failed.', error.flatten()));
  console.error(error);
  return jsonError(new ApiError(500, 'INTERNAL_ERROR', 'Something went wrong.'));
}
export async function parseJson<T>(request: Request, schema: ZodSchema<T>) { return schema.parse(await request.json().catch(() => { throw new ApiError(400, 'INVALID_JSON', 'Request body must be valid JSON.'); })); }
