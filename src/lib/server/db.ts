import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import { dirname } from 'node:path';
import { env } from './env';
import { emptyDatabase, type Database } from './schema';

let writeQueue = Promise.resolve();

export async function readDb(): Promise<Database> {
  try {
    const content = await fs.readFile(env.PROCUREIQ_DATA_PATH, 'utf8');
    return { ...emptyDatabase(), ...JSON.parse(content) };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    return emptyDatabase();
  }
}

export async function writeDb(db: Database) {
  await fs.mkdir(dirname(env.PROCUREIQ_DATA_PATH), { recursive: true });
  writeQueue = writeQueue.then(() => fs.writeFile(env.PROCUREIQ_DATA_PATH, JSON.stringify(db, null, 2)));
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
