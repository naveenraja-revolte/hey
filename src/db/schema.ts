import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import type { DeliveryStatus } from '@/lib/domain';

export const couriers = sqliteTable(
  'couriers',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    phone: text('phone').notNull(),
    email: text('email').notNull().unique(),
    active: integer('active', { mode: 'boolean' }).notNull().default(true),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
  },
  (table) => [index('couriers_active_idx').on(table.active)]
);

export const deliveries = sqliteTable(
  'deliveries',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    recipientName: text('recipient_name').notNull(),
    recipientPhone: text('recipient_phone').notNull(),
    pickupAddress: text('pickup_address').notNull(),
    dropoffAddress: text('dropoff_address').notNull(),
    parcelDescription: text('parcel_description').notNull(),
    notes: text('notes'),
    status: text('status').$type<DeliveryStatus>().notNull(),
    courierId: integer('courier_id').references(() => couriers.id, { onDelete: 'set null' }),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
  },
  (table) => [
    index('deliveries_status_idx').on(table.status),
    index('deliveries_courier_idx').on(table.courierId),
    index('deliveries_created_idx').on(table.createdAt),
  ]
);

export const deliveryEvents = sqliteTable(
  'delivery_events',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    deliveryId: integer('delivery_id')
      .notNull()
      .references(() => deliveries.id, { onDelete: 'cascade' }),
    status: text('status').$type<DeliveryStatus>().notNull(),
    note: text('note'),
    createdAt: integer('created_at').notNull(),
  },
  (table) => [index('delivery_events_delivery_idx').on(table.deliveryId, table.createdAt)]
);
