import { updateExpense } from '@/app/actions';
import { expenseCategories, getDateLabel } from '@/lib/expense-data';
import {
  formatAmountForInput,
  formatMoney,
  getCurrencyFractionDigits,
  type Currency,
} from '@/lib/money';
import type { Expense } from '@/db/schema';
import { SubmitButton } from './submit-button';
import { DeleteExpenseForm } from './delete-expense-form';

type ExpenseRowProps = {
  expense: Expense;
  currency: Currency;
  locale: string;
  month: string;
  today: string;
};

const categoryMarks: Record<string, string> = {
  Groceries: 'G',
  Dining: 'D',
  Transport: 'T',
  Home: 'H',
  Health: '+',
  Shopping: 'S',
  Bills: 'B',
  Other: '•',
};

export function ExpenseRow({ expense, currency, locale, month, today }: ExpenseRowProps) {
  return (
    <li className="expense-item">
      <div className="category-mark" aria-hidden="true">
        {categoryMarks[expense.category] ?? '•'}
      </div>

      <div className="expense-main">
        <div className="expense-name-line">
          <p className="expense-name">{expense.description ?? expense.category}</p>
          {expense.isExample && <span className="example-chip">Example</span>}
        </div>
        <p className="expense-meta">
          <span>{expense.category}</span>
          <span aria-hidden="true">·</span>
          <time dateTime={expense.occurredOn}>{getDateLabel(expense.occurredOn, locale)}</time>
        </p>
      </div>

      <p className="expense-amount">−{formatMoney(expense.amountMinor, currency, locale)}</p>

      <details className="expense-actions">
        <summary aria-label={`Edit ${expense.description ?? expense.category}`}>
          <span aria-hidden="true">···</span>
        </summary>
        <div className="expense-edit-panel">
          <h3>Edit expense</h3>
          <form action={updateExpense} className="edit-form">
            <input name="id" type="hidden" value={expense.id} />
            <input name="month" type="hidden" value={month} />

            <label className="field">
              <span>Description</span>
              <input
                defaultValue={expense.description ?? ''}
                maxLength={80}
                name="description"
                type="text"
              />
            </label>

            <label className="field">
              <span>Amount ({currency})</span>
              <input
                defaultValue={formatAmountForInput(expense.amountMinor, currency)}
                inputMode="decimal"
                min={getCurrencyFractionDigits(currency) > 0 ? 0.01 : 1}
                name="amount"
                required
                step={
                  getCurrencyFractionDigits(currency) > 0
                    ? 1 / 10 ** getCurrencyFractionDigits(currency)
                    : 1
                }
                type="number"
              />
            </label>

            <label className="field">
              <span>Category</span>
              <select defaultValue={expense.category} name="category" required>
                {expenseCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Date</span>
              <input
                defaultValue={expense.occurredOn}
                max={today}
                name="occurredOn"
                required
                type="date"
              />
            </label>

            <div className="edit-actions">
              <SubmitButton className="button button-primary" pendingLabel="Saving…">
                Save changes
              </SubmitButton>
            </div>
          </form>
          <DeleteExpenseForm expenseId={expense.id} month={month} />
        </div>
      </details>
    </li>
  );
}
