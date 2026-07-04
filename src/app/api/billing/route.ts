import { handleApiError, jsonOk, parseJson } from '@/lib/server/api';
import { writeAuditLog } from '@/lib/server/audit';
import { requireWorkspace } from '@/lib/server/auth';
import { mutateDb, now } from '@/lib/server/db';
import { env } from '@/lib/server/env';
import { billingPlanSchema } from '@/lib/server/validation';

export async function GET() { try { const { workspace } = await requireWorkspace(); return jsonOk({ plan: workspace.plan, subscriptionStatus: workspace.subscriptionStatus, billingProvider: env.BILLING_PROVIDER, configured: env.BILLING_PROVIDER === 'stripe' && Boolean(env.STRIPE_SECRET_KEY) }); } catch (error) { return handleApiError(error); } }
export async function POST(request: Request) { try { const { user, workspace } = await requireWorkspace(['owner', 'admin']); const input = await parseJson(request, billingPlanSchema); const updated = await mutateDb((db) => { const record = db.workspaces.find((item) => item.id === workspace.id); if (!record) return workspace; record.plan = input.plan; record.subscriptionStatus = env.BILLING_PROVIDER === 'stripe' && env.STRIPE_SECRET_KEY ? 'trialing' : 'not_configured'; record.updatedAt = now(); return record; }); await writeAuditLog({ workspaceId: workspace.id, actorUserId: user.id, action: 'workspace.billing_updated', entityType: 'workspace', entityId: workspace.id, metadata: { plan: input.plan, billingProvider: env.BILLING_PROVIDER } }); return jsonOk({ workspace: updated, billingReady: env.BILLING_PROVIDER === 'stripe' && Boolean(env.STRIPE_SECRET_KEY) }); } catch (error) { return handleApiError(error); } }
