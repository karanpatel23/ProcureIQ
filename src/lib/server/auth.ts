import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ApiError } from './api';
import { createId, mutateDb, now, readDb } from './db';
import { env } from './env';
import type { Role, User, Workspace } from './schema';

const SESSION_COOKIE = 'procureiq_session';
const SESSION_DAYS = 14;
const roles: Role[] = ['owner', 'admin', 'member', 'viewer'];

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, 'hex');
  return expected.length === candidate.length && timingSafeEqual(expected, candidate);
}

function signSession(sessionId: string) {
  const signature = createHmac('sha256', env.AUTH_SECRET).update(sessionId).digest('hex');
  return `${sessionId}.${signature}`;
}
function verifySessionCookie(value?: string) {
  const [sessionId, signature] = value?.split('.') ?? [];
  if (!sessionId || !signature) return null;
  const expected = createHmac('sha256', env.AUTH_SECRET).update(sessionId).digest('hex');
  const provided = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (provided.length !== expectedBuffer.length) return null;
  return timingSafeEqual(provided, expectedBuffer) ? sessionId : null;
}

export async function createSession(userId: string) {
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const session = await mutateDb((db) => {
    const session = { id: createId('ses'), userId, expiresAt, createdAt: now() };
    db.sessions.push(session);
    return session;
  });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, signSession(session.id), { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', expires: new Date(expiresAt) });
  return session;
}

export async function clearSession() {
  const cookieStore = await cookies();
  const sessionId = verifySessionCookie(cookieStore.get(SESSION_COOKIE)?.value);
  if (sessionId) await mutateDb((db) => { db.sessions = db.sessions.filter((session) => session.id !== sessionId); });
  cookieStore.delete(SESSION_COOKIE);
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const sessionId = verifySessionCookie(cookieStore.get(SESSION_COOKIE)?.value);
  if (!sessionId) return null;
  const db = await readDb();
  const session = db.sessions.find((item) => item.id === sessionId && new Date(item.expiresAt) > new Date());
  if (!session) return null;
  const user = db.users.find((item) => item.id === session.userId) ?? null;
  return user ? { user, session } : null;
}

export async function requireUser() {
  const current = await getCurrentUser();
  if (!current) throw new ApiError(401, 'UNAUTHENTICATED', 'Authentication is required.');
  return current;
}

export async function requirePageUser() {
  const current = await getCurrentUser();
  if (!current) { redirect('/login'); throw new Error('Redirecting to login'); }
  return current;
}

export async function getPrimaryWorkspace(userId: string) {
  const db = await readDb();
  const membership = db.workspaceMembers.find((item) => item.userId === userId);
  if (!membership) return null;
  const workspace = db.workspaces.find((item) => item.id === membership.workspaceId) ?? null;
  return workspace ? { workspace, membership } : null;
}

export async function requireWorkspace(requiredRoles: Role[] = roles) {
  const { user } = await requireUser();
  const workspaceContext = await getPrimaryWorkspace(user.id);
  if (!workspaceContext) throw new ApiError(403, 'WORKSPACE_REQUIRED', 'Create or join a workspace before continuing.');
  if (!requiredRoles.includes(workspaceContext.membership.role)) throw new ApiError(403, 'FORBIDDEN', 'You do not have access to this workspace action.');
  return { user, ...workspaceContext };
}

export async function requirePageWorkspace() {
  const { user } = await requirePageUser();
  const workspaceContext = await getPrimaryWorkspace(user.id);
  if (!workspaceContext) { redirect('/onboarding'); throw new Error('Redirecting to onboarding'); }
  return { user, workspace: workspaceContext.workspace, membership: workspaceContext.membership };
}

export function safeUser(user: User) { return { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt }; }
export function canManageWorkspace(role: Role) { return role === 'owner' || role === 'admin'; }
export type WorkspaceContext = { user: User; workspace: Workspace; membership: { role: Role } };
