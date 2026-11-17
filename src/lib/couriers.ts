import { and, count, eq, inArray, like, or, sql } from 'drizzle-orm';
import type { AppDatabase } from '@/db';
import { couriers, deliveries } from '@/db/schema';
import { ACTIVE_DELIVERY_STATUSES, PAGE_SIZE } from './domain';
import { AppError } from './errors';
import { courierQuerySchema, courierSchema, courierUpdateSchema } from './validation';

export async function listCouriers(db: AppDatabase, query: unknown) {
  const filters = courierQuerySchema.parse(query);
  const search = filters.q ? `%${filters.q}%` : undefined;
  const where = search
    ? or(like(couriers.name, search), like(couriers.email, search), like(couriers.phone, search))
    : undefined;
  const countRows = await db.select({ total: count() }).from(couriers).where(where);
  const total = countRows[0]?.total ?? 0;
  const items = await db
    .select({
      id: couriers.id,
      name: couriers.name,
      phone: couriers.phone,
      email: couriers.email,
      active: couriers.active,
      activeDeliveries: sql<number>`coalesce(sum(case when ${inArray(deliveries.status, ACTIVE_DELIVERY_STATUSES)} then 1 else 0 end), 0)`,
    })
    .from(couriers)
    .leftJoin(deliveries, eq(deliveries.courierId, couriers.id))
    .where(where)
    .groupBy(couriers.id)
    .orderBy(couriers.name)
    .limit(PAGE_SIZE)
    .offset((filters.page - 1) * PAGE_SIZE);

  return { items, total, page: filters.page, pages: Math.ceil(total / PAGE_SIZE) };
}

export async function listActiveCouriers(db: AppDatabase) {
  return db
    .select({ id: couriers.id, name: couriers.name, active: couriers.active })
    .from(couriers)
    .where(eq(couriers.active, true))
    .orderBy(couriers.name)
    .limit(200);
}

export async function createCourier(db: AppDatabase, input: unknown) {
  const values = courierSchema.parse(input);
  const now = Date.now();
  const [created] = await db
    .insert(couriers)
    .values({ ...values, active: true, createdAt: now, updatedAt: now })
    .onConflictDoNothing()
    .returning({ id: couriers.id });
  if (!created) throw new AppError('A courier with that email already exists', 409);
  return created;
}

export async function updateCourier(db: AppDatabase, id: number, input: unknown) {
  const values = courierUpdateSchema.parse(input);
  if (!Object.keys(values).length) throw new AppError('Choose a courier detail to update', 400);

  return db.transaction((tx) => {
    const existing = tx.select().from(couriers).where(eq(couriers.id, id)).get();
    if (!existing) throw new AppError('Courier not found', 404);

    if (values.active === false) {
      const activeDelivery = tx
        .select({ id: deliveries.id })
        .from(deliveries)
        .where(
          and(eq(deliveries.courierId, id), inArray(deliveries.status, ACTIVE_DELIVERY_STATUSES))
        )
        .limit(1)
        .get();
      if (activeDelivery) {
        throw new AppError('Reassign active deliveries before deactivating this courier', 409);
      }
    }

    if (values.email && values.email !== existing.email) {
      const duplicate = tx
        .select({ id: couriers.id })
        .from(couriers)
        .where(eq(couriers.email, values.email))
        .limit(1)
        .get();
      if (duplicate) throw new AppError('A courier with that email already exists', 409);
    }

    const updated = tx
      .update(couriers)
      .set({ ...values, updatedAt: Date.now() })
      .where(eq(couriers.id, id))
      .returning({ id: couriers.id })
      .get();
    if (!updated) throw new AppError('A courier with that email already exists', 409);
    return updated;
  });
}
