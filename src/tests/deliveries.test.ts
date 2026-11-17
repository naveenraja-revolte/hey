import assert from 'node:assert/strict';
import { test } from 'node:test';
import { AppError } from '../lib/errors';
import { createCourier, listCouriers, updateCourier } from '../lib/couriers';
import { createDelivery, getDelivery, listDeliveries, updateDelivery } from '../lib/deliveries';
import { createTestDatabase } from './helpers';

const deliveryInput = {
  recipientName: 'Jamie Rivera',
  recipientPhone: '555-0114',
  pickupAddress: '10 Market Street, San Francisco',
  dropoffAddress: '25 Howard Street, San Francisco',
  parcelDescription: 'Document envelope',
  notes: 'Leave at reception',
};

test('delivery creation persists the record and initial history through the database', async (t) => {
  const { db, close } = createTestDatabase();
  t.after(close);
  const created = await createDelivery(db, deliveryInput);
  const saved = await getDelivery(db, created.id);
  assert.equal(saved.recipientName, deliveryInput.recipientName);
  assert.equal(saved.status, 'unassigned');
  assert.equal(saved.history.length, 1);
  assert.equal(saved.history[0]?.note, 'Delivery created');
});

test('delivery input validation rejects incomplete records', async (t) => {
  const { db, close } = createTestDatabase();
  t.after(close);
  await assert.rejects(createDelivery(db, { ...deliveryInput, dropoffAddress: '' }));
  const result = await listDeliveries(db, {});
  assert.equal(result.total, 0);
});

test('assignment, workload, status transitions, and history stay consistent', async (t) => {
  const { db, close } = createTestDatabase();
  t.after(close);
  const courier = await createCourier(db, {
    name: 'Maya Chen',
    phone: '555-0132',
    email: 'maya@example.test',
  });
  const created = await createDelivery(db, deliveryInput);

  await updateDelivery(db, created.id, { courierId: courier.id });
  const assigned = await getDelivery(db, created.id);
  assert.equal(assigned.status, 'assigned');
  assert.equal(assigned.courierId, courier.id);
  assert.equal(assigned.history.length, 2);
  const workload = await listCouriers(db, {});
  assert.equal(workload.items[0]?.activeDeliveries, 1);
  await assert.rejects(
    updateCourier(db, courier.id, { active: false }),
    (error: unknown) => error instanceof AppError && error.status === 409
  );

  await assert.rejects(
    updateDelivery(db, created.id, { status: 'in_transit' }),
    (error: unknown) => error instanceof AppError && error.status === 409
  );
  await updateDelivery(db, created.id, { status: 'picked_up' });
  await updateDelivery(db, created.id, { status: 'in_transit' });
  await updateDelivery(db, created.id, { status: 'delivered' });
  const delivered = await getDelivery(db, created.id);
  assert.equal(delivered.status, 'delivered');
  assert.equal(delivered.history.length, 5);
});

test('inactive couriers cannot be assigned and filters are bounded', async (t) => {
  const { db, close } = createTestDatabase();
  t.after(close);
  const courier = await createCourier(db, {
    name: 'Luis Ortega',
    phone: '555-0177',
    email: 'luis@example.test',
  });
  await updateCourier(db, courier.id, { active: false });
  const created = await createDelivery(db, deliveryInput);
  await assert.rejects(
    updateDelivery(db, created.id, { courierId: courier.id }),
    (error: unknown) => error instanceof AppError && error.status === 400
  );

  for (let index = 0; index < 22; index += 1) {
    await createDelivery(db, { ...deliveryInput, recipientName: `Recipient ${index}` });
  }
  const firstPage = await listDeliveries(db, { q: 'Recipient', page: 1, sort: 'newest' });
  const secondPage = await listDeliveries(db, { q: 'Recipient', page: 2, sort: 'oldest' });
  assert.equal(firstPage.total, 22);
  assert.equal(firstPage.items.length, 20);
  assert.equal(secondPage.items.length, 2);
  const statusFiltered = await listDeliveries(db, { q: 'Recipient', status: 'unassigned' });
  assert.equal(statusFiltered.total, 22);
});
