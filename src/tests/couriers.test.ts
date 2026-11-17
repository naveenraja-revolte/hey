import assert from 'node:assert/strict';
import { test } from 'node:test';
import { AppError } from '../lib/errors';
import { createCourier, listCouriers, updateCourier } from '../lib/couriers';
import { createTestDatabase } from './helpers';

const courierInput = { name: 'Asha Patel', phone: '555-0149', email: 'asha@example.test' };

test('courier creation normalizes email and enforces uniqueness', async (t) => {
  const { db, close } = createTestDatabase();
  t.after(close);
  const courier = await createCourier(db, { ...courierInput, email: 'ASHA@example.test' });
  assert.equal(courier.id > 0, true);
  await assert.rejects(
    createCourier(db, courierInput),
    (error: unknown) => error instanceof AppError && error.status === 409
  );
  const roster = await listCouriers(db, { q: 'asha' });
  assert.equal(roster.total, 1);
  assert.equal(roster.items[0]?.email, 'asha@example.test');
});

test('courier details can be edited and deactivated when unassigned', async (t) => {
  const { db, close } = createTestDatabase();
  t.after(close);
  const courier = await createCourier(db, courierInput);
  const updated = await updateCourier(db, courier.id, {
    name: 'Asha Patel-Singh',
    phone: '555-0199',
  });
  assert.equal(updated.id, courier.id);
  await updateCourier(db, courier.id, { active: false });
  const roster = await listCouriers(db, {});
  assert.equal(roster.items[0]?.active, false);
  assert.equal(roster.items[0]?.name, 'Asha Patel-Singh');
});
