import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import type { ShipmentStatus } from "@/lib/shipment-status";

export const staffUsers = sqliteTable(
  "staff_users",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [uniqueIndex("staff_users_email_unique").on(table.email)],
);

export const staffSessions = sqliteTable(
  "staff_sessions",
  {
    tokenHash: text("token_hash").primaryKey(),
    staffUserId: text("staff_user_id")
      .notNull()
      .references(() => staffUsers.id, { onDelete: "cascade" }),
    expiresAt: integer("expires_at").notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (table) => [index("staff_sessions_expiry_idx").on(table.expiresAt)],
);

export const shipments = sqliteTable(
  "shipments",
  {
    id: text("id").primaryKey(),
    trackingNumber: text("tracking_number").notNull(),
    senderName: text("sender_name").notNull(),
    senderEmail: text("sender_email").notNull(),
    senderPhone: text("sender_phone"),
    senderAddress: text("sender_address").notNull(),
    recipientName: text("recipient_name").notNull(),
    recipientPhone: text("recipient_phone"),
    recipientAddress: text("recipient_address").notNull(),
    parcelDescription: text("parcel_description").notNull(),
    status: text("status").$type<ShipmentStatus>().notNull(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("shipments_tracking_number_unique").on(table.trackingNumber),
    index("shipments_status_created_idx").on(table.status, table.createdAt),
    index("shipments_created_idx").on(table.createdAt),
  ],
);

export const shipmentEvents = sqliteTable(
  "shipment_events",
  {
    id: text("id").primaryKey(),
    shipmentId: text("shipment_id")
      .notNull()
      .references(() => shipments.id, { onDelete: "cascade" }),
    status: text("status").$type<ShipmentStatus>().notNull(),
    message: text("message").notNull(),
    staffUserId: text("staff_user_id").references(() => staffUsers.id, {
      onDelete: "set null",
    }),
    occurredAt: text("occurred_at").notNull(),
  },
  (table) => [
    index("shipment_events_history_idx").on(table.shipmentId, table.occurredAt),
  ],
);

export const loginAttempts = sqliteTable("login_attempts", {
  addressHash: text("address_hash").primaryKey(),
  attemptCount: integer("attempt_count").notNull(),
  windowStartedAt: integer("window_started_at").notNull(),
  blockedUntil: integer("blocked_until"),
});
