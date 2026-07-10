import { ApiError, handleApiError, jsonOk, parseJson } from '@/lib/server/api';
import { canManageWorkspace, requireUser, requireWorkspace } from '@/lib/server/auth';
import { createId, mutateDb, now } from '@/lib/server/db';
import { workspaceSchema, workspaceUpdateSchema } from '@/lib/server/validation';
import { writeAuditLog } from '@/lib/server/audit';

export async function POST(request: Request) {
  try {
    const { user } = await requireUser();
    const input = await parseJson(request, workspaceSchema);
    const workspace = await mutateDb((db) => {
      if (db.workspaceMembers.some((member) => member.userId === user.id)) throw new ApiError(409, 'WORKSPACE_EXISTS', 'This user already belongs to a workspace.');
      const timestamp = now();
      const workspace = { id: createId('wsp'), name: input.companyName, industryCategory: input.industryCategory, teamSize: input.teamSize || undefined, website: input.website || undefined, procurementEmail: input.procurementEmail || undefined, mainPurchasingWorkflow: input.mainPurchasingWorkflow, currentTools: input.currentTools, plan: 'starter' as const, subscriptionStatus: 'not_configured' as const, usage: { rfqsCreated: 0, quoteDocumentsUploaded: 0, aiExtractionRuns: 0, teamMembers: 1 }, createdAt: timestamp, updatedAt: timestamp };
      db.workspaces.push(workspace);
      db.workspaceMembers.push({ id: createId('wmem'), workspaceId: workspace.id, userId: user.id, role: 'owner', title: input.ownerTitle ?? 'Procurement manager', status: 'active', createdAt: timestamp });
      return workspace;
    });
    await writeAuditLog({ workspaceId: workspace.id, actorUserId: user.id, action: 'workspace.created', entityType: 'workspace', entityId: workspace.id });
    return jsonOk({ workspace, next: '/app/dashboard' }, { status: 201 });
  } catch (error) { return handleApiError(error); }
}

// Update the company profile. Owners and admins only. Empty strings clear an
// optional field; only provided keys are touched.
export async function PATCH(request: Request) {
  try {
    const { user, workspace, membership } = await requireWorkspace();
    if (!canManageWorkspace(membership.role)) throw new ApiError(403, 'FORBIDDEN', 'Only owners and admins can edit the company profile.');
    const input = await parseJson(request, workspaceUpdateSchema);
    const clean = <T>(value: T | '' | undefined) => (value === '' || value === undefined ? undefined : value);

    const updated = await mutateDb((db) => {
      const target = db.workspaces.find((w) => w.id === workspace.id);
      if (!target) throw new ApiError(404, 'NOT_FOUND', 'Workspace not found.');
      if (input.name !== undefined) target.name = input.name;
      if (input.industryCategory !== undefined) target.industryCategory = input.industryCategory;
      if (input.mainPurchasingWorkflow !== undefined) target.mainPurchasingWorkflow = input.mainPurchasingWorkflow;
      if (input.currentTools !== undefined) target.currentTools = input.currentTools;
      if (input.teamSize !== undefined) target.teamSize = clean(input.teamSize);
      if (input.website !== undefined) target.website = clean(input.website);
      if (input.procurementEmail !== undefined) target.procurementEmail = clean(input.procurementEmail);
      if (input.country !== undefined) target.country = clean(input.country);
      if (input.currency !== undefined) target.currency = clean(input.currency);
      if (input.annualSpendBand !== undefined) target.annualSpendBand = clean(input.annualSpendBand);
      if (input.supplierCountBand !== undefined) target.supplierCountBand = clean(input.supplierCountBand);
      if (input.taxId !== undefined) target.taxId = clean(input.taxId);
      if (input.approvalThreshold !== undefined) target.approvalThreshold = clean(input.approvalThreshold) as number | undefined;
      if (input.autopilot !== undefined) target.autopilot = input.autopilot;
      target.updatedAt = now();
      return target;
    });

    await writeAuditLog({ workspaceId: workspace.id, actorUserId: user.id, action: 'workspace.updated', entityType: 'workspace', entityId: workspace.id });
    return jsonOk({ workspace: updated });
  } catch (error) { return handleApiError(error); }
}
