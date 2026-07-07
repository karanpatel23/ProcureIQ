import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import { dirname } from 'node:path';
import { Pool, type PoolClient } from 'pg';
import { env } from './env';
import { defaultWorkspaceUsage, emptyDatabase, type Database } from './schema';

/*
 * Storage backends. When DATABASE_URL is set the workspace state document is
 * persisted in Postgres; otherwise the local JSON file adapter is used for
 * development and demos. Both share identical read/mutate/write semantics.
 *
 * Postgres mutations run inside a transaction that takes a row lock
 * (SELECT ... FOR UPDATE), so concurrent writers are serialized and no
 * update is lost — critical when many users sign up at once.
 */
const usePostgres = Boolean(env.DATABASE_URL);
const STATE_ID = 1;

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

function ensureSchema(client: Pool | PoolClient = getPool()): Promise<void> {
  schemaReady ??= client
    .query('CREATE TABLE IF NOT EXISTS procureiq_state (id integer PRIMARY KEY CHECK (id = 1), data jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now())')
    .then(() => undefined)
    .catch((error) => {
      schemaReady = null; // allow a later retry rather than caching the failure
      throw error;
    });
  return schemaReady;
}

async function readFromPostgres(): Promise<Database> {
  await ensureSchema();
  const result = await getPool().query('SELECT data FROM procureiq_state WHERE id = $1', [STATE_ID]);
  if (!result.rows[0]) return emptyDatabase();
  return normalizeDatabase({ ...emptyDatabase(), ...result.rows[0].data });
}

async function mutateInPostgres<T>(mutator: (db: Database) => T | Promise<T>): Promise<T> {
  await ensureSchema();
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    // Lock (or create) the single state row so concurrent mutations serialize.
    const locked = await client.query('SELECT data FROM procureiq_state WHERE id = $1 FOR UPDATE', [STATE_ID]);
    let db: Database;
    if (locked.rows[0]) {
      db = normalizeDatabase({ ...emptyDatabase(), ...locked.rows[0].data });
    } else {
      db = emptyDatabase();
      await client.query('INSERT INTO procureiq_state (id, data) VALUES ($1, $2::jsonb) ON CONFLICT (id) DO NOTHING', [STATE_ID, JSON.stringify(db)]);
      await client.query('SELECT data FROM procureiq_state WHERE id = $1 FOR UPDATE', [STATE_ID]);
    }
    const result = await mutator(db);
    await client.query('UPDATE procureiq_state SET data = $1::jsonb, updated_at = now() WHERE id = $2', [JSON.stringify(db), STATE_ID]);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

async function readFromFile(): Promise<Database> {
  try {
    const content = await fs.readFile(env.PROCUREIQ_DATA_PATH, 'utf8');
    return normalizeDatabase({ ...emptyDatabase(), ...JSON.parse(content) });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    return emptyDatabase();
  }
}

async function writeToFile(db: Database) {
  await fs.mkdir(dirname(env.PROCUREIQ_DATA_PATH), { recursive: true });
  await fs.writeFile(env.PROCUREIQ_DATA_PATH, JSON.stringify(db, null, 2));
}

export async function readDb(): Promise<Database> {
  return usePostgres ? readFromPostgres() : readFromFile();
}

export async function mutateDb<T>(mutator: (db: Database) => T | Promise<T>): Promise<T> {
  if (usePostgres) return mutateInPostgres(mutator);
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
  const backend = usePostgres ? 'postgres' : 'file';
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
