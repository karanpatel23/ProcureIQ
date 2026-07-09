export type Role = 'owner' | 'admin' | 'member' | 'viewer';
export type MainPurchasingWorkflow = 'materials' | 'parts' | 'equipment' | 'subcontractors' | 'packaging' | 'services' | 'other';
export type BillingPlan = 'starter' | 'growth' | 'pro' | 'enterprise';
export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'paused' | 'cancelled' | 'not_configured';
export type LeadType = 'demo' | 'contact';

// passwordHash is '' for accounts created purely through an OAuth provider
// (they authenticate with Google/Microsoft, not a password). resetToken powers
// the forgot-password flow and mirrors the verification-token mechanism.
export type User = { id: string; email: string; name: string; passwordHash: string; emailVerified?: boolean; verificationToken?: string; verificationTokenExpiresAt?: string; resetToken?: string; resetTokenExpiresAt?: string; createdAt: string; updatedAt: string };
// Links a user to an external identity provider. Present so Google and Microsoft
// sign-in can be enabled by setting credentials — the architecture is in place.
export type OAuthProvider = 'google' | 'microsoft';
export type OAuthAccount = { id: string; userId: string; provider: OAuthProvider; providerAccountId: string; email: string; createdAt: string };
export type WorkspaceUsage = { rfqsCreated: number; quoteDocumentsUploaded: number; aiExtractionRuns: number; teamMembers: number };
// Company profile. Core fields are captured at onboarding; the enrichment
// fields (country, currency, spend/supplier bands, tax id, approval threshold)
// are what leading procurement platforms collect to tailor workflows, and are
// filled in progressively from Company settings.
export type Workspace = { id: string; name: string; industryCategory: string; teamSize?: string; website?: string; procurementEmail?: string; mainPurchasingWorkflow?: MainPurchasingWorkflow; currentTools: string[]; country?: string; currency?: string; annualSpendBand?: string; supplierCountBand?: string; taxId?: string; approvalThreshold?: number; plan: BillingPlan; subscriptionStatus: SubscriptionStatus; billingCustomerId?: string; usage: WorkspaceUsage; createdAt: string; updatedAt: string };
// A member links a person to a workspace. `role` governs permissions
// (owner/admin/member/viewer); `title` is their job persona (e.g. "Procurement
// manager"). Invited members exist before the person signs up: userId is empty
// and status is 'invited' until an account with invitedEmail joins.
export type WorkspacePersona = 'Procurement manager' | 'Finance approver' | 'Operations' | 'Admin' | 'Supplier manager' | 'Approver' | 'Viewer' | 'Other';
export type WorkspaceMember = { id: string; workspaceId: string; userId: string; role: Role; title?: WorkspacePersona; invitedEmail?: string; invitedName?: string; status?: 'active' | 'invited'; createdAt: string };
// `preferred` marks an approved/preferred vendor; the purchasing policy flags
// decisions that pick a non-preferred supplier (only once any supplier is marked).
export type Supplier = { id: string; workspaceId: string; name: string; contactPerson?: string; email?: string; phone?: string; website?: string; category?: string; typicalItems?: string; paymentTerms?: string; notes?: string; status: 'active' | 'inactive'; preferred?: boolean; archivedAt?: string; createdAt: string; updatedAt: string };
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

// Bounded AI workflow loops. A run captures the full reasoning trace, the
// working state, the open items a human must resolve, and the human decision —
// so every AI action is traceable and no external action happens without approval.
export type WorkflowType = 'rfq_builder' | 'supplier_selection' | 'quote_ingestion' | 'quote_comparison' | 'approval' | 'po_generation';
export type WorkflowPhase = 'understand' | 'draft' | 'self_review' | 'refine' | 'await_approval' | 'finalize' | 'fallback';
export type WorkflowRunStatus = 'running' | 'awaiting_approval' | 'approved' | 'rejected' | 'failed';
export type WorkflowStep = { index: number; phase: WorkflowPhase; summary: string; confidence?: number; missingFields?: string[]; changed?: string[]; at: string };
export type WorkflowDecision = { action: 'approve' | 'reject' | 'edit' | 'regenerate'; byUserId?: string; notes?: string; at: string };
export type WorkflowRun = { id: string; workspaceId: string; type: WorkflowType; entityId?: string; status: WorkflowRunStatus; step: number; maxSteps: number; score?: number; state: unknown; steps: WorkflowStep[]; openItems: string[]; createdByUserId?: string; decision?: WorkflowDecision; createdAt: string; updatedAt: string };

export type Database = { users: User[]; oauthAccounts: OAuthAccount[]; workspaces: Workspace[]; workspaceMembers: WorkspaceMember[]; suppliers: Supplier[]; rfqs: Rfq[]; rfqItems: RfqItem[]; quoteDocuments: QuoteDocument[]; supplierQuotes: SupplierQuote[]; quoteLineItems: QuoteLineItem[]; purchaseOrderDrafts: PurchaseOrderDraft[]; auditLogs: AuditLog[]; aiExtractionRuns: AiExtractionRun[]; sessions: Session[]; leadRequests: LeadRequest[]; workflowRuns: WorkflowRun[] };

export const defaultWorkspaceUsage = (): WorkspaceUsage => ({ rfqsCreated: 0, quoteDocumentsUploaded: 0, aiExtractionRuns: 0, teamMembers: 1 });
export const emptyDatabase = (): Database => ({ users: [], oauthAccounts: [], workspaces: [], workspaceMembers: [], suppliers: [], rfqs: [], rfqItems: [], quoteDocuments: [], supplierQuotes: [], quoteLineItems: [], purchaseOrderDrafts: [], auditLogs: [], aiExtractionRuns: [], sessions: [], leadRequests: [], workflowRuns: [] });
