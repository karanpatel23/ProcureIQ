import { z } from 'zod';
import { ApiError } from './api';
import { env } from './env';

const confidenceField = <T extends z.ZodTypeAny>(schema: T) => z.object({ value: schema.nullable(), confidence: z.number().min(0).max(100), source: z.string().optional() });
export const extractedQuoteSchema = z.object({
  supplierName: confidenceField(z.string()), quoteReference: confidenceField(z.string()), quoteDate: confidenceField(z.string()), validUntil: confidenceField(z.string()), currency: confidenceField(z.string()), paymentTerms: confidenceField(z.string()), freightTerms: confidenceField(z.string()), estimatedLeadTime: confidenceField(z.string()), deliveryDate: confidenceField(z.string()), taxes: confidenceField(z.number()), totalPrice: confidenceField(z.number()), notes: confidenceField(z.string()),
  lineItems: z.array(z.object({ itemName: confidenceField(z.string()), description: confidenceField(z.string()), quantity: confidenceField(z.number()), unit: confidenceField(z.string()), unitPrice: confidenceField(z.number()), extendedPrice: confidenceField(z.number()), leadTime: confidenceField(z.string()), alternatives: confidenceField(z.string()), notes: confidenceField(z.string()) })).default([]),
  quoteConfidence: z.number().min(0).max(100),
});
export type ExtractedQuote = z.infer<typeof extractedQuoteSchema>;
export type QuoteExtractionResult = { parsed: ExtractedQuote; rawAiResponse: string; provider: 'local' | 'openai' | 'azure' };

const money = (text: string) => Number((text.match(/(?:total|amount|price)\D{0,20}\$?([0-9,]+(?:\.\d{2})?)/i)?.[1] ?? '0').replaceAll(',', '')) || null;
const ref = (text: string) => text.match(/(?:quote|ref|reference)\s*#?:?\s*([A-Z0-9-]+)/i)?.[1] ?? null;
const emailSupplier = (text: string) => text.match(/(?:from|supplier|vendor)\s*:?\s*([A-Z][A-Za-z0-9 &.,-]+)/i)?.[1]?.trim() ?? null;
const terms = (text: string) => text.match(/(?:payment terms|terms)\s*:?\s*([A-Za-z0-9 ]{3,40})/i)?.[1]?.trim() ?? null;
const lead = (text: string) => text.match(/(?:lead time|delivery)\s*:?\s*([A-Za-z0-9 -]{3,40})/i)?.[1]?.trim() ?? null;
const currency = (text: string) => text.match(/\b(USD|EUR|GBP|CAD|AUD)\b/i)?.[1]?.toUpperCase() ?? 'USD';
const field = <T>(value: T | null, confidence = value ? 78 : 28, source?: string) => ({ value, confidence, source });

const extractionJsonSchema = {
  name: 'procureiq_quote_extraction',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['supplierName','quoteReference','quoteDate','validUntil','currency','paymentTerms','freightTerms','estimatedLeadTime','deliveryDate','taxes','totalPrice','notes','lineItems','quoteConfidence'],
    properties: {
      supplierName: confidenceJson('string'), quoteReference: confidenceJson('string'), quoteDate: confidenceJson('string'), validUntil: confidenceJson('string'), currency: confidenceJson('string'), paymentTerms: confidenceJson('string'), freightTerms: confidenceJson('string'), estimatedLeadTime: confidenceJson('string'), deliveryDate: confidenceJson('string'), taxes: confidenceJson('number'), totalPrice: confidenceJson('number'), notes: confidenceJson('string'), quoteConfidence: { type: 'number', minimum: 0, maximum: 100 },
      lineItems: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['itemName','description','quantity','unit','unitPrice','extendedPrice','leadTime','alternatives','notes'], properties: { itemName: confidenceJson('string'), description: confidenceJson('string'), quantity: confidenceJson('number'), unit: confidenceJson('string'), unitPrice: confidenceJson('number'), extendedPrice: confidenceJson('number'), leadTime: confidenceJson('string'), alternatives: confidenceJson('string'), notes: confidenceJson('string') } } },
    },
  },
};
function confidenceJson(type: 'string' | 'number') { return { type: 'object', additionalProperties: false, required: ['value','confidence','source'], properties: { value: { anyOf: [{ type }, { type: 'null' }] }, confidence: { type: 'number', minimum: 0, maximum: 100 }, source: { type: 'string' } } }; }
const systemPrompt = 'Extract supplier quote data for human review. Return only JSON matching the schema. Every extracted field object must include value, confidence, and source. Use null for missing values and set source to "not found" when the source is unavailable. Never make purchasing decisions.';

