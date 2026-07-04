import { createId, mutateDb, now } from './db';

export async function writeAuditLog(input: { workspaceId: string; actorUserId?: string; action: string; entityType: string; entityId?: string; metadata?: Record<string, unknown> }) {
  return mutateDb((db) => {
    const auditLog = { id: createId('aud'), workspaceId: input.workspaceId, actorUserId: input.actorUserId, action: input.action, entityType: input.entityType, entityId: input.entityId, metadata: input.metadata ?? {}, createdAt: now() };
    db.auditLogs.push(auditLog);
    return auditLog;
  });
}
