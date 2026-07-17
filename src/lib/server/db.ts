import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import { dirname } from 'node:path';
import { Pool, type PoolClient } from 'pg';
import { env } from './env';
import { defaultWorkspaceUsage, emptyDatabase, type Database } from './schema';

/*
 * Storage backends.
 *
 * Postgres layout (v2 — sharded): tenant data no longer lives in one shared
 * row. `procureiq_global` holds account-level data (users, sessions, oauth,
 * leads); `procureiq_ws` holds one row PER WORKSPACE with everything scoped to
 * it. Result: a workspace mutation locks only that workspace's row — tenants
 * no longer serialize behind a single global lock, reads on hot paths load one
 * tenant instead of the universe, and tenant separation is physical rows, not
 * just application-level filters. Legacy single-row `procureiq_state` data is
 * migrated automatically on first boot (the old row is left in place as a
 * backup, never read again).
 *
 * API contract: `readDb()` / `mutateDb(fn)` keep their original signatures.
 * Pass `{ workspaceId }` as the optional scope to get the per-workspace fast
 * path. Scoped mutations persist ONLY that workspace's slice — they must not
 * modify users/sessions/oauth/leads (auth flows stay unscoped, which locks
 * global + all workspace rows and preserves the original all-or-nothing
 * semantics for the rare cross-cutting operations like account deletion).
 *
 * The local JSON-file adapter (demo/dev) is unchanged: one file, scope ignored.
 */
export type DbScope = { workspaceId: string };

const usePostgres = Boolean(env.DATABASE_URL);
const GLOBAL_ID = 1;
const GLOBAL_KEYS = ['users', 'sessions', 'oauthAccounts', 'leadRequests'] as const;
const WS_KEYS = ['workspaces', 'workspaceMembers', 'suppliers', 'rfqs', 'rfqItems', 'quoteDocuments', 'supplierQuotes', 'quoteLineItems', 'purchaseOrderDrafts', 'auditLogs', 'aiExtractionRuns', 'workflowRuns'] as const;

let fileWriteQueue = Promise.resolve();
let pool: Pool | null = null;
let schemaReady: Promise<void> | null = null;

function getPool(): Pool {
  if (!pool) {
    const url = env.DATABASE_URL as string;
    const isLocal = /@(localhost|127\.0\.0\.1|\[::1\])/.test(url);
    pool = new Pool({
      connectionString: url,
      // Managed Postgres (Supabase/Neon/Vercel) requires TLS; local dev does not.
      ssl: isLocal ? undefined : { rejectUnauthorized: false },
      max: 5,
      connectionTimeoutMillis: 10_000,
      idleTimeoutMillis: 30_000,
    });
    pool.on('error', (error) => {
      console.error(JSON.stringify({ level: 'error', event: 'pg.pool_error', message: error.message }));
    });
  }
  return pool;
}

function emptyGlobalSlice(): Pick<Database, (typeof GLOBAL_KEYS)[number]> {
  return { users: [], sessions: [], oauthAccounts: [], leadRequests: [] };
}

function workspaceSlice(db: Database, workspaceId: string) {
  return {
    workspaces: db.workspaces.filter((w) => w.id === workspaceId),
    workspaceMembers: db.workspaceMembers.filter((m) => m.workspaceId === workspaceId),
    suppliers: db.suppliers.filter((s) => s.workspaceId === workspaceId),
    rfqs: db.rfqs.filter((r) => r.workspaceId === workspaceId),
    rfqItems: db.rfqItems.filter((r) => r.workspaceId === workspaceId),
    quoteDocuments: db.quoteDocuments.filter((q) => q.workspaceId === workspaceId),
    supplierQuotes: db.supplierQuotes.filter((q) => q.workspaceId === workspaceId),
    quoteLineItems: db.quoteLineItems.filter((q) => q.workspaceId === workspaceId),
    purchaseOrderDrafts: db.purchaseOrderDrafts.filter((p) => p.workspaceId === workspaceId),
    auditLogs: db.auditLogs.filter((a) => a.workspaceId === workspaceId),
    aiExtractionRuns: db.aiExtractionRuns.filter((a) => a.workspaceId === workspaceId),
    workflowRuns: db.workflowRuns.filter((w) => w.workspaceId === workspaceId),
  };
}

function assemble(globalSlice: Record<string, unknown>, wsSlices: Array<Record<string, unknown>>): Database {
  const db = { ...emptyDatabase(), ...emptyGlobalSlice(), ...globalSlice } as Database;
  for (const key of WS_KEYS) (db as any)[key] = wsSlices.flatMap((slice) => (slice[key] as unknown[]) ?? []);
  return normalizeDatabase(db);
}

