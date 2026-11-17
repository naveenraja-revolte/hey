import Database from "better-sqlite3";
import {
  drizzle,
  type BetterSQLite3Database,
} from "drizzle-orm/better-sqlite3";
import * as schema from "@/db/schema";

export type AppDatabase = BetterSQLite3Database<typeof schema> & {
  $client: Database.Database;
};
export type DatabaseHandle = { client: Database.Database; db: AppDatabase };

const databaseSchemaVersion = 1;
const schemaSql = `
  CREATE TABLE IF NOT EXISTS staff_users (
    id TEXT PRIMARY KEY NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS staff_sessions (
    token_hash TEXT PRIMARY KEY NOT NULL,
    staff_user_id TEXT NOT NULL REFERENCES staff_users(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS shipments (
    id TEXT PRIMARY KEY NOT NULL,
    tracking_number TEXT NOT NULL UNIQUE,
    sender_name TEXT NOT NULL,
    sender_email TEXT NOT NULL,
    sender_phone TEXT,
    sender_address TEXT NOT NULL,
    recipient_name TEXT NOT NULL,
    recipient_phone TEXT,
    recipient_address TEXT NOT NULL,
    parcel_description TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN (
      'booked', 'collected', 'in_transit', 'out_for_delivery',
      'delivery_attempted', 'delivered'
    )),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS shipment_events (
    id TEXT PRIMARY KEY NOT NULL,
    shipment_id TEXT NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN (
      'booked', 'collected', 'in_transit', 'out_for_delivery',
      'delivery_attempted', 'delivered'
    )),
    message TEXT NOT NULL,
    staff_user_id TEXT REFERENCES staff_users(id) ON DELETE SET NULL,
    occurred_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS login_attempts (
    address_hash TEXT PRIMARY KEY NOT NULL,
    attempt_count INTEGER NOT NULL,
    window_started_at INTEGER NOT NULL,
    blocked_until INTEGER
  );
  CREATE INDEX IF NOT EXISTS staff_sessions_expiry_idx ON staff_sessions(expires_at);
  CREATE INDEX IF NOT EXISTS shipments_status_created_idx ON shipments(status, created_at);
  CREATE INDEX IF NOT EXISTS shipments_created_idx ON shipments(created_at);
  CREATE INDEX IF NOT EXISTS shipment_events_history_idx ON shipment_events(shipment_id, occurred_at);
`;

export function initializeSchema(client: Database.Database): void {
  client.pragma("foreign_keys = ON");
  client.pragma("busy_timeout = 5000");

  const currentVersion = client.pragma("user_version", { simple: true });
  if (
    typeof currentVersion !== "number" ||
    currentVersion > databaseSchemaVersion
  ) {
    throw new Error(
      "The database schema version is not supported by this app.",
    );
  }
  if (currentVersion === databaseSchemaVersion) return;

  client.transaction(() => {
    client.exec(schemaSql);
    client.pragma(`user_version = ${databaseSchemaVersion}`);
  })();
}

export function createDatabase(path: string): DatabaseHandle {
  const client = new Database(path);
  initializeSchema(client);
  return { client, db: drizzle(client, { schema }) };
}

function getDatabasePath(): string {
  const configuredPath = process.env.DATABASE_URL ?? "file:./delivery.db";
  if (!configuredPath.startsWith("file:")) {
    throw new Error("DATABASE_URL must use a file: SQLite URL.");
  }
  return configuredPath.slice("file:".length);
}

const globalDatabase = globalThis as typeof globalThis & {
  __parcelDeliveryDatabase?: DatabaseHandle;
};

export function getDatabase(): DatabaseHandle {
  if (!globalDatabase.__parcelDeliveryDatabase) {
    globalDatabase.__parcelDeliveryDatabase = createDatabase(getDatabasePath());
  }
  return globalDatabase.__parcelDeliveryDatabase;
}
