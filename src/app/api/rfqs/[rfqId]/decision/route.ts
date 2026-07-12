import { z } from 'zod';
import { ApiError, handleApiError, jsonOk, parseJson } from '@/lib/server/api';
import { writeAuditLog } from '@/lib/server/audit';
import { requireWorkspace } from '@/lib/server/auth';
import { mutateDb, now } from '@/lib/server/db';

const decisionSchema = z.object({ supplierQuoteId: z.string().min(1), notes: z.string().max(2000).optional().default(''), overrideRecommendation: z.boolean().default(false) });

export async function POST(request: Request, { params }: { params: Promise<{ rfqId: string }> }) {
  try {
    const { user, workspace } = await requireWorkspace(['owner', 'admin', 'member']);
    const { rfqId } = await params;
    const input = await parseJson(request, decisionSchema);
    const rfq = await mutateDb((db) => {
      const rfq = db.rfqs.find((item) => item.id === rfqId && item.workspaceId === workspace.id) as any;
      if (!rfq) throw new ApiError(404, 'RFQ_NOT_FOUND', 'RFQ was not found.');
      const quote = db.supplierQuotes.find((item) => item.id === input.supplierQuoteId && item.rfqId === rfq.id && item.workspaceId === workspace.id);
      if (!quote) throw new ApiError(404, 'QUOTE_NOT_FOUND', 'Supplier quote was not found for this RFQ.');
      rfq.selectedSupplierQuoteId = quote.id;
      rfq.decisionNotes = input.notes;
      rfq.recommendationOverridden = input.overrideRecommendation;
      rfq.updatedAt = now();
      return rfq;
    }, { workspaceId: workspace.id });
    await writeAuditLog({ workspaceId: workspace.id, actorUserId: user.id, action: 'supplier_quote.selected', entityType: 'rfq', entityId: rfq.id, metadata: { supplierQuoteId: input.supplierQuoteId } });
    if (input.notes) await writeAuditLog({ workspaceId: workspace.id, actorUserId: user.id, action: 'decision_note.added', entityType: 'rfq', entityId: rfq.id });
    if (input.overrideRecommendation) await writeAuditLog({ workspaceId: workspace.id, actorUserId: user.id, action: 'recommendation.overridden', entityType: 'rfq', entityId: rfq.id });
    return jsonOk({ rfq });
  } catch (error) { return handleApiError(error); }
}
