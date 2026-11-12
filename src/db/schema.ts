import { randomUUID } from 'node:crypto';
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const expenses = sqliteTable(
  'expenses',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    amountMinor: integer('amount_minor').notNull(),
    category: text('category').notNull(),
    occurredOn: text('occurred_on').notNull(),
    description: text('description'),
    isExample: integer('is_example', { mode: 'boolean' }).notNull().default(false),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date())
      .$onUpdateFn(() => new Date()),
  },
  (table) => [index('expenses_occurred_on_idx').on(table.occurredOn)]
);

export const settings = sqliteTable('settings', {
  id: integer('id').primaryKey(),
  currency: text('currency').notNull(),
  monthlyBudgetMinor: integer('monthly_budget_minor'),
  examplesSeeded: integer('examples_seeded', { mode: 'boolean' }).notNull().default(false),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date()),
});

export type Expense = typeof expenses.$inferSelect;
export type NewExpense = typeof expenses.$inferInsert;
export type AppSettings = typeof settings.$inferSelect;
