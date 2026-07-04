import { createId, now } from './db';
import type { Database, Rfq, Workspace } from './schema';

const value = (field: any) => field?.value ?? null;
export function buildPoDraftFromSelection(db: Database, input: { workspace: Workspace; rfq: Rfq & Record<string, any>; userId: string }) {
  const quote = db.supplierQuotes.find((item) => item.id === input.rfq.selectedSupplierQuoteId && item.workspaceId === input.workspace.id) as any;
  if (!quote) return null;
  const supplier = db.suppliers.find((item) => item.id === quote.supplierId && item.workspaceId === input.workspace.id) as any;
  const fields = quote.reviewedFields ?? quote.extractedFields ?? {};
  const quoteLines = db.quoteLineItems.filter((line) => line.workspaceId === input.workspace.id && line.supplierQuoteId === quote.id) as any[];
  const lines = quoteLines.length ? quoteLines.map((line) => ({ itemName: line.itemName ?? line.description, description: line.description, quantity: Number(line.quantity ?? 1), unit: line.unit ?? 'ea', unitPrice: Number(line.unitPrice ?? 0), extendedPrice: Number(line.extendedPrice ?? (line.quantity * line.unitPrice)), notes: line.notes ?? '', sourceDocumentId: line.sourceDocumentId })) : db.rfqItems.filter((item) => item.rfqId === input.rfq.id && item.workspaceId === input.workspace.id).map((item) => ({ itemName: item.itemName, description: item.description, quantity: item.quantity, unit: item.unit ?? 'ea', unitPrice: 0, extendedPrice: 0, notes: item.notes ?? '', sourceDocumentId: quote.quoteDocumentId }));
  const subtotal = lines.reduce((sum, line) => sum + Number(line.extendedPrice ?? 0), 0);
  const taxes = Number(value(fields.taxes) ?? 0);
  const freight = Number(String(value(fields.freightTerms) ?? '').match(/\$([0-9,.]+)/)?.[1]?.replaceAll(',', '') ?? 0);
  const timestamp = now();
  return { id: createId('po'), workspaceId: input.workspace.id, rfqId: input.rfq.id, supplierQuoteId: quote.id, status: 'draft_requires_human_approval' as const, poNumber: `PIQ-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`, poDate: timestamp.slice(0, 10), buyerCompany: input.workspace.name, supplierId: supplier?.id, supplierName: supplier?.name ?? 'Selected supplier', supplierContact: supplier?.contactPerson ?? supplier?.email ?? '', shipTo: input.rfq.deliveryLocation ?? '', billingContact: 'Billing contact to be confirmed', lines, subtotal, taxes, freight, total: subtotal + taxes + freight, paymentTerms: value(fields.paymentTerms) ?? '', deliveryDate: value(fields.deliveryDate) ?? input.rfq.neededBy ?? '', leadTime: value(fields.estimatedLeadTime) ?? '', notes: value(fields.notes) ?? '', internalApprovalNote: '', quoteReference: value(fields.quoteReference) ?? quote.id, createdByUserId: input.userId, createdAt: timestamp, updatedAt: timestamp };
}
export function poStatusLabel(status: string) { return status === 'draft_requires_human_approval' ? 'draft' : status; }
