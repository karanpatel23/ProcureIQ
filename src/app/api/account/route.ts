import { ApiError, handleApiError, jsonOk, parseJson } from '@/lib/server/api';
import { clearSession, requireUser } from '@/lib/server/auth';
import { mutateDb } from '@/lib/server/db';
import { deleteAccountSchema } from '@/lib/server/validation';

// Permanently deletes the signed-in user's account. To confirm intent the caller
// must echo their own email address. Workspaces the user solely owns are removed
// along with all of their data; if an owned workspace still has other members,
// deletion is blocked until ownership is transferred or the members are removed,
// so a teammate is never silently locked out of shared data.
export async function DELETE(request: Request) {
  try {
    const { user } = await requireUser();
    const { confirm } = await parseJson(request, deleteAccountSchema);
    if (confirm.trim().toLowerCase() !== user.email.toLowerCase()) {
      throw new ApiError(400, 'CONFIRM_MISMATCH', 'Type your account email exactly to confirm deletion.');
    }

    await mutateDb((db) => {
      const myMemberships = db.workspaceMembers.filter((m) => m.userId === user.id);
      const ownedWorkspaceIds = myMemberships.filter((m) => m.role === 'owner').map((m) => m.workspaceId);

      // Block if any owned workspace still has another real (account-backed) member.
      for (const workspaceId of ownedWorkspaceIds) {
        const otherRealMembers = db.workspaceMembers.some((m) => m.workspaceId === workspaceId && m.userId && m.userId !== user.id);
        if (otherRealMembers) {
          throw new ApiError(409, 'OWNERSHIP_TRANSFER_REQUIRED', 'You still own a workspace with other members. Transfer ownership or remove the other members before deleting your account.');
        }
      }

      // Cascade-delete every entity scoped to the sole-owned workspaces.
      const drop = new Set(ownedWorkspaceIds);
      if (drop.size) {
        db.workspaces = db.workspaces.filter((w) => !drop.has(w.id));
        db.workspaceMembers = db.workspaceMembers.filter((m) => !drop.has(m.workspaceId));
        db.suppliers = db.suppliers.filter((s) => !drop.has(s.workspaceId));
        db.rfqs = db.rfqs.filter((r) => !drop.has(r.workspaceId));
        db.rfqItems = db.rfqItems.filter((r) => !drop.has(r.workspaceId));
        db.quoteDocuments = db.quoteDocuments.filter((q) => !drop.has(q.workspaceId));
        db.supplierQuotes = db.supplierQuotes.filter((q) => !drop.has(q.workspaceId));
        db.quoteLineItems = db.quoteLineItems.filter((q) => !drop.has(q.workspaceId));
        db.purchaseOrderDrafts = db.purchaseOrderDrafts.filter((p) => !drop.has(p.workspaceId));
        db.auditLogs = db.auditLogs.filter((a) => !drop.has(a.workspaceId));
        db.aiExtractionRuns = db.aiExtractionRuns.filter((a) => !drop.has(a.workspaceId));
        db.workflowRuns = db.workflowRuns.filter((w) => !drop.has(w.workspaceId));
      }

      // Remove the user's remaining links, credentials, sessions, and record.
      db.workspaceMembers = db.workspaceMembers.filter((m) => m.userId !== user.id);
      db.oauthAccounts = db.oauthAccounts.filter((a) => a.userId !== user.id);
      db.sessions = db.sessions.filter((s) => s.userId !== user.id);
      db.users = db.users.filter((u) => u.id !== user.id);
    });

    await clearSession();
    return jsonOk({ deleted: true });
  } catch (error) { return handleApiError(error); }
}
