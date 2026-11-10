import { sql } from 'drizzle-orm';
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';
import { user } from './auth-schema';

export type TicketStatus = 'new' | 'in_progress' | 'resolved';

export const teams = sqliteTable(
  'team',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [uniqueIndex('team_name_unique_idx').on(table.name)],
);

export const memberships = sqliteTable(
  'membership',
  {
    userId: text('user_id')
      .primaryKey()
      .references(() => user.id, { onDelete: 'cascade' }),
    teamId: text('team_id')
      .notNull()
      .references(() => teams.id, { onDelete: 'restrict' }),
    lastAutoAssignedAt: integer('last_auto_assigned_at', {
      mode: 'timestamp_ms',
    }),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [index('membership_team_idx').on(table.teamId)],
);

export const topics = sqliteTable(
  'topic',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    teamId: text('team_id')
      .notNull()
      .references(() => teams.id, { onDelete: 'restrict' }),
    active: integer('active', { mode: 'boolean' }).notNull().default(true),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [
    uniqueIndex('topic_team_name_unique_idx').on(table.teamId, table.name),
    index('topic_team_active_idx').on(table.teamId, table.active),
  ],
);

export const tickets = sqliteTable(
  'ticket',
  {
    id: text('id').primaryKey(),
    subject: text('subject').notNull(),
    description: text('description').notNull(),
    topicId: text('topic_id')
      .notNull()
      .references(() => topics.id, { onDelete: 'restrict' }),
    createdBy: text('created_by')
      .notNull()
      .references(() => user.id, { onDelete: 'restrict' }),
    assigneeId: text('assignee_id')
      .notNull()
      .references(() => user.id, { onDelete: 'restrict' }),
    status: text('status').$type<TicketStatus>().notNull().default('new'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [
    index('ticket_assignee_status_updated_idx').on(
      table.assigneeId,
      table.status,
      table.updatedAt,
    ),
    index('ticket_topic_idx').on(table.topicId),
    index('ticket_created_by_idx').on(table.createdBy),
  ],
);
