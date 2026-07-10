import { ApiError, handleApiError, jsonOk } from '@/lib/server/api';
import { writeAuditLog } from '@/lib/server/audit';
import { requireWorkspace } from '@/lib/server/auth';
import { runAutopilotForRfq } from '@/lib/server/autopilot';
import { createId, mutateDb, now } from '@/lib/server/db';

export async function POST(request: Request, { params }: { params: Promise<{ rfqId: string; quoteId: string }> }) {
  try {
    const { user, workspace } = await requireWorkspace(['owner', 'admin', 'member']);
    const { rfqId, quoteId } = await params;
    const body = await request.json();
    const approve = Boolean(body.approve);
    const quote = await mutateDb((db) => {
      const quote = db.supplierQuotes.find((item) => item.id === quoteId && item.rfqId === rfqId && item.workspaceId === workspace.id) as any;
      if (!quote) throw new ApiError(404, 'QUOTE_NOT_FOUND', 'Supplier quote was not found.');
      quote.reviewedFields = body.fields;
      quote.status = approve ? 'accepted' : 'needs_review';
      quote.extractionStatus = approve ? 'approved' : 'needs_review';
      quote.currency = body.fields?.currency?.value || quote.currency || 'USD';
      quote.confidenceScore = Number(body.fields?.quoteConfidence ?? quote.confidenceScore ?? 0);
      quote.updatedAt = now();
      db.quoteLineItems = db.quoteLineItems.filter((line) => !(line.supplierQuoteId === quote.id && line.workspaceId === workspace.id));
      for (const line of body.fields?.lineItems ?? []) {
        db.quoteLineItems.push({ id: createId('qli'), workspaceId: workspace.id, supplierQuoteId: quote.id, description: line.description?.value || line.itemName?.value || 'Quote line item', quantity: Number(line.quantity?.value ?? 1), unitPrice: Number(line.unitPrice?.value ?? 0), leadTimeDays: undefined, sourceDocumentId: quote.quoteDocumentId, sourceExcerpt: line.description?.source || undefined, confidenceScore: Math.round(((line.itemName?.confidence ?? 0) + (line.unitPrice?.confidence ?? 0)) / 2), itemName: line.itemName?.value, unit: line.unit?.value, extendedPrice: Number(line.extendedPrice?.value ?? 0), alternatives: line.alternatives?.value, notes: line.notes?.value, createdAt: now() } as any);
      }
      return quote;
    });
    await writeAuditLog({ workspaceId: workspace.id, actorUserId: user.id, action: approve ? 'quote.approved' : 'quote.review_saved', entityType: 'supplier_quote', entityId: quote.id });
    // A human just cleared an exception — let autopilot carry the chain forward
    // (comparison → decision → PO) if the workspace runs exceptions-only mode.
    let autopilot;
    if (approve) {
      autopilot = await runAutopilotForRfq({ workspaceId: workspace.id, rfqId, actorUserId: user.id });
      for (const action of autopilot.actions) await writeAuditLog({ workspaceId: workspace.id, actorUserId: user.id, action: action.action, entityType: action.entityType, entityId: action.entityId, metadata: { summary: action.summary, ...action.metadata } });
    }
    return jsonOk({ quote, autopilot: autopilot?.enabled ? autopilot : undefined });
  } catch (error) { return handleApiError(error); }
}
