export type Role = 'owner' | 'admin' | 'member' | 'viewer';
export type MainPurchasingWorkflow = 'materials' | 'parts' | 'equipment' | 'subcontractors' | 'packaging' | 'services' | 'other';

export type User = { id: string; email: string; name: string; passwordHash: string; createdAt: string; updatedAt: string };
export type Workspace = { id: string; name: string; industryCategory: string; teamSize?: string; website?: string; procurementEmail?: string; mainPurchasingWorkflow?: MainPurchasingWorkflow; currentTools: string[]; createdAt: string; updatedAt: string };
export type WorkspaceMember = { id: string; workspaceId: string; userId: string; role: Role; createdAt: string };
export type Supplier = { id: string; workspaceId: string; name: string; website?: string; primaryEmail?: string; createdAt: string; updatedAt: string };
export type Rfq = { id: string; workspaceId: string; createdByUserId: string; title: string; status: 'draft' | 'sent' | 'quotes_received' | 'approved' | 'archived'; createdAt: string; updatedAt: string };
export type RfqItem = { id: string; workspaceId: string; rfqId: string; sku?: string; description: string; quantity: number; unit?: string; createdAt: string };
export type QuoteDocument = { id: string; workspaceId: string; rfqId?: string; supplierId?: string; fileName: string; mimeType: string; byteSize: number; storageKey: string; uploadedByUserId: string; createdAt: string };
export type SupplierQuote = { id: string; workspaceId: string; rfqId: string; supplierId: string; status: 'received' | 'parsed' | 'needs_review' | 'accepted' | 'rejected'; currency: string; confidenceScore?: number; createdAt: string; updatedAt: string };
export type QuoteLineItem = { id: string; workspaceId: string; supplierQuoteId: string; rfqItemId?: string; description: string; quantity: number; unitPrice: number; leadTimeDays?: number; sourceDocumentId?: string; sourceExcerpt?: string; confidenceScore?: number; createdAt: string };
export type PurchaseOrderDraft = { id: string; workspaceId: string; rfqId: string; supplierQuoteId: string; status: 'draft_requires_human_approval' | 'approved' | 'exported' | 'void'; createdByUserId: string; subtotal: number; currency: string; createdAt: string; updatedAt: string };
export type AuditLog = { id: string; workspaceId: string; actorUserId?: string; action: string; entityType: string; entityId?: string; metadata: Record<string, unknown>; createdAt: string };
export type AiExtractionRun = { id: string; workspaceId: string; quoteDocumentId: string; status: 'queued' | 'running' | 'completed' | 'failed'; modelProvider?: string; confidenceScore?: number; errorMessage?: string; createdAt: string; updatedAt: string };
export type Session = { id: string; userId: string; expiresAt: string; createdAt: string };

export type Database = { users: User[]; workspaces: Workspace[]; workspaceMembers: WorkspaceMember[]; suppliers: Supplier[]; rfqs: Rfq[]; rfqItems: RfqItem[]; quoteDocuments: QuoteDocument[]; supplierQuotes: SupplierQuote[]; quoteLineItems: QuoteLineItem[]; purchaseOrderDrafts: PurchaseOrderDraft[]; auditLogs: AuditLog[]; aiExtractionRuns: AiExtractionRun[]; sessions: Session[] };

export const emptyDatabase = (): Database => ({ users: [], workspaces: [], workspaceMembers: [], suppliers: [], rfqs: [], rfqItems: [], quoteDocuments: [], supplierQuotes: [], quoteLineItems: [], purchaseOrderDrafts: [], auditLogs: [], aiExtractionRuns: [], sessions: [] });
