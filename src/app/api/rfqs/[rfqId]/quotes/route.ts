import { ApiError, handleApiError, jsonOk } from '@/lib/server/api';
import { writeAuditLog } from '@/lib/server/audit';
import { requireWorkspace } from '@/lib/server/auth';
import { createId, mutateDb, now, readDb } from '@/lib/server/db';
import { runQuoteExtraction } from '@/lib/server/quote-extraction';
import { storeQuoteSource } from '@/lib/server/storage';

export async function POST(request: Request, { params }: { params: Promise<{ rfqId: string }> }) {
  try {
    const { user, workspace } = await requireWorkspace(['owner', 'admin', 'member']);
    const { rfqId } = await params;
    const db = await readDb();
    const rfq = db.rfqs.find((item) => item.id === rfqId && item.workspaceId === workspace.id);
    if (!rfq) throw new ApiError(404, 'RFQ_NOT_FOUND', 'RFQ was not found.');
    const form = await request.formData();
    const supplierId = String(form.get('supplierId') ?? '');
    const sourceType = String(form.get('sourceType') ?? 'paste');
    const supplier = db.suppliers.find((item) => item.id === supplierId && item.workspaceId === workspace.id && !item.archivedAt);
    if (!supplier) throw new ApiError(400, 'SUPPLIER_REQUIRED', 'Select a supplier for this quote.');
    const fileValue = form.get('file');
    const file = sourceType === 'upload' && fileValue instanceof File && fileValue.size > 0 ? fileValue : undefined;
    const pastedText = sourceType === 'manual' ? `Manual quote entry for ${supplier.name}. ${String(form.get('manualNotes') ?? '')}` : String(form.get('pastedText') ?? '');
    const stored = await storeQuoteSource({ workspaceId: workspace.id, file, pastedText });
    const extraction = await runQuoteExtraction(stored.sourceText, supplier.name);
    const result = await mutateDb((draft) => {
      const timestamp = now();
      const document = { id: createId('qdoc'), workspaceId: workspace.id, rfqId, supplierId, fileName: stored.fileName, mimeType: stored.mimeType, byteSize: stored.byteSize, storageKey: stored.storageKey, uploadedByUserId: user.id, sourceText: stored.sourceText, createdAt: timestamp } as any;
      const run = { id: createId('airun'), workspaceId: workspace.id, quoteDocumentId: document.id, status: 'needs_review' as const, modelProvider: `procureiq-${extraction.provider}-extractor`, confidenceScore: extraction.parsed.quoteConfidence, rawAiResponse: extraction.rawAiResponse, createdAt: timestamp, updatedAt: timestamp } as any;
      const quote = { id: createId('squote'), workspaceId: workspace.id, rfqId, supplierId, quoteDocumentId: document.id, status: 'needs_review' as const, currency: extraction.parsed.currency.value ?? 'USD', confidenceScore: extraction.parsed.quoteConfidence, extractedFields: extraction.parsed, createdAt: timestamp, updatedAt: timestamp } as any;
      draft.quoteDocuments.push(document); draft.aiExtractionRuns.push(run); draft.supplierQuotes.push(quote); const w = draft.workspaces.find((item) => item.id === workspace.id) as any; if (w) w.usage = { rfqsCreated: w.usage?.rfqsCreated ?? draft.rfqs.filter((rfq) => rfq.workspaceId === workspace.id).length, quoteDocumentsUploaded: (w.usage?.quoteDocumentsUploaded ?? 0) + 1, aiExtractionRuns: (w.usage?.aiExtractionRuns ?? 0) + 1, teamMembers: draft.workspaceMembers.filter((member) => member.workspaceId === workspace.id).length };
      return { document, run, quote };
    });
    await writeAuditLog({ workspaceId: workspace.id, actorUserId: user.id, action: 'quote.uploaded', entityType: 'quote_document', entityId: result.document.id });
    await writeAuditLog({ workspaceId: workspace.id, actorUserId: user.id, action: 'quote.extraction_started', entityType: 'ai_extraction_run', entityId: result.run.id, metadata: { status: result.run.status } });
    return jsonOk({ quote: result.quote, next: `/app/rfqs/${rfqId}/quotes/${result.quote.id}/review` }, { status: 201 });
  } catch (error) { return handleApiError(error); }
}
