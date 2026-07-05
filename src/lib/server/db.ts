import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import { dirname } from 'node:path';
import { Pool } from 'pg';
import { env } from './env';
import { defaultWorkspaceUsage, emptyDatabase, type Database } from './schema';

/*
 * Storage backends. When DATABASE_URL is set the workspace state document is
 * persisted in Postgres, which survives serverless deployments and restarts.
 * Without it, the local JSON file adapter is used for development and demos.
 * Both share identical read/mutate/write semantics (last write wins per
 * process, writes serialized in-process through a queue).
 */
const usePostgres = Boolean(env.DATABASE_URL);

let writeQueue = Promise.resolve();
let pool: Pool | null = null;
let schemaReady: Promise<void> | null = null;

function getPool(): Pool {
  if (!pool) {
    const url = env.DATABASE_URL as string;
    const isLocal = /localhost|127\.0\.0\.1/.test(url);
    pool = new Pool({ connectionString: url, max: 3, ssl: isLocal ? undefined : { rejectUnauthorized: false } });
  }
  return pool;
}

function ensureSchema(): Promise<void> {
  schemaReady ??= getPool()
    .query('CREATE TABLE IF NOT EXISTS procureiq_state (id integer PRIMARY KEY CHECK (id = 1), data jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now())')
    .then(() => undefined);
  return schemaReady;
}

async function readFromPostgres(): Promise<Database> {
  await ensureSchema();
  const result = await getPool().query('SELECT data FROM procureiq_state WHERE id = 1');
  if (!result.rows[0]) return emptyDatabase();
  return normalizeDatabase({ ...emptyDatabase(), ...result.rows[0].data });
}

async function writeToPostgres(db: Database) {
  await ensureSchema();
  await getPool().query(
    'INSERT INTO procureiq_state (id, data, updated_at) VALUES (1, $1::jsonb, now()) ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()',
    [JSON.stringify(db)],
  );
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

export async function writeDb(db: Database) {
  writeQueue = writeQueue.then(() => (usePostgres ? writeToPostgres(db) : writeToFile(db)));
  await writeQueue;
}

export async function mutateDb<T>(mutator: (db: Database) => T | Promise<T>) {
  const db = await readDb();
  const result = await mutator(db);
  await writeDb(db);
  return result;
}

export const now = () => new Date().toISOString();
export const createId = (prefix: string) => `${prefix}_${randomUUID().replaceAll('-', '')}`;

function normalizeDatabase(db: Database): Database {
  db.leadRequests ??= [];
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
