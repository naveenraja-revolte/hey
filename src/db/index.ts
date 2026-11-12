import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';

const globalForDatabase = globalThis as typeof globalThis & {
  sqliteDatabase?: Database.Database;
};

const databaseFile = process.env.DATABASE_URL?.replace(/^file:/, '') ?? './dev.db';
const sqlite = globalForDatabase.sqliteDatabase ?? new Database(databaseFile);

sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

if (process.env.NODE_ENV !== 'production') {
  globalForDatabase.sqliteDatabase = sqlite;
}

export const db = drizzle(sqlite, { schema });
export { schema };
export type DatabaseInstance = typeof db;
