import { ExpenseRow } from './expense-row';
import type { Expense } from '@/db/schema';
import type { Currency } from '@/lib/money';

type ExpenseRowListProps = {
  expenses: Expense[];
  currency: Currency;
  locale: string;
  month: string;
  today: string;
};

export function ExpenseRowList({ expenses, currency, locale, month, today }: ExpenseRowListProps) {
  return (
    <ul className="expense-list">
      {expenses.map((expense) => (
        <ExpenseRow
          currency={currency}
          expense={expense}
          key={expense.id}
          locale={locale}
          month={month}
          today={today}
        />
      ))}
    </ul>
  );
}
