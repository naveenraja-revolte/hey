import { saveMonthlyBudget } from '@/app/actions';
import { formatAmountForInput, getCurrencyFractionDigits, type Currency } from '@/lib/money';
import { SubmitButton } from './submit-button';

type BudgetFormProps = {
  budgetMinor: number | null;
  currency: Currency;
  month: string;
};

export function BudgetForm({ budgetMinor, currency, month }: BudgetFormProps) {
  const fractionDigits = getCurrencyFractionDigits(currency);

  return (
    <form action={saveMonthlyBudget} className="budget-form">
      <input name="month" type="hidden" value={month} />
      <label className="field">
        <span>{budgetMinor === null ? 'Monthly limit' : 'Change monthly limit'}</span>
        <div className="amount-input-wrap budget-input-wrap">
          <span aria-hidden="true" className="currency-prefix">
            {currency}
          </span>
          <input
            defaultValue={budgetMinor === null ? '' : formatAmountForInput(budgetMinor, currency)}
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
      <SubmitButton className="button button-primary" pendingLabel="Saving…">
        {budgetMinor === null ? 'Set monthly limit' : 'Save limit'}
      </SubmitButton>
      <p className="budget-recurrence">This amount carries into each calendar month.</p>
    </form>
  );
}
