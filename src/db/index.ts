import 'dotenv/config';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import { initializeSchema } from './schema';

export function createDatabase(client: Database.Database) {
  client.pragma('foreign_keys = ON');
  client.pragma('busy_timeout = 5000');
  client.pragma('journal_mode = WAL');
  initializeSchema(client);
  return drizzle(client, { schema });
}

const globalForDb = globalThis as unknown as {
  sqlite: Database.Database | undefined;
  drizzle: ReturnType<typeof createDatabase> | undefined;
};

function createDefaultDatabase() {
  const path = process.env.DATABASE_URL?.replace(/^file:/, '') ?? './clientnest.db';
  const client = new Database(path);
  return { client, database: createDatabase(client) };
}

const runtimeDatabase = globalForDb.drizzle
  ? { client: globalForDb.sqlite, database: globalForDb.drizzle }
  : createDefaultDatabase();

if (process.env.NODE_ENV !== 'production') {
  globalForDb.sqlite = runtimeDatabase.client;
  globalForDb.drizzle = runtimeDatabase.database;
}

export const db = runtimeDatabase.database;
export { schema };
export type AppDatabase = typeof db;
