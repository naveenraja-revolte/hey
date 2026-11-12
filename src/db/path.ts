import { basename, join } from 'node:path';

const defaultDatabaseUrl = 'file:./.data/expenses.db';

export function getDatabaseFilename(databaseUrl = process.env.DATABASE_URL ?? defaultDatabaseUrl) {
  const filename = basename(databaseUrl.replace(/^file:/, ''));

  if (!/^[a-zA-Z0-9._-]+\.db$/.test(filename)) {
    throw new Error('DATABASE_URL must identify a local SQLite .db file.');
  }

  return filename;
}

export function getDatabasePath(): string {
  return join(process.cwd(), '.data', getDatabaseFilename());
}

export function getDatabaseUrl(): string {
  return `file:./.data/${getDatabaseFilename()}`;
}
