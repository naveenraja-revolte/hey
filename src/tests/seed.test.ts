import assert from 'node:assert/strict';
import { test } from 'node:test';
import { seedDatabase } from '../db/seed';
import { createTestDatabase } from './helpers';

test('seed data is available through the dispatcher list queries and seeds only once', async (t) => {
  const { db, close } = createTestDatabase();
  t.after(close);
  const seeded = await seedDatabase(db);
  assert.deepEqual(seeded, { seeded: true, deliveries: 12, couriers: 5 });
  const secondRun = await seedDatabase(db);
  assert.equal(secondRun.seeded, false);
});
