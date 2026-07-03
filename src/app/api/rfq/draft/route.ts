import { NextResponse } from 'next/server';
import { createPoDraft, rfqDraftSchema } from '@/lib/procurement';

export async function POST(request: Request) {
  const payload: unknown = await request.json().catch(() => null);
  const parsed = rfqDraftSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid RFQ draft payload', issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const draft = createPoDraft(parsed.data);
  return NextResponse.json({ draft, message: 'AI-generated draft only. Human approval is required before purchasing.' });
}
