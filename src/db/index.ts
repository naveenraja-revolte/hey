import 'dotenv/config';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';

const globalForDb = globalThis as typeof globalThis & {
  sqlite?: Database.Database;
};

const sqlite =
  globalForDb.sqlite ?? new Database(process.env.DATABASE_URL?.replace(/^file:/, '') ?? './dev.db');
globalForDb.sqlite = sqlite;

sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');
sqlite.pragma('busy_timeout = 5000');

const schemaVersion = sqlite.pragma('user_version', { simple: true });
if (typeof schemaVersion !== 'number') {
  throw new Error('Could not read the SQLite schema version.');
}

if (schemaVersion < 1) {
  sqlite.transaction(() => {
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS contact_submissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        message TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );
    `);
    sqlite.pragma('user_version = 1');
  })();
}

export const db = drizzle(sqlite, { schema });
export { schema };
