import { z } from 'zod';

export const quoteSourceSchema = z.object({
  documentId: z.string().min(1),
  page: z.number().int().positive().optional(),
  excerpt: z.string().min(1).max(500),
});

export const quoteLineSchema = z.object({
  sku: z.string().min(1),
  description: z.string().min(2),
  quantity: z.number().positive(),
  unitPrice: z.number().nonnegative(),
  leadTimeDays: z.number().int().nonnegative(),
  source: quoteSourceSchema,
});

export const rfqDraftSchema = z.object({
  requestId: z.string().min(6),
  buyerTeam: z.string().min(2),
  supplierName: z.string().min(2),
  currency: z.string().length(3).default('USD'),
  lines: z.array(quoteLineSchema).min(1),
});

export type RfqDraftInput = z.infer<typeof rfqDraftSchema>;

export function scoreQuoteConfidence(input: RfqDraftInput) {
  const tracedLines = input.lines.filter((line) => line.source.excerpt.length > 12).length;
  const traceabilityScore = tracedLines / input.lines.length;
  const leadTimeScore = input.lines.every((line) => line.leadTimeDays > 0) ? 1 : 0.72;
  return Math.round((0.68 * traceabilityScore + 0.32 * leadTimeScore) * 100);
}

export function createPoDraft(input: RfqDraftInput) {
  const subtotal = input.lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);

  return {
    id: `po-draft-${input.requestId}`,
    status: 'draft_requires_human_approval' as const,
    supplierName: input.supplierName,
    buyerTeam: input.buyerTeam,
    currency: input.currency,
    subtotal,
    confidence: scoreQuoteConfidence(input),
    approvalRequired: true,
    traceability: input.lines.map((line) => ({
      sku: line.sku,
      documentId: line.source.documentId,
      page: line.source.page ?? null,
      excerpt: line.source.excerpt,
    })),
  };
}