function ensureSchema(): Promise<void> {
  schemaReady ??= (async () => {
    const client = getPool();
    await client.query('CREATE TABLE IF NOT EXISTS procureiq_global (id integer PRIMARY KEY CHECK (id = 1), data jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now())');
    await client.query('CREATE TABLE IF NOT EXISTS procureiq_ws (id text PRIMARY KEY, data jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now())');
    await client.query('CREATE INDEX IF NOT EXISTS procureiq_ws_members ON procureiq_ws USING gin ((data->\'workspaceMembers\') jsonb_path_ops)');
    await migrateLegacyState();
  })().catch((error) => {
    schemaReady = null; // allow a later retry rather than caching the failure
    throw error;
  });
  return schemaReady;
}

/** One-time migration: split the old single-row store into global + per-workspace rows. */
async function migrateLegacyState(): Promise<void> {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const existing = await client.query('SELECT 1 FROM procureiq_global WHERE id = $1', [GLOBAL_ID]);
    if (existing.rows[0]) { await client.query('COMMIT'); return; }
    const legacyTable = await client.query("SELECT to_regclass('procureiq_state') AS t");
    let db = { ...emptyDatabase() };
    if (legacyTable.rows[0]?.t) {
      const legacy = await client.query('SELECT data FROM procureiq_state WHERE id = 1 FOR UPDATE');
      if (legacy.rows[0]) db = normalizeDatabase({ ...emptyDatabase(), ...legacy.rows[0].data });
    }
    const globalSlice = Object.fromEntries(GLOBAL_KEYS.map((key) => [key, db[key]]));
    await client.query('INSERT INTO procureiq_global (id, data) VALUES ($1, $2::jsonb) ON CONFLICT (id) DO NOTHING', [GLOBAL_ID, JSON.stringify(globalSlice)]);
    for (const workspace of db.workspaces) {
      await client.query('INSERT INTO procureiq_ws (id, data) VALUES ($1, $2::jsonb) ON CONFLICT (id) DO NOTHING', [workspace.id, JSON.stringify(workspaceSlice(db, workspace.id))]);
    }
    // The legacy procureiq_state row is intentionally left untouched as a backup.
    await client.query('COMMIT');
    if (db.workspaces.length) console.log(JSON.stringify({ level: 'info', event: 'db.migrated_to_sharded', workspaces: db.workspaces.length }));
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

async function readFromPostgres(scope?: DbScope): Promise<Database> {
  await ensureSchema();
  const client = getPool();
  const globalRow = await client.query('SELECT data FROM procureiq_global WHERE id = $1', [GLOBAL_ID]);
  const wsRows = scope
    ? await client.query('SELECT data FROM procureiq_ws WHERE id = $1', [scope.workspaceId])
    : await client.query('SELECT data FROM procureiq_ws');
  return assemble(globalRow.rows[0]?.data ?? {}, wsRows.rows.map((row) => row.data));
}

async function mutateInPostgres<T>(mutator: (db: Database) => T | Promise<T>, scope?: DbScope): Promise<T> {
  await ensureSchema();
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    if (scope) {
      // Fast path: lock ONLY this workspace's row. Global data is provided
      // read-only for lookups; only the workspace slice is persisted.
      const locked = await client.query('SELECT data FROM procureiq_ws WHERE id = $1 FOR UPDATE', [scope.workspaceId]);
      const globalRow = await client.query('SELECT data FROM procureiq_global WHERE id = $1', [GLOBAL_ID]);
      const db = assemble(globalRow.rows[0]?.data ?? {}, locked.rows[0] ? [locked.rows[0].data] : []);
      const result = await mutator(db);
      const slice = JSON.stringify(workspaceSlice(db, scope.workspaceId));
      await client.query('INSERT INTO procureiq_ws (id, data) VALUES ($1, $2::jsonb) ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()', [scope.workspaceId, slice]);
      await client.query('COMMIT');
      return result;
    }
    // Unscoped path (auth, account deletion, admin): original all-or-nothing
    // semantics — lock global + every workspace row, then persist everything.
    const globalRow = await client.query('SELECT data FROM procureiq_global WHERE id = $1 FOR UPDATE', [GLOBAL_ID]);
    if (!globalRow.rows[0]) {
      await client.query('INSERT INTO procureiq_global (id, data) VALUES ($1, $2::jsonb) ON CONFLICT (id) DO NOTHING', [GLOBAL_ID, JSON.stringify(emptyGlobalSlice())]);
      await client.query('SELECT data FROM procureiq_global WHERE id = $1 FOR UPDATE', [GLOBAL_ID]);
    }
    const wsRows = await client.query('SELECT id, data FROM procureiq_ws ORDER BY id FOR UPDATE');
    const db = assemble(globalRow.rows[0]?.data ?? {}, wsRows.rows.map((row) => row.data));
    const result = await mutator(db);
    const globalSlice = Object.fromEntries(GLOBAL_KEYS.map((key) => [key, db[key]]));
    await client.query('UPDATE procureiq_global SET data = $1::jsonb, updated_at = now() WHERE id = $2', [JSON.stringify(globalSlice), GLOBAL_ID]);
    const liveIds = new Set(db.workspaces.map((w) => w.id));
    for (const workspace of db.workspaces) {
      await client.query('INSERT INTO procureiq_ws (id, data) VALUES ($1, $2::jsonb) ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()', [workspace.id, JSON.stringify(workspaceSlice(db, workspace.id))]);
    }
    for (const row of wsRows.rows) {
      if (!liveIds.has(row.id)) await client.query('DELETE FROM procureiq_ws WHERE id = $1', [row.id]);
    }
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

/** Find the workspace a user belongs to without loading every tenant (GIN-indexed containment). */
export async function findWorkspaceIdByUserId(userId: string): Promise<string | null> {
  if (!usePostgres) {
    const db = await readFromFile();
    return db.workspaceMembers.find((m) => m.userId === userId)?.workspaceId ?? null;
  }
  await ensureSchema();
  const result = await getPool().query("SELECT id FROM procureiq_ws WHERE data->'workspaceMembers' @> $1::jsonb LIMIT 1", [JSON.stringify([{ userId }])]);
  return result.rows[0]?.id ?? null;
}

/** Workspaces holding a pending invite for this email (used at signup/OAuth linking). */
export async function findWorkspaceIdsByInvitedEmail(email: string): Promise<string[]> {
  const needle = email.toLowerCase();
  if (!usePostgres) {
    const db = await readFromFile();
    return [...new Set(db.workspaceMembers.filter((m) => !m.userId && (m.invitedEmail ?? '').toLowerCase() === needle).map((m) => m.workspaceId))];
  }
  await ensureSchema();
  const result = await getPool().query("SELECT id FROM procureiq_ws WHERE data->'workspaceMembers' @> $1::jsonb", [JSON.stringify([{ invitedEmail: needle }])]);
  return result.rows.map((row) => row.id);
}

async function readFromFile(): Promise<Database> {
  try {
    const content = await fs.readFile(env.CORVEN_DATA_PATH, 'utf8');
    return normalizeDatabase({ ...emptyDatabase(), ...JSON.parse(content) });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    return emptyDatabase();
  }
}

async function writeToFile(db: Database) {
  await fs.mkdir(dirname(env.CORVEN_DATA_PATH), { recursive: true });
  await fs.writeFile(env.CORVEN_DATA_PATH, JSON.stringify(db, null, 2));
}

export async function readDb(scope?: DbScope): Promise<Database> {
  return usePostgres ? readFromPostgres(scope) : readFromFile();
}

export async function mutateDb<T>(mutator: (db: Database) => T | Promise<T>, scope?: DbScope): Promise<T> {
  if (usePostgres) return mutateInPostgres(mutator, scope);
  // File adapter: single process, so serialize read-modify-write through a queue.
  const run = fileWriteQueue.then(async () => {
    const db = await readFromFile();
    const result = await mutator(db);
    await writeToFile(db);
    return result;
  });
  fileWriteQueue = run.then(() => undefined, () => undefined);
  return run;
}

/** Reports whether the configured storage backend is reachable. Used by /api/health. */
export async function checkDbHealth(): Promise<{ ok: true; backend: string } | { ok: false; backend: string; error: string }> {
  const backend = usePostgres ? 'postgres-sharded' : 'file';
  try {
    if (usePostgres) {
      await ensureSchema();
      await getPool().query('SELECT 1');
    } else {
      await readFromFile();
    }
    return { ok: true, backend };
  } catch (error) {
    return { ok: false, backend, error: error instanceof Error ? error.message : 'unknown error' };
  }
}

export const now = () => new Date().toISOString();
export const createId = (prefix: string) => `${prefix}_${randomUUID().replaceAll('-', '')}`;

function normalizeDatabase(db: Database): Database {
  db.leadRequests ??= [];
  db.workflowRuns ??= [];
  db.oauthAccounts ??= [];
  for (const key of [...GLOBAL_KEYS, ...WS_KEYS]) (db as any)[key] ??= [];
  db.workspaces = db.workspaces.map((workspace) => ({
    ...workspace,
    plan: workspace.plan ?? 'starter',
    subscriptionStatus: workspace.subscriptionStatus ?? 'not_configured',
    usage: {
      ...defaultWorkspaceUsage(),
      ...(workspace.usage ?? {}),
      teamMembers: db.workspaceMembers.filter((member) => member.workspaceId === workspace.id).length || workspace.usage?.teamMembers || 1,
    },
  }));
  return db;
}
