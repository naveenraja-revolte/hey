import {
  foreignKey,
  index,
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';
import type Database from 'better-sqlite3';

export const users = sqliteTable(
  'users',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull(),
    passwordHash: text('password_hash').notNull(),
    createdAt: text('created_at').notNull(),
  },
  (table) => [uniqueIndex('users_email_unique').on(table.email)],
);

export const sessions = sqliteTable(
  'sessions',
  {
    tokenHash: text('token_hash').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: text('expires_at').notNull(),
  },
  (table) => [index('sessions_user_idx').on(table.userId)],
);

export const workspaces = sqliteTable(
  'workspaces',
  {
    id: text('id').primaryKey(),
    ownerId: text('owner_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    createdAt: text('created_at').notNull(),
  },
  (table) => [index('workspaces_owner_idx').on(table.ownerId)],
);

export const clients = sqliteTable(
  'clients',
  {
    id: text('id').primaryKey(),
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    email: text('email'),
    emailNormalized: text('email_normalized'),
    phone: text('phone'),
    company: text('company'),
    notes: text('notes'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [
    uniqueIndex('clients_workspace_email_unique').on(table.workspaceId, table.emailNormalized),
    uniqueIndex('clients_id_workspace_unique').on(table.id, table.workspaceId),
    index('clients_workspace_name_idx').on(table.workspaceId, table.name),
  ],
);

export const leads = sqliteTable(
  'leads',
  {
    id: text('id').primaryKey(),
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    email: text('email'),
    emailNormalized: text('email_normalized'),
    phone: text('phone'),
    company: text('company'),
    source: text('source').notNull(),
    status: text('status').notNull(),
    notes: text('notes'),
    clientId: text('client_id').references(() => clients.id, { onDelete: 'set null' }),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [
    index('leads_workspace_status_idx').on(table.workspaceId, table.status),
    index('leads_workspace_name_idx').on(table.workspaceId, table.name),
  ],
);

export const projects = sqliteTable(
  'projects',
  {
    id: text('id').primaryKey(),
    workspaceId: text('workspace_id').notNull(),
    clientId: text('client_id').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    budgetCents: integer('budget_cents'),
    deadline: text('deadline'),
    status: text('status').notNull(),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.clientId, table.workspaceId],
      foreignColumns: [clients.id, clients.workspaceId],
      name: 'projects_client_workspace_fk',
    }).onDelete('restrict'),
    index('projects_workspace_status_idx').on(table.workspaceId, table.status),
    index('projects_workspace_deadline_idx').on(table.workspaceId, table.deadline),
    index('projects_client_idx').on(table.clientId),
  ],
);

export const activities = sqliteTable(
  'activities',
  {
    id: text('id').primaryKey(),
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    kind: text('kind').notNull(),
    entityName: text('entity_name').notNull(),
    entityId: text('entity_id').notNull(),
    summary: text('summary').notNull(),
    createdAt: text('created_at').notNull(),
  },
  (table) => [index('activities_workspace_created_idx').on(table.workspaceId, table.createdAt)],
);

export const schemaSql = `
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions(user_id);
  CREATE TABLE IF NOT EXISTS workspaces (
    id TEXT PRIMARY KEY NOT NULL,
    owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS workspaces_owner_idx ON workspaces(owner_id);
  CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY NOT NULL,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    email_normalized TEXT,
    phone TEXT,
    company TEXT,
    notes TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE(workspace_id, email_normalized),
    UNIQUE(id, workspace_id)
  );
  CREATE INDEX IF NOT EXISTS clients_workspace_name_idx ON clients(workspace_id, name);
  CREATE TABLE IF NOT EXISTS leads (
    id TEXT PRIMARY KEY NOT NULL,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    email_normalized TEXT,
    phone TEXT,
    company TEXT,
    source TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('New', 'Contacted', 'Qualified', 'Negotiation', 'Converted', 'Lost')),
    notes TEXT,
    client_id TEXT REFERENCES clients(id) ON DELETE SET NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS leads_workspace_status_idx ON leads(workspace_id, status);
  CREATE INDEX IF NOT EXISTS leads_workspace_name_idx ON leads(workspace_id, name);
  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY NOT NULL,
    workspace_id TEXT NOT NULL,
    client_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    budget_cents INTEGER,
    deadline TEXT,
    status TEXT NOT NULL CHECK (status IN ('Planned', 'Active', 'On hold', 'Completed', 'Cancelled')),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (client_id, workspace_id) REFERENCES clients(id, workspace_id) ON DELETE RESTRICT
  );
  CREATE INDEX IF NOT EXISTS projects_workspace_status_idx ON projects(workspace_id, status);
  CREATE INDEX IF NOT EXISTS projects_workspace_deadline_idx ON projects(workspace_id, deadline);
  CREATE INDEX IF NOT EXISTS projects_client_idx ON projects(client_id);
  CREATE TABLE IF NOT EXISTS activities (
    id TEXT PRIMARY KEY NOT NULL,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    kind TEXT NOT NULL,
    entity_name TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    summary TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS activities_workspace_created_idx ON activities(workspace_id, created_at);
`;

export function initializeSchema(database: Database.Database): void {
  database.exec(schemaSql);
}
