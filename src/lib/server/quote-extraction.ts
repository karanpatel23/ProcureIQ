import { z } from 'zod';

const confidenceField = <T extends z.ZodTypeAny>(schema: T) =>
  z.object({
    value: schema.nullable(),
    confidence: z.number().min(0).max(100),
    source: z.string().optional(),
  });

export const extractedQuoteSchema = z.object({
  supplierName: confidenceField(z.string()),
  quoteReference: confidenceField(z.string()),
  quoteDate: confidenceField(z.string()),
  validUntil: confidenceField(z.string()),
  currency: confidenceField(z.string()),
  paymentTerms: confidenceField(z.string()),
  freightTerms: confidenceField(z.string()),
  estimatedLeadTime: confidenceField(z.string()),
  deliveryDate: confidenceField(z.string()),
  taxes: confidenceField(z.number()),
  totalPrice: confidenceField(z.number()),
  notes: confidenceField(z.string()),
  lineItems: z
    .array(
      z.object({
        itemName: confidenceField(z.string()),
        description: confidenceField(z.string()),
        quantity: confidenceField(z.number()),
        unit: confidenceField(z.string()),
        unitPrice: confidenceField(z.number()),
        extendedPrice: confidenceField(z.number()),
        leadTime: confidenceField(z.string()),
        alternatives: confidenceField(z.string()),
        notes: confidenceField(z.string()),
      }),
    )
    .default([]),
  quoteConfidence: z.number().min(0).max(100),
});

export type ExtractedQuote = z.infer<typeof extractedQuoteSchema>;

export type QuoteExtractionProvider = 'local' | 'openai' | 'azure';

export type QuoteExtractionResult = {
  provider: QuoteExtractionProvider;
  parsed: ExtractedQuote;
  rawAiResponse: string;
};

const money = (text: string) =>
  Number(
    (
      text.match(/(?:total|amount|price)\D{0,20}\$?([0-9,]+(?:\.\d{2})?)/i)?.[1] ?? '0'
    ).replaceAll(',', ''),
  ) || null;

const ref = (text: string) =>
  text.match(/(?:quote|ref|reference)\s*#?:?\s*([A-Z0-9-]+)/i)?.[1] ?? null;

const emailSupplier = (text: string) =>
  text.match(/(?:from|supplier|vendor)\s*:?\s*([A-Z][A-Za-z0-9 &.,-]+)/i)?.[1]?.trim() ??
  null;

const terms = (text: string) =>
  text.match(/(?:payment terms|terms)\s*:?\s*([A-Za-z0-9 ]{3,40})/i)?.[1]?.trim() ?? null;

const lead = (text: string) =>
  text.match(/(?:lead time|delivery)\s*:?\s*([A-Za-z0-9 -]{3,40})/i)?.[1]?.trim() ??
  null;

const currency = (text: string) =>
  text.match(/\b(USD|EUR|GBP|CAD|AUD)\b/i)?.[1]?.toUpperCase() ?? 'USD';

const field = <T>(value: T | null, confidence = value ? 78 : 28, source?: string) => ({
  value,
  confidence,
  source,
});

export function runQuoteExtraction(
  sourceText: string,
  fallbackSupplierName?: string,
): QuoteExtractionResult {
  const total = money(sourceText);
  const supplier = emailSupplier(sourceText) ?? fallbackSupplierName ?? null;
  const quoteRef = ref(sourceText);
  const paymentTerms = terms(sourceText);
  const leadTime = lead(sourceText);

  const firstLine =
    sourceText.split('\n').find((line) => /sku|item|part|material/i.test(line)) ??
    sourceText.slice(0, 120);

  const parsed = extractedQuoteSchema.parse({
    supplierName: field(supplier, supplier ? 82 : 35, 'source text'),
    quoteReference: field(quoteRef, quoteRef ? 80 : 25),
    quoteDate: field(null, 20),
    validUntil: field(null, 20),
    currency: field(currency(sourceText), 75),
    paymentTerms: field(paymentTerms, paymentTerms ? 78 : 30),
    freightTerms: field(sourceText.match(/freight[^.\n]*/i)?.[0] ?? null, 70),
    estimatedLeadTime: field(leadTime, leadTime ? 76 : 30),
    deliveryDate: field(null, 20),
    taxes: field(null, 20),
    totalPrice: field(total, total ? 74 : 25),
    notes: field(sourceText.slice(0, 400), 55),
    lineItems: [
      {
        itemName: field(firstLine.slice(0, 80) || 'Quoted item', 52),
        description: field(firstLine, 50),
        quantity: field(1, 35),
        unit: field('ea', 35),
        unitPrice: field(total, total ? 55 : 20),
        extendedPrice: field(total, total ? 58 : 20),
        leadTime: field(leadTime, leadTime ? 70 : 25),
        alternatives: field(null, 20),
        notes: field('Review extracted line item against source before approval.', 60),
      },
    ],
    quoteConfidence: total && supplier ? 72 : 44,
  });

  return {
    provider: 'local',
    parsed,
    rawAiResponse: JSON.stringify(parsed),
  };
}