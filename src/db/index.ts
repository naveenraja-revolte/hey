import 'dotenv/config';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { getDatabasePath } from './path';
import * as schema from './schema';

const dataDirectory = join(process.cwd(), '.data');
const databasePath = getDatabasePath();

mkdirSync(dataDirectory, { recursive: true });

const globalForDb = globalThis as unknown as {
  sqlite: Database.Database | undefined;
};

const sqlite = globalForDb.sqlite ?? new Database(databasePath);

if (process.env.NODE_ENV !== 'production') {
  globalForDb.sqlite = sqlite;
}

sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

export const db = drizzle(sqlite, { schema });
export { schema };
