import { and, asc, count, desc, eq, like, or } from 'drizzle-orm';
import type { AppDatabase } from '@/db';
import { couriers, deliveries, deliveryEvents } from '@/db/schema';
import {
  ACTIVE_DELIVERY_STATUSES,
  PAGE_SIZE,
  STATUS_TRANSITIONS,
  type DeliveryStatus,
} from './domain';
import { AppError } from './errors';
import { deliveryQuerySchema, deliverySchema, deliveryUpdateSchema } from './validation';

function deliveryWhere(query: ReturnType<typeof deliveryQuerySchema.parse>) {
  const conditions = [];
  if (query.q) {
    const term = `%${query.q}%`;
    conditions.push(
      or(
        like(deliveries.recipientName, term),
        like(deliveries.pickupAddress, term),
        like(deliveries.dropoffAddress, term)
      )
    );
  }
  if (query.status) conditions.push(eq(deliveries.status, query.status));
  if (query.courierId) conditions.push(eq(deliveries.courierId, query.courierId));
  return conditions.length ? and(...conditions) : undefined;
}

export async function listDeliveries(db: AppDatabase, input: unknown) {
  const query = deliveryQuerySchema.parse(input);
  const where = deliveryWhere(query);
  const countRows = await db.select({ total: count() }).from(deliveries).where(where);
  const total = countRows[0]?.total ?? 0;
  const items = await db
    .select({
      id: deliveries.id,
      recipientName: deliveries.recipientName,
      pickupAddress: deliveries.pickupAddress,
      dropoffAddress: deliveries.dropoffAddress,
      status: deliveries.status,
      courierId: deliveries.courierId,
      courierName: couriers.name,
      createdAt: deliveries.createdAt,
    })
    .from(deliveries)
    .leftJoin(couriers, eq(deliveries.courierId, couriers.id))
    .where(where)
    .orderBy(query.sort === 'oldest' ? asc(deliveries.createdAt) : desc(deliveries.createdAt))
    .limit(PAGE_SIZE)
    .offset((query.page - 1) * PAGE_SIZE);
  return { items, total, page: query.page, pages: Math.ceil(total / PAGE_SIZE) };
}

export async function getDelivery(db: AppDatabase, id: number) {
  const delivery = await db
    .select({
      id: deliveries.id,
      recipientName: deliveries.recipientName,
      recipientPhone: deliveries.recipientPhone,
      pickupAddress: deliveries.pickupAddress,
      dropoffAddress: deliveries.dropoffAddress,
      parcelDescription: deliveries.parcelDescription,
      notes: deliveries.notes,
      status: deliveries.status,
      courierId: deliveries.courierId,
      courierName: couriers.name,
      createdAt: deliveries.createdAt,
      updatedAt: deliveries.updatedAt,
    })
    .from(deliveries)
    .leftJoin(couriers, eq(deliveries.courierId, couriers.id))
    .where(eq(deliveries.id, id))
    .limit(1);
  const item = delivery[0];
  if (!item) throw new AppError('Delivery not found', 404);
  const history = await db
    .select({
      id: deliveryEvents.id,
      status: deliveryEvents.status,
      note: deliveryEvents.note,
      createdAt: deliveryEvents.createdAt,
    })
    .from(deliveryEvents)
    .where(eq(deliveryEvents.deliveryId, id))
    .orderBy(desc(deliveryEvents.createdAt))
    .limit(100);
  return { ...item, history };
}

export async function createDelivery(db: AppDatabase, input: unknown) {
  const values = deliverySchema.parse(input);
  const now = Date.now();
  return db.transaction((tx) => {
    const created = tx
      .insert(deliveries)
      .values({
        ...values,
        notes: values.notes || null,
        status: 'unassigned',
        courierId: null,
        createdAt: now,
        updatedAt: now,
      })
      .returning({ id: deliveries.id })
      .all();
    const delivery = created[0];
    if (!delivery) throw new AppError('Delivery could not be created', 500);
    tx.insert(deliveryEvents)
      .values({
        deliveryId: delivery.id,
        status: 'unassigned',
        note: 'Delivery created',
        createdAt: now,
      })
      .run();
    return delivery;
  });
}

type AppTransaction = Parameters<Parameters<AppDatabase['transaction']>[0]>[0];
type Delivery = typeof deliveries.$inferSelect;

function assignCourier(
  transaction: AppTransaction,
  id: number,
  existing: Delivery,
  courierId: number | null
) {
  if (!['unassigned', 'assigned'].includes(existing.status)) {
    throw new AppError('A courier can only be changed before pickup', 409);
  }

  let courierName: string | null = null;
  if (courierId !== null) {
    const courier = transaction
      .select({ id: couriers.id, name: couriers.name, active: couriers.active })
      .from(couriers)
      .where(eq(couriers.id, courierId))
      .get();
    if (!courier || !courier.active) throw new AppError('Choose an active courier', 400);
    courierName = courier.name;
  }

  const status = courierId === null ? 'unassigned' : 'assigned';
  const now = Date.now();
  transaction
    .update(deliveries)
    .set({ courierId, status, updatedAt: now })
    .where(eq(deliveries.id, id))
    .run();
  transaction
    .insert(deliveryEvents)
    .values({
      deliveryId: id,
      status,
      note: courierName ? `Assigned to ${courierName}` : 'Courier unassigned',
      createdAt: now,
    })
    .run();
  return { id, status, courierId };
}

function changeDeliveryStatus(
  transaction: AppTransaction,
  id: number,
  existing: Delivery,
  status: DeliveryStatus
) {
  if (!STATUS_TRANSITIONS[existing.status].includes(status)) {
    throw new AppError(`Cannot move a delivery from ${existing.status} to ${status}`, 409);
  }
  if (status === 'assigned' && existing.courierId === null) {
    throw new AppError('Assign a courier before marking the delivery assigned', 409);
  }
  if (ACTIVE_DELIVERY_STATUSES.includes(status) && existing.courierId === null) {
    throw new AppError('Assign a courier before progressing this delivery', 409);
  }

  const now = Date.now();
  transaction.update(deliveries).set({ status, updatedAt: now }).where(eq(deliveries.id, id)).run();
  transaction
    .insert(deliveryEvents)
    .values({ deliveryId: id, status, note: null, createdAt: now })
    .run();
  return { id, status, courierId: existing.courierId };
}

export async function updateDelivery(db: AppDatabase, id: number, input: unknown) {
  const change = deliveryUpdateSchema.parse(input);
  return db.transaction((transaction) => {
    const existing = transaction.select().from(deliveries).where(eq(deliveries.id, id)).get();
    if (!existing) throw new AppError('Delivery not found', 404);
    if ('courierId' in change) return assignCourier(transaction, id, existing, change.courierId);
    return changeDeliveryStatus(transaction, id, existing, change.status);
  });
}
