import type { Database } from './schema';

/*
 * Supplier memory — "we've bought this before," surfaced at decision time.
 * Computed live from awarded POs, accepted quotes, and quote completeness;
 * no new tables, always consistent with the record. The reliability score is
 * deliberately explainable: its inputs are listed with it, never a black box.
 */
export type SupplierMemory = {
  supplierId: string;
  awards: number;                 // POs drafted against this supplier's winning quotes
  lastAwardAt?: string;
  lastPrices: Array<{ itemName: string; unitPrice: number }>;
  avgLeadDays?: number;
  quoteCount: number;
  reliability: number;            // 0–100, explainable
  reliabilityInputs: string[];
};

const leadDays = (lead?: string | null): number | null => {
  if (!lead) return null;
  const nums = String(lead).match(/\d+/g)?.map(Number) ?? [];
  if (!nums.length) return null;
  const max = Math.max(...nums);
  return /week/i.test(lead) ? max * 7 : /month/i.test(lead) ? max * 30 : max;
};

export function buildSupplierMemory(db: Database, workspaceId: string, supplierIds: string[]): Map<string, SupplierMemory> {
  const memory = new Map<string, SupplierMemory>();
  for (const supplierId of supplierIds) {
    const supplier = db.suppliers.find((s) => s.id === supplierId && s.workspaceId === workspaceId);
    if (!supplier) continue;
    const quotes = db.supplierQuotes.filter((q) => q.workspaceId === workspaceId && q.supplierId === supplierId);
    const accepted = quotes.filter((q) => q.status === 'accepted');
    const awardsList = db.purchaseOrderDrafts.filter((po: any) => po.workspaceId === workspaceId && (po.supplierId === supplierId || accepted.some((q) => q.id === po.supplierQuoteId)));
    const lines = db.quoteLineItems.filter((l: any) => l.workspaceId === workspaceId && accepted.some((q) => q.id === l.supplierQuoteId));
    const lastPrices = lines.slice(-3).map((l: any) => ({ itemName: String(l.itemName ?? l.description ?? 'item').slice(0, 60), unitPrice: Number(l.unitPrice) || 0 })).filter((p) => p.unitPrice > 0);
    const leads = accepted.map((q: any) => leadDays((q.reviewedFields ?? q.extractedFields)?.estimatedLeadTime?.value)).filter((d): d is number => d !== null);
    const complete = accepted.filter((q: any) => { const f = q.reviewedFields ?? q.extractedFields ?? {}; return f?.paymentTerms?.value && f?.estimatedLeadTime?.value; }).length;

    const inputs: string[] = [];
    let score = 50;
    const awardPts = Math.min(30, awardsList.length * 10);
    if (awardPts) { score += awardPts; inputs.push(`${awardsList.length} past award(s) (+${awardPts})`); }
    if (supplier.preferred) { score += 10; inputs.push('preferred supplier (+10)'); }
    if (supplier.email) { score += 5; inputs.push('contactable (+5)'); }
    if (accepted.length) {
      const completeness = Math.round((complete / accepted.length) * 5);
      score += completeness; inputs.push(`quote completeness ${complete}/${accepted.length} (+${completeness})`);
    }
    if (!inputs.length) inputs.push('no purchase history yet (baseline 50)');

    memory.set(supplierId, {
      supplierId,
      awards: awardsList.length,
      lastAwardAt: awardsList.at(-1)?.createdAt,
      lastPrices,
      avgLeadDays: leads.length ? Math.round(leads.reduce((a, b) => a + b, 0) / leads.length) : undefined,
      quoteCount: quotes.length,
      reliability: Math.min(100, score),
      reliabilityInputs: inputs,
    });
  }
  return memory;
}
