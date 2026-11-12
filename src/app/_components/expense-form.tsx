import { createExpense } from '@/app/actions';
import { expenseCategories } from '@/lib/expense-data';
import { getCurrencyFractionDigits, type Currency } from '@/lib/money';
import { SubmitButton } from './submit-button';

type ExpenseFormProps = {
  month: string;
  today: string;
  currency: Currency;
};

export function ExpenseForm({ month, today, currency }: ExpenseFormProps) {
  const fractionDigits = getCurrencyFractionDigits(currency);

  return (
    <form action={createExpense} className="expense-form">
      <input name="month" type="hidden" value={month} />

      <label className="field field-wide">
        <span>What was it?</span>
        <input
          autoComplete="off"
          maxLength={80}
          name="description"
          placeholder="e.g. Weekly groceries"
          type="text"
        />
      </label>

      <label className="field">
        <span>Amount</span>
        <div className="amount-input-wrap">
          <span aria-hidden="true" className="currency-prefix">
            {currency}
          </span>
          <input
            aria-label={`Amount in ${currency}`}
            inputMode="decimal"
            min={fractionDigits > 0 ? 0.01 : 1}
            name="amount"
            placeholder={fractionDigits > 0 ? '0.00' : '0'}
            required
            step={fractionDigits > 0 ? 1 / 10 ** fractionDigits : 1}
            type="number"
          />
        </div>
      </label>

      <label className="field">
        <span>Category</span>
        <select defaultValue="Groceries" name="category" required>
          {expenseCategories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>Date</span>
        <input defaultValue={today} max={today} name="occurredOn" required type="date" />
      </label>

      <div className="form-footer field-wide">
        <p>Only saved on this device.</p>
        <SubmitButton className="button button-primary" pendingLabel="Saving…">
          Add expense
        </SubmitButton>
      </div>
    </form>
  );
}
