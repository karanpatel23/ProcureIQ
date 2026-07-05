export type Role = 'owner' | 'admin' | 'member' | 'viewer';
export type MainPurchasingWorkflow = 'materials' | 'parts' | 'equipment' | 'subcontractors' | 'packaging' | 'services' | 'other';
export type BillingPlan = 'starter' | 'growth' | 'pro' | 'enterprise';
export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'paused' | 'cancelled' | 'not_configured';
export type LeadType = 'demo' | 'contact';

export type User = { id: string; email: string; name: string; passwordHash: string; createdAt: string; updatedAt: string };
export type WorkspaceUsage = { rfqsCreated: number; quoteDocumentsUploaded: number; aiExtractionRuns: number; teamMembers: number };
export type Workspace = { id: string; name: string; industryCategory: string; teamSize?: string; website?: string; procurementEmail?: string; mainPurchasingWorkflow?: MainPurchasingWorkflow; currentTools: string[]; plan: BillingPlan; subscriptionStatus: SubscriptionStatus; billingCustomerId?: string; usage: WorkspaceUsage; createdAt: string; updatedAt: string };
export type WorkspaceMember = { id: string; workspaceId: string; userId: string; role: Role; createdAt: string };
export type Supplier = { id: string; workspaceId: string; name: string; contactPerson?: string; email?: string; phone?: string; website?: string; category?: string; typicalItems?: string; paymentTerms?: string; notes?: string; status: 'active' | 'inactive'; archivedAt?: string; createdAt: string; updatedAt: string };
export type Rfq = { id: string; workspaceId: string; createdByUserId: string; title: string; description?: string; neededBy?: string; deliveryLocation?: string; internalReference?: string; supplierIds: string[]; emailDraft?: string; status: 'draft' | 'sent' | 'quotes_received' | 'approved' | 'archived'; sentAt?: string; selectedSupplierQuoteId?: string; decisionNotes?: string; recommendationOverridden?: boolean; createdAt: string; updatedAt: string };
export type RfqItem = { id: string; workspaceId: string; rfqId: string; itemName: string; description?: string; quantity: number; unit?: string; requiredDate?: string; notes?: string; createdAt: string };
export type QuoteDocument = { id: string; workspaceId: string; rfqId?: string; supplierId?: string; fileName: string; mimeType: string; byteSize: number; storageKey: string; uploadedByUserId: string; sourceText?: string; createdAt: string };
export type SupplierQuote = { id: string; workspaceId: string; rfqId: string; supplierId: string; quoteDocumentId?: string; status: 'received' | 'parsed' | 'needs_review' | 'accepted' | 'rejected'; extractionStatus?: 'pending' | 'processing' | 'needs_review' | 'approved' | 'failed'; currency: string; confidenceScore?: number; extractedFields?: unknown; reviewedFields?: unknown; createdAt: string; updatedAt: string };
export type QuoteLineItem = { id: string; workspaceId: string; supplierQuoteId: string; rfqItemId?: string; description: string; quantity: number; unitPrice: number; leadTimeDays?: number; sourceDocumentId?: string; sourceExcerpt?: string; confidenceScore?: number; createdAt: string };
export type PurchaseOrderDraft = { id: string; workspaceId: string; rfqId: string; supplierQuoteId: string; status: 'draft_requires_human_approval' | 'approved' | 'exported' | 'void'; createdByUserId: string; subtotal: number; currency: string; createdAt: string; updatedAt: string };
export type AuditLog = { id: string; workspaceId: string; actorUserId?: string; action: string; entityType: string; entityId?: string; metadata: Record<string, unknown>; createdAt: string };
export type AiExtractionRun = { id: string; workspaceId: string; quoteDocumentId: string; status: 'queued' | 'running' | 'needs_review' | 'completed' | 'failed'; modelProvider?: string; confidenceScore?: number; rawAiResponse?: string; errorMessage?: string; createdAt: string; updatedAt: string };
export type Session = { id: string; userId: string; expiresAt: string; createdAt: string };
export type LeadRequest = { id: string; type: LeadType; name: string; workEmail: string; company: string; industry?: string; mainPurchasingWorkflow?: string; estimatedSupplierQuotesPerMonth?: string; currentTools?: string; message?: string; sourcePath?: string; status: 'new' | 'reviewed' | 'closed'; createdAt: string; updatedAt: string };

export type Database = { users: User[]; workspaces: Workspace[]; workspaceMembers: WorkspaceMember[]; suppliers: Supplier[]; rfqs: Rfq[]; rfqItems: RfqItem[]; quoteDocuments: QuoteDocument[]; supplierQuotes: SupplierQuote[]; quoteLineItems: QuoteLineItem[]; purchaseOrderDrafts: PurchaseOrderDraft[]; auditLogs: AuditLog[]; aiExtractionRuns: AiExtractionRun[]; sessions: Session[]; leadRequests: LeadRequest[] };

export const defaultWorkspaceUsage = (): WorkspaceUsage => ({ rfqsCreated: 0, quoteDocumentsUploaded: 0, aiExtractionRuns: 0, teamMembers: 1 });
export const emptyDatabase = (): Database => ({ users: [], workspaces: [], workspaceMembers: [], suppliers: [], rfqs: [], rfqItems: [], quoteDocuments: [], supplierQuotes: [], quoteLineItems: [], purchaseOrderDrafts: [], auditLogs: [], aiExtractionRuns: [], sessions: [], leadRequests: [] });
