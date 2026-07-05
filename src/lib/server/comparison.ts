import type { Database, Rfq, SupplierQuote } from './schema';

type Risk = { code: string; label: string; severity: 'low' | 'medium' | 'high' };
type ComparedQuote = { quote: SupplierQuote & Record<string, any>; supplierName: string; totalPrice: number | null; leadTime: string | null; paymentTerms: string | null; freightTerms: string | null; validUntil: string | null; taxes: number | null; notes: string | null; confidence: number; risks: Risk[]; score: number; lineItems: Array<Record<string, any>> };

const value = (field: any) => field?.value ?? null;
const daysFromLead = (lead?: string | null) => Number(String(lead ?? '').match(/\d+/)?.[0] ?? 9999);
const dateExpired = (date?: string | null) => Boolean(date && !Number.isNaN(Date.parse(date)) && new Date(date) < new Date());
const risk = (code: string, label: string, severity: Risk['severity'] = 'medium'): Risk => ({ code, label, severity });

export function buildRfqComparison(db: Database, rfq: Rfq) {
  const quotes = db.supplierQuotes.filter((quote) => quote.workspaceId === rfq.workspaceId && quote.rfqId === rfq.id) as ComparedQuote['quote'][];
  const compared: ComparedQuote[] = quotes.map((quote) => {
    const fields: any = quote.reviewedFields ?? quote.extractedFields ?? {};
    const lineItems = db.quoteLineItems.filter((line) => line.workspaceId === rfq.workspaceId && line.supplierQuoteId === quote.id) as any[];
    const totalPrice = Number(value(fields.totalPrice) ?? lineItems.reduce((sum, line) => sum + Number(line.extendedPrice ?? (line.quantity * line.unitPrice)), 0)) || null;
    const leadTime = value(fields.estimatedLeadTime);
    const paymentTerms = value(fields.paymentTerms);
    const freightTerms = value(fields.freightTerms);
    const validUntil = value(fields.validUntil);
    const notes = value(fields.notes);
    const risks: Risk[] = [];
    if (!paymentTerms) risks.push(risk('missing_payment_terms', 'Missing payment terms'));
    if (!freightTerms) risks.push(risk('missing_freight', 'Missing freight/shipping'));
    if (!validUntil) risks.push(risk('missing_validity', 'Quote validity missing'));
    if (dateExpired(validUntil)) risks.push(risk('expired_quote', 'Quote appears expired', 'high'));
    if ((quote.confidenceScore ?? 0) < 60) risks.push(risk('low_confidence', 'Low extraction confidence', 'high'));
    if (notes && /exclusion|except|alternate|substitution|not included/i.test(notes)) risks.push(risk('notes_exclusions', 'Supplier notes or exclusions found'));
    if (lineItems.length < db.rfqItems.filter((item) => item.rfqId === rfq.id && item.workspaceId === rfq.workspaceId).length) risks.push(risk('missing_item', 'Missing item'));
    const supplier = db.suppliers.find((item) => item.id === quote.supplierId);
    return { quote, supplierName: supplier?.name ?? 'Unknown supplier', totalPrice, leadTime, paymentTerms, freightTerms, validUntil, taxes: Number(value(fields.taxes)) || null, notes, confidence: quote.confidenceScore ?? 0, risks, score: 0, lineItems };
  });
  const prices = compared.map((item) => item.totalPrice).filter((price): price is number => Boolean(price));
  const minPrice = prices.length ? Math.min(...prices) : null;
  const minLead = Math.min(...compared.map((item) => daysFromLead(item.leadTime)));
  const avgPrice = prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : null;
  for (const item of compared) {
    if (avgPrice && item.totalPrice && Math.abs(item.totalPrice - avgPrice) / avgPrice > 0.2) item.risks.push(risk('price_variance', 'Significant price variance'));
    const priceScore = minPrice && item.totalPrice ? (minPrice / item.totalPrice) * 40 : 15;
    const leadScore = daysFromLead(item.leadTime) === minLead ? 20 : Math.max(5, 20 - daysFromLead(item.leadTime) / 5);
    const completenessScore = Math.max(0, 25 - item.risks.length * 4);
    const confidenceScore = Math.min(15, item.confidence / 100 * 15);
    item.score = Math.round(priceScore + leadScore + completenessScore + confidenceScore);
  }
  const lowestCost = compared.reduce((best, item) => (!best || (item.totalPrice ?? Infinity) < (best.totalPrice ?? Infinity) ? item : best), compared[0]);
  const fastest = compared.reduce((best, item) => (!best || daysFromLead(item.leadTime) < daysFromLead(best.leadTime) ? item : best), compared[0]);
  const overall = compared.reduce((best, item) => (!best || item.score > best.score ? item : best), compared[0]);
  return { quotes: compared, recommendation: overall ? { lowestCost, fastest, overall, confidence: Math.min(95, Math.max(35, overall.score)), reasons: [`${overall.supplierName} has the strongest combined score for price, lead time, completeness, and extraction confidence.`, 'Review all risk flags before approving a supplier.'], tradeoffs: overall.risks.map((risk) => risk.label) } : null };
}
