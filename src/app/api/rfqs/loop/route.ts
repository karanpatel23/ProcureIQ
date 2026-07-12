import { z } from 'zod';
import { handleApiError, jsonOk, parseJson } from '@/lib/server/api';
import { writeAuditLog } from '@/lib/server/audit';
import { requireWorkspace } from '@/lib/server/auth';
import { mutateDb } from '@/lib/server/db';
import { runRfqBuilderLoop } from '@/lib/server/rfq-loop';

const loopSchema = z.object({
  entityId: z.string().optional(),
  maxSteps: z.number().int().min(1).max(10).optional(),
  draft: z.object({
    title: z.string().max(180).optional(),
    description: z.string().max(2000).optional(),
    neededBy: z.string().max(40).optional(),
    deliveryLocation: z.string().max(240).optional(),
    supplierCount: z.number().int().nonnegative().optional(),
    items: z.array(z.object({
      itemName: z.string().max(180).optional(),
      description: z.string().max(1000).optional(),
      quantity: z.coerce.number().optional(),
      unit: z.string().max(40).optional(),
    })).max(50).optional(),
  }),
});

export async function POST(request: Request) {
  try {
    const { user, workspace } = await requireWorkspace(['owner', 'admin', 'member']);
    const input = await parseJson(request, loopSchema);

    const output = runRfqBuilderLoop({
      workspaceId: workspace.id,
      createdByUserId: user.id,
      entityId: input.entityId,
      draft: input.draft,
      maxSteps: input.maxSteps,
    });

    // Persist the full reasoning run so loop state and the trace are durable.
    await mutateDb((db) => { db.workflowRuns.push(output.run); }, { workspaceId: workspace.id });
    await writeAuditLog({
      workspaceId: workspace.id,
      actorUserId: user.id,
      action: 'rfq_loop.completed',
      entityType: 'workflow_run',
      entityId: output.run.id,
      metadata: { score: output.score, readyToSend: output.readyToSend, openItems: output.openItems.length, steps: output.run.step },
    });

    return jsonOk({
      runId: output.run.id,
      status: output.run.status,
      score: output.score,
      readyToSend: output.readyToSend,
      refinedDraft: output.refinedState,
      openItems: output.openItems,
      supplierReadyDraft: output.supplierReadyDraft,
      trace: output.run.steps,
    }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
