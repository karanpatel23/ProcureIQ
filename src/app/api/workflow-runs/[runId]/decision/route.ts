import { z } from 'zod';
import { ApiError, handleApiError, jsonOk, parseJson } from '@/lib/server/api';
import { writeAuditLog } from '@/lib/server/audit';
import { requireWorkspace } from '@/lib/server/auth';
import { mutateDb, now } from '@/lib/server/db';
import type { WorkflowRunStatus } from '@/lib/server/schema';

const decisionSchema = z.object({
  action: z.enum(['approve', 'reject', 'edit', 'regenerate']),
  notes: z.string().max(2000).optional(),
});

const NEXT_STATUS: Record<z.infer<typeof decisionSchema>['action'], WorkflowRunStatus> = {
  approve: 'approved',
  reject: 'rejected',
  edit: 'awaiting_approval',
  regenerate: 'awaiting_approval',
};

// Generic human checkpoint for any bounded workflow run (rfq_builder,
// quote_ingestion, quote_comparison, …). A loop never finalizes itself; only a
// person moves it out of awaiting_approval, and the decision is audit-logged.
export async function POST(request: Request, { params }: { params: Promise<{ runId: string }> }) {
  try {
    const { user, workspace } = await requireWorkspace(['owner', 'admin', 'member']);
    const { runId } = await params;
    const input = await parseJson(request, decisionSchema);

    const run = await mutateDb((db) => {
      const target = db.workflowRuns.find((item) => item.id === runId && item.workspaceId === workspace.id);
      if (!target) throw new ApiError(404, 'RUN_NOT_FOUND', 'Workflow run was not found.');
      if (target.status === 'approved' || target.status === 'rejected') {
        throw new ApiError(409, 'RUN_ALREADY_DECIDED', 'This workflow run has already been decided.');
      }
      target.status = NEXT_STATUS[input.action];
      target.decision = { action: input.action, byUserId: user.id, notes: input.notes, at: now() };
      target.updatedAt = now();
      return target;
    }, { workspaceId: workspace.id });

    await writeAuditLog({
      workspaceId: workspace.id,
      actorUserId: user.id,
      action: `${run.type}.${input.action}`,
      entityType: 'workflow_run',
      entityId: run.id,
      metadata: { status: run.status, notes: input.notes ?? '' },
    });

    return jsonOk({ runId: run.id, type: run.type, status: run.status, decision: run.decision });
  } catch (error) {
    return handleApiError(error);
  }
}
