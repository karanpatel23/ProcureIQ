import type { Database, Workspace } from './schema';

const n = (value: unknown) => Number(value ?? 0) || 0;
const day = (value?: string) => (value ?? '').slice(0, 10) || 'undated';
const avg = (values: number[]) => values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : null;
const leadDays = (value?: string) => Number(String(value ?? '').match(/\d+/)?.[0] ?? 0) || null;

export function getWorkspaceAnalytics(db: Database, workspace: Workspace) {
  const rfqs = db.rfqs.filter((item) => item.workspaceId === workspace.id);
  const quotes = db.supplierQuotes.filter((item) => item.workspaceId === workspace.id) as any[];
  const pos = db.purchaseOrderDrafts.filter((item) => item.workspaceId === workspace.id) as any[];
  const suppliers = db.suppliers.filter((item) => item.workspaceId === workspace.id) as any[];
  const auditLogs = db.auditLogs.filter((item) => item.workspaceId === workspace.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 12);
  const quotedValueBySupplier = suppliers.map((supplier) => ({ supplier, value: quotes.filter((quote) => quote.supplierId === supplier.id).reduce((sum, quote) => sum + n((quote.reviewedFields ?? quote.extractedFields)?.totalPrice?.value), 0) })).sort((a, b) => b.value - a.value);
  const selectedBySupplier = suppliers.map((supplier) => ({ supplier, value: pos.filter((po) => po.supplierId === supplier.id).reduce((sum, po) => sum + n(po.total ?? po.subtotal), 0) })).sort((a, b) => b.value - a.value);
  const missingFieldChecks = quotes.flatMap((quote) => ['paymentTerms','freightTerms','validUntil','totalPrice'].map((field) => Boolean((quote.reviewedFields ?? quote.extractedFields)?.[field]?.value)));
  const confidenceValues = quotes.map((quote) => n(quote.confidenceScore)).filter(Boolean);
  const leads = quotes.map((quote) => leadDays((quote.reviewedFields ?? quote.extractedFields)?.estimatedLeadTime?.value)).filter((x): x is number => Boolean(x));
  return { cards: { rfqCount: rfqs.length, quoteCount: quotes.length, poDraftValue: pos.reduce((sum, po) => sum + n(po.total ?? po.subtotal), 0), missingInfoRate: missingFieldChecks.length ? Math.round((missingFieldChecks.filter((exists) => !exists).length / missingFieldChecks.length) * 100) : 0, avgConfidence: avg(confidenceValues), avgLeadTime: avg(leads) }, rfqsOverTime: countBy(rfqs.map((item) => day(item.createdAt))), quotesOverTime: countBy(quotes.map((item) => day(item.createdAt))), topQuotedSuppliers: quotedValueBySupplier.slice(0, 5), topSelectedSuppliers: selectedBySupplier.slice(0, 5), activityFeed: auditLogs };
}
export function getSupplierMemory(db: Database, workspace: Workspace, supplierId: string) {
  const supplier = db.suppliers.find((item) => item.workspaceId === workspace.id && item.id === supplierId) as any;
  if (!supplier) return null;
  const quotes = db.supplierQuotes.filter((quote) => quote.workspaceId === workspace.id && quote.supplierId === supplier.id) as any[];
  const rfqIds = new Set(quotes.map((quote) => quote.rfqId));
  const pos = db.purchaseOrderDrafts.filter((po: any) => po.workspaceId === workspace.id && po.supplierId === supplier.id) as any[];
  const quoteLines = db.quoteLineItems.filter((line: any) => quotes.some((quote) => quote.id === line.supplierQuoteId)) as any[];
  const leads = quotes.map((quote) => leadDays((quote.reviewedFields ?? quote.extractedFields)?.estimatedLeadTime?.value)).filter((x): x is number => Boolean(x));
  return { supplier, rfqCount: rfqIds.size, quoteCount: quotes.length, wonCount: pos.length, averageLeadTime: avg(leads), totalQuotedValue: quotes.reduce((sum, quote) => sum + n((quote.reviewedFields ?? quote.extractedFields)?.totalPrice?.value), 0), totalSelectedValue: pos.reduce((sum, po) => sum + n(po.total ?? po.subtotal), 0), priceHistory: quoteLines.map((line) => ({ item: line.itemName ?? line.description, unitPrice: n(line.unitPrice), date: line.createdAt })), leadTimeHistory: quotes.map((quote) => ({ quoteId: quote.id, leadTime: (quote.reviewedFields ?? quote.extractedFields)?.estimatedLeadTime?.value ?? 'Missing', confidence: quote.confidenceScore })), completeness: quotes.map((quote) => ({ quoteId: quote.id, missing: ['paymentTerms','freightTerms','validUntil','totalPrice'].filter((field) => !(quote.reviewedFields ?? quote.extractedFields)?.[field]?.value) })), risks: quotes.flatMap((quote) => (quote.confidenceScore ?? 0) < 60 ? ['Low extraction confidence on a submitted quote'] : []) };
}
function countBy(values: string[]) { return Object.entries(values.reduce<Record<string, number>>((acc, value) => { acc[value] = (acc[value] ?? 0) + 1; return acc; }, {})).map(([label, value]) => ({ label, value })); }
