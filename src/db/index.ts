import 'dotenv/config';
import { resolve } from 'node:path';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from './schema';

export type AppDatabase = ReturnType<typeof createDatabase>;

const globalForDatabase = globalThis as typeof globalThis & {
  dispatchDatabase?: { sqlite: Database.Database; db: AppDatabase };
};

export function createDatabase(sqlite: Database.Database, migrationsFolder?: string) {
  sqlite.pragma('foreign_keys = ON');
  sqlite.pragma('busy_timeout = 5000');
  const db = drizzle(sqlite, { schema });
  if (migrationsFolder) migrate(db, { migrationsFolder });
  return db;
}

export function getDatabase(): AppDatabase {
  const existing = globalForDatabase.dispatchDatabase;
  if (existing) return existing.db;

  const databasePath = process.env.DATABASE_URL?.replace(/^file:/, '') ?? './dev.db';
  const sqlite = new Database(databasePath);
  sqlite.pragma('journal_mode = WAL');
  const db = createDatabase(sqlite, resolve(process.cwd(), 'drizzle'));
  globalForDatabase.dispatchDatabase = { sqlite, db };
  return db;
}
