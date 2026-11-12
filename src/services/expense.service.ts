import { and, count, desc, eq, gte, lte, sql } from 'drizzle-orm';
import { db } from '@/db';
import { expenses, settings, type AppSettings, type Expense } from '@/db/schema';
import { getMonthBounds } from '@/lib/expense-data';
import { getCurrencyFractionDigits, type Currency } from '@/lib/money';

const PAGE_SIZE = 20;

const exampleTransactions = [
  { amount: 64, category: 'Groceries', description: 'Market groceries', daysAgo: 0 },
  { amount: 18, category: 'Dining', description: 'Coffee and pastry', daysAgo: 1 },
  { amount: 42, category: 'Transport', description: 'Transit pass', daysAgo: 2 },
  { amount: 36, category: 'Home', description: 'Kitchen essentials', daysAgo: 4 },
  { amount: 27, category: 'Dining', description: 'Lunch with a friend', daysAgo: 6 },
  { amount: 55, category: 'Bills', description: 'Phone plan', daysAgo: 8 },
] as const;

function sampleDate(daysAgo: number): string {
  const today = new Date();
  const day = Math.max(1, today.getDate() - daysAgo);
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
    day
  ).padStart(2, '0')}`;
}

function sampleAmount(amount: number, currency: Currency): number {
  return amount * 10 ** getCurrencyFractionDigits(currency);
}

export async function initializeLocalData(defaultCurrency: Currency): Promise<AppSettings> {
  await db
    .insert(settings)
    .values({ id: 1, currency: defaultCurrency, monthlyBudgetMinor: null })
    .onConflictDoNothing({ target: settings.id });

  await db.transaction(async (transaction) => {
    const [currentSettings] = await transaction.select().from(settings).where(eq(settings.id, 1));

    if (!currentSettings || currentSettings.examplesSeeded) {
      return;
    }

    await transaction.insert(expenses).values(
      exampleTransactions.map((transaction) => ({
        amountMinor: sampleAmount(transaction.amount, currentSettings.currency as Currency),
        category: transaction.category,
        description: transaction.description,
        occurredOn: sampleDate(transaction.daysAgo),
        isExample: true,
      }))
    );

    await transaction.update(settings).set({ examplesSeeded: true }).where(eq(settings.id, 1));
  });

  const [currentSettings] = await db.select().from(settings).where(eq(settings.id, 1));

  if (!currentSettings) {
    throw new Error('The local expense settings could not be initialized.');
  }

  return currentSettings;
}

export async function getMonthlyExpenseSummary(monthId: string, page: number) {
  const { start, end } = getMonthBounds(monthId);
  const monthFilter = and(gte(expenses.occurredOn, start), lte(expenses.occurredOn, end));
  const [[totalCount], [totalAmount], [exampleCount], [personalExpenseCount]] = await Promise.all([
    db.select({ value: count() }).from(expenses).where(monthFilter),
    db
      .select({ value: sql<number>`coalesce(sum(${expenses.amountMinor}), 0)` })
      .from(expenses)
      .where(monthFilter),
    db.select({ value: count() }).from(expenses).where(eq(expenses.isExample, true)),
    db.select({ value: count() }).from(expenses).where(eq(expenses.isExample, false)),
  ]);
  const total = totalCount?.value ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(Math.max(page, 1), pageCount);
  const rows = await db
    .select()
    .from(expenses)
    .where(monthFilter)
    .orderBy(desc(expenses.occurredOn), desc(expenses.createdAt))
    .limit(PAGE_SIZE)
    .offset((safePage - 1) * PAGE_SIZE);

  return {
    expenses: rows,
    totalCount: total,
    totalAmountMinor: totalAmount?.value ?? 0,
    exampleCount: exampleCount?.value ?? 0,
    personalExpenseCount: personalExpenseCount?.value ?? 0,
    page: safePage,
    pageCount,
  };
}

export async function createExpense(input: {
  amountMinor: number;
  category: string;
  occurredOn: string;
  description: string | null;
}) {
  const [created] = await db.insert(expenses).values(input).returning();
  return created;
}

export async function updateExpense(
  id: string,
  input: {
    amountMinor: number;
    category: string;
    occurredOn: string;
    description: string | null;
  }
): Promise<Expense | undefined> {
  const [updated] = await db
    .update(expenses)
    .set({ ...input, isExample: false })
    .where(eq(expenses.id, id))
    .returning();

  return updated;
}

export async function deleteExpense(id: string): Promise<Expense | undefined> {
  const [deleted] = await db.delete(expenses).where(eq(expenses.id, id)).returning();
  return deleted;
}

export async function updateMonthlyBudget(amountMinor: number): Promise<void> {
  await db.update(settings).set({ monthlyBudgetMinor: amountMinor }).where(eq(settings.id, 1));
}

export async function updateCurrency(currency: Currency): Promise<boolean> {
  const [personalExpenseCount] = await db
    .select({ value: count() })
    .from(expenses)
    .where(eq(expenses.isExample, false));

  if ((personalExpenseCount?.value ?? 0) > 0) {
    return false;
  }

  await db.transaction(async (transaction) => {
    await transaction.delete(expenses).where(eq(expenses.isExample, true));
    await transaction
      .update(settings)
      .set({ currency, monthlyBudgetMinor: null })
      .where(eq(settings.id, 1));
  });

  return true;
}
