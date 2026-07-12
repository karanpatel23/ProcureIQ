import { ApiError, handleApiError, jsonOk, parseJson } from '@/lib/server/api';
import { writeAuditLog } from '@/lib/server/audit';
import { requireWorkspace } from '@/lib/server/auth';
import { createId, mutateDb, now } from '@/lib/server/db';
import { matchSuppliers, parseIntakeSmart } from '@/lib/server/intake';
import { generateRfqEmailDraft } from '@/lib/server/rfq-email';
import { intakeSchema } from '@/lib/server/validation';
import type { Rfq, RfqItem } from '@/lib/server/schema';

// Intake: paste a raw request (email, chat message, one sentence) and AI builds
// the structured RFQ itself — items, quantities, need-by date, delivery, and
// matching suppliers from the directory. Nobody fills in a form. Gaps the
// parser could not find are returned as named items, not silent guesses.
export async function POST(request: Request) {
  try {
    const { user, workspace } = await requireWorkspace(['owner', 'admin', 'member']);
    const input = await parseJson(request, intakeSchema);
    const parsed = await parseIntakeSmart(input.text);
    if (!parsed.items.length) {
      throw new ApiError(422, 'INTAKE_NO_ITEMS', 'Could not find any items with quantities in that text. Include lines like "20 guard brackets" and try again.');
    }

    const result = await mutateDb((db) => {
      const suppliers = matchSuppliers(db, workspace.id, parsed.items);
      const timestamp = now();
      const rfq: Rfq = {
        id: createId('rfq'), workspaceId: workspace.id, createdByUserId: user.id,
        title: parsed.title, description: `Created autonomously from an intake request:\n\n${input.text.slice(0, 1500)}`,
        neededBy: parsed.neededBy, deliveryLocation: parsed.deliveryLocation,
        supplierIds: suppliers.map((s) => s.id), status: 'draft', createdAt: timestamp, updatedAt: timestamp,
      };
      const items: RfqItem[] = parsed.items.map((item) => ({ id: createId('rfi'), workspaceId: workspace.id, rfqId: rfq.id, itemName: item.itemName, quantity: item.quantity, unit: item.unit, createdAt: timestamp }));
      rfq.emailDraft = generateRfqEmailDraft({ rfq, items, suppliers, workspaceName: workspace.name });
      db.rfqs.push(rfq); db.rfqItems.push(...items);
      const w = db.workspaces.find((item) => item.id === workspace.id);
      if (w) w.usage.rfqsCreated = (w.usage.rfqsCreated ?? 0) + 1;
      return { rfq, items, suppliers: suppliers.map((s) => ({ id: s.id, name: s.name })) };
    }, { workspaceId: workspace.id });

    await writeAuditLog({ workspaceId: workspace.id, actorUserId: user.id, action: 'autopilot.intake_rfq_created', entityType: 'rfq', entityId: result.rfq.id, metadata: { items: result.items.length, matchedSuppliers: result.suppliers.length, missing: parsed.missing, parser: parsed.parser } });
    return jsonOk({ rfq: result.rfq, items: result.items, matchedSuppliers: result.suppliers, missing: parsed.missing, next: `/app/rfqs/${result.rfq.id}` }, { status: 201 });
  } catch (error) { return handleApiError(error); }
}