export async function runQuoteExtraction(sourceText: string, fallbackSupplierName?: string): Promise<QuoteExtractionResult> {
  if (env.AI_PROVIDER === 'openai') return runOpenAiExtraction(sourceText, fallbackSupplierName);
  if (env.AI_PROVIDER === 'azure') return runAzureOpenAiExtraction(sourceText, fallbackSupplierName);
  return runLocalExtraction(sourceText, fallbackSupplierName);
}

function runLocalExtraction(sourceText: string, fallbackSupplierName?: string): QuoteExtractionResult {
  const total = money(sourceText);
  const supplier = emailSupplier(sourceText) ?? fallbackSupplierName ?? null;
  const firstLine = sourceText.split('\n').find((line) => /sku|item|part|material/i.test(line)) ?? sourceText.slice(0, 120);
  const parsed = extractedQuoteSchema.parse({
    supplierName: field(supplier, supplier ? 82 : 35, 'source text'), quoteReference: field(ref(sourceText), ref(sourceText) ? 80 : 25), quoteDate: field(null, 20), validUntil: field(null, 20), currency: field(currency(sourceText), 75), paymentTerms: field(terms(sourceText), terms(sourceText) ? 78 : 30), freightTerms: field(sourceText.match(/freight[^.\n]*/i)?.[0] ?? null, 70), estimatedLeadTime: field(lead(sourceText), lead(sourceText) ? 76 : 30), deliveryDate: field(null, 20), taxes: field(null, 20), totalPrice: field(total, total ? 74 : 25), notes: field(sourceText.slice(0, 400), 55),
    lineItems: [{ itemName: field(firstLine.slice(0, 80) || 'Quoted item', 52), description: field(firstLine, 50), quantity: field(1, 35), unit: field('ea', 35), unitPrice: field(total, total ? 55 : 20), extendedPrice: field(total, total ? 58 : 20), leadTime: field(lead(sourceText), lead(sourceText) ? 70 : 25), alternatives: field(null, 20), notes: field('Review extracted line item against source before approval.', 60) }],
    quoteConfidence: total && supplier ? 72 : 44,
  });
  return { parsed, rawAiResponse: JSON.stringify(parsed), provider: 'local' };
}

async function runOpenAiExtraction(sourceText: string, fallbackSupplierName?: string): Promise<QuoteExtractionResult> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.OPENAI_API_KEY!}` }, body: JSON.stringify({ model: env.OPENAI_MODEL, temperature: 0, response_format: { type: 'json_schema', json_schema: extractionJsonSchema }, messages: buildMessages(sourceText, fallbackSupplierName) }) });
  return parseAiResponse(response, 'openai');
}

async function runAzureOpenAiExtraction(sourceText: string, fallbackSupplierName?: string): Promise<QuoteExtractionResult> {
  const endpoint = env.AZURE_OPENAI_ENDPOINT!.replace(/\/$/, '');
  const deployment = encodeURIComponent(env.AZURE_OPENAI_DEPLOYMENT!);
  const url = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=${encodeURIComponent(env.AZURE_OPENAI_API_VERSION!)}`;
  const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'api-key': env.AZURE_OPENAI_API_KEY! }, body: JSON.stringify({ temperature: 0, response_format: { type: 'json_schema', json_schema: extractionJsonSchema }, messages: buildMessages(sourceText, fallbackSupplierName) }) });
  return parseAiResponse(response, 'azure');
}

function buildMessages(sourceText: string, fallbackSupplierName?: string) { return [{ role: 'system', content: systemPrompt }, { role: 'user', content: `Fallback supplier name: ${fallbackSupplierName ?? 'unknown'}\n\nQuote source:\n${sourceText.slice(0, 24000)}` }]; }
async function parseAiResponse(response: Response, provider: 'openai' | 'azure'): Promise<QuoteExtractionResult> {
  const rawAiResponse = await response.text();
  if (!response.ok) throw new ApiError(502, 'AI_EXTRACTION_FAILED', 'Quote extraction provider failed. You can retry or continue with manual entry.', { provider, status: response.status });
  const payload = JSON.parse(rawAiResponse) as { choices?: Array<{ message?: { content?: string } }> };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new ApiError(502, 'AI_EXTRACTION_EMPTY', 'Quote extraction returned no structured content. You can retry or continue with manual entry.', { provider });
  const parsed = extractedQuoteSchema.parse(JSON.parse(content));
  return { parsed, rawAiResponse, provider };
}
