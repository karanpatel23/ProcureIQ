import { ApiError, handleApiError, jsonOk } from '@/lib/server/api';
import { writeAuditLog } from '@/lib/server/audit';
import { requireWorkspace } from '@/lib/server/auth';
import { createId, mutateDb, now, readDb } from '@/lib/server/db';
import { extractQuote } from '@/lib/server/quote-extraction';
import { runAutopilotForRfq } from '@/lib/server/autopilot';
import { storeQuoteSource } from '@/lib/server/storage';

export async function POST(request: Request, { params }: { params: Promise<{ rfqId: string }> }) {
  try {
    const { user, workspace } = await requireWorkspace(['owner', 'admin', 'member']);
    const { rfqId } = await params;
    const db = await readDb({ workspaceId: workspace.id });
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
    // Honest extraction gate: automatic parsing works on text sources today.
    // A PDF/image/spreadsheet is stored as the attachment and queued for a
    // human to paste/enter the figures — never "extracted" from a filename.
    const extraction = stored.textExtracted
      ? await extractQuote(stored.sourceText, supplier.name)
      : { parsed: { supplierName: { value: supplier.name, confidence: 90 }, currency: { value: 'USD', confidence: 20 }, quoteConfidence: 0, lineItems: [], notes: { value: `Attachment stored (${stored.fileName}). Automatic extraction currently reads pasted or text quotes — open review and paste the quote text, or enter the figures manually.`, confidence: 90 } } as any, rawAiResponse: 'extraction skipped: non-text attachment', modelProvider: 'none' };
    const result = await mutateDb((draft) => {
      const timestamp = now();
      const document = { id: createId('qdoc'), workspaceId: workspace.id, rfqId, supplierId, fileName: stored.fileName, mimeType: stored.mimeType, byteSize: stored.byteSize, storageKey: stored.storageKey, uploadedByUserId: user.id, sourceText: stored.sourceText, createdAt: timestamp } as any;
      const run = { id: createId('airun'), workspaceId: workspace.id, quoteDocumentId: document.id, status: (stored.textExtracted ? 'needs_review' : 'failed') as any, modelProvider: (extraction as any).modelProvider ?? 'procureiq-local-extractor', confidenceScore: extraction.parsed.quoteConfidence, rawAiResponse: extraction.rawAiResponse, errorMessage: stored.textExtracted ? undefined : 'Non-text attachment — automatic extraction skipped; manual entry required.', createdAt: timestamp, updatedAt: timestamp } as any;
      const quote = { id: createId('squote'), workspaceId: workspace.id, rfqId, supplierId, quoteDocumentId: document.id, status: 'needs_review' as const, currency: extraction.parsed.currency.value ?? 'USD', confidenceScore: extraction.parsed.quoteConfidence, extractedFields: extraction.parsed, createdAt: timestamp, updatedAt: timestamp } as any;
      draft.quoteDocuments.push(document); draft.aiExtractionRuns.push(run); draft.supplierQuotes.push(quote); const w = draft.workspaces.find((item) => item.id === workspace.id) as any; if (w) w.usage = { rfqsCreated: w.usage?.rfqsCreated ?? draft.rfqs.filter((rfq) => rfq.workspaceId === workspace.id).length, quoteDocumentsUploaded: (w.usage?.quoteDocumentsUploaded ?? 0) + 1, aiExtractionRuns: (w.usage?.aiExtractionRuns ?? 0) + 1, teamMembers: draft.workspaceMembers.filter((member) => member.workspaceId === workspace.id).length };
      return { document, run, quote };
    }, { workspaceId: workspace.id });
    await writeAuditLog({ workspaceId: workspace.id, actorUserId: user.id, action: 'quote.uploaded', entityType: 'quote_document', entityId: result.document.id });
    await writeAuditLog({ workspaceId: workspace.id, actorUserId: user.id, action: 'quote.extraction_started', entityType: 'ai_extraction_run', entityId: result.run.id, metadata: { status: result.run.status, modelProvider: (extraction as any).modelProvider } });
    // Fail LOUDLY when Claude was expected but the local fallback ran: a
    // first-class audit event, not a buried log line.
    if (String((extraction as any).modelProvider ?? '').includes('fallback')) {
      await writeAuditLog({ workspaceId: workspace.id, actorUserId: user.id, action: 'extraction.fallback', entityType: 'ai_extraction_run', entityId: result.run.id, metadata: { summary: 'Claude extraction failed or was unreachable — the deterministic local parser handled this quote. Check /api/health/integrations.' } });
    }

    // Autopilot: self-verify, accept, compare, decide, and draft the PO — as far
    // as policy allows — with no human action. Halts become queued exceptions.
    const autopilot = await runAutopilotForRfq({ workspaceId: workspace.id, rfqId, actorUserId: user.id });
    for (const action of autopilot.actions) await writeAuditLog({ workspaceId: workspace.id, actorUserId: user.id, action: action.action, entityType: action.entityType, entityId: action.entityId, metadata: { summary: action.summary, ...action.metadata } });

    const next = autopilot.enabled && autopilot.next ? autopilot.next : `/app/rfqs/${rfqId}/quotes/${result.quote.id}/review`;
    return jsonOk({ quote: result.quote, autopilot: autopilot.enabled ? autopilot : undefined, next }, { status: 201 });
  } catch (error) { return handleApiError(error); }
}
