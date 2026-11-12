import { saveCurrency } from '@/app/actions';
import { currencyOptions, getCurrencyLabel, type Currency } from '@/lib/money';
import { SubmitButton } from './submit-button';

type CurrencyFormProps = {
  currency: Currency;
  canChange: boolean;
  month: string;
};

export function CurrencyForm({ currency, canChange, month }: CurrencyFormProps) {
  return (
    <details className="settings-details">
      <summary>Currency and privacy</summary>
      <div className="settings-panel">
        <form action={saveCurrency} className="currency-form">
          <input name="month" type="hidden" value={month} />
          <label className="field">
            <span>Display currency</span>
            <select defaultValue={currency} disabled={!canChange} name="currency" required>
              {currencyOptions.map((option) => (
                <option key={option} value={option}>
                  {getCurrencyLabel(option)}
                </option>
              ))}
            </select>
          </label>
          <SubmitButton className="button button-secondary" pendingLabel="Saving…">
            Save currency
          </SubmitButton>
        </form>
        <p className="settings-hint">
          {canChange
            ? 'Your entries stay on this device. Currency changes clear example entries and reset the budget; no exchange conversion is applied.'
            : 'Currency is locked after your first personal entry so saved amounts are never silently converted.'}
        </p>
      </div>
    </details>
  );
}
