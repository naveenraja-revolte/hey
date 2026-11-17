import Database from 'better-sqlite3';
import { resolve } from 'node:path';
import { createDatabase, type AppDatabase } from '../db';

export function createTestDatabase() {
  const sqlite = new Database(':memory:');
  const db: AppDatabase = createDatabase(sqlite, resolve(process.cwd(), 'drizzle'));
  return { db, close: () => sqlite.close() };
}
