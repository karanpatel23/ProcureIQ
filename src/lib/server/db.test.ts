import { afterEach, beforeEach, expect, it } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Exercise the default (file) storage backend with a throwaway data path.
let dir: string;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'procureiq-db-'));
  process.env.PROCUREIQ_DATA_PATH = join(dir, 'data.json');
  delete process.env.DATABASE_URL;
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

it('serializes concurrent mutations without losing updates', async () => {
  const { mutateDb, readDb, createId, now } = await import('./db');
  // Fire 25 concurrent inserts; the read-modify-write queue must not drop any.
  await Promise.all(
    Array.from({ length: 25 }, (_, i) =>
      mutateDb((db) => {
        db.leadRequests.push({ id: createId('lead'), type: 'contact', name: `User ${i}`, workEmail: `u${i}@example.com`, company: 'Co', status: 'new', createdAt: now(), updatedAt: now() });
      }),
    ),
  );
  const db = await readDb();
  expect(db.leadRequests).toHaveLength(25);
  expect(new Set(db.leadRequests.map((l) => l.name)).size).toBe(25);
});

it('returns the mutator result and persists across reads', async () => {
  const { mutateDb, readDb, createId, now } = await import('./db');
  const created = await mutateDb((db) => {
    const supplier = { id: createId('sup'), workspaceId: 'wsp_1', name: 'Persisted Supplier', status: 'active' as const, createdAt: now(), updatedAt: now() };
    db.suppliers.push(supplier);
    return supplier;
  });
  expect(created.name).toBe('Persisted Supplier');
  const reread = await readDb();
  expect(reread.suppliers.find((s) => s.id === created.id)?.name).toBe('Persisted Supplier');
});
