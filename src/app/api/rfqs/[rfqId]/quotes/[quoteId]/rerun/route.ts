import { ApiError, handleApiError, jsonOk } from '@/lib/server/api';
import { writeAuditLog } from '@/lib/server/audit';
import { requireWorkspace } from '@/lib/server/auth';
import { mutateDb, now, readDb } from '@/lib/server/db';
import { runQuoteExtraction } from '@/lib/server/quote-extraction';

export async function POST(_: Request, { params }: { params: Promise<{ rfqId: string; quoteId: string }> }) {
  try {
    const { user, workspace } = await requireWorkspace(['owner', 'admin', 'member']);
    const { rfqId, quoteId } = await params;
    const current = await readDb();
    const quote = current.supplierQuotes.find((item) => item.id === quoteId && item.rfqId === rfqId && item.workspaceId === workspace.id) as any;
    if (!quote) throw new ApiError(404, 'QUOTE_NOT_FOUND', 'Supplier quote was not found.');
    const document = current.quoteDocuments.find((item) => item.id === quote.quoteDocumentId && item.workspaceId === workspace.id) as any;
    const extraction = runQuoteExtraction(document?.sourceText ?? '', current.suppliers.find((supplier) => supplier.id === quote.supplierId)?.name);
    const updated = await mutateDb((db) => { const quote = db.supplierQuotes.find((item) => item.id === quoteId && item.rfqId === rfqId && item.workspaceId === workspace.id) as any; if (!quote) throw new ApiError(404, 'QUOTE_NOT_FOUND', 'Supplier quote was not found.'); quote.extractedFields = extraction.parsed; quote.status = 'needs_review'; quote.extractionStatus = 'needs_review'; quote.confidenceScore = extraction.parsed.quoteConfidence; quote.updatedAt = now(); return quote; });
    await writeAuditLog({ workspaceId: workspace.id, actorUserId: user.id, action: 'quote.extraction_started', entityType: 'supplier_quote', entityId: quoteId, metadata: { rerun: true } });
    return jsonOk({ quote: updated });
  } catch (error) { return handleApiError(error); }
}
