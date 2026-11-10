import 'server-only';
import 'dotenv/config';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';

const globalForDb = globalThis as unknown as {
  sqlite: Database.Database | undefined;
};

const databasePath = process.env.DATABASE_URL?.replace(/^file:/, '') ?? './dev.db';
const sqlite = globalForDb.sqlite ?? new Database(databasePath);

sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');
sqlite.pragma('busy_timeout = 5000');

if (process.env.NODE_ENV !== 'production') {
  globalForDb.sqlite = sqlite;
}

export const db = drizzle(sqlite, { schema });
export { schema, sqlite };
