const notices: Record<string, { message: string; tone: 'success' | 'error' | 'info' }> = {
  'expense-added': { message: 'Expense saved to your ledger.', tone: 'success' },
  'expense-updated': { message: 'Your changes have been saved.', tone: 'success' },
  'expense-deleted': { message: 'Expense deleted.', tone: 'success' },
  'budget-saved': { message: 'Your monthly limit is saved.', tone: 'success' },
  'currency-saved': { message: 'Currency updated. Example entries were cleared.', tone: 'success' },
  'invalid-expense': {
    message: 'Check the amount, date, and category, then try again.',
    tone: 'error',
  },
  'invalid-budget': { message: 'Enter a valid positive monthly limit.', tone: 'error' },
  'invalid-currency': { message: 'Choose a supported currency.', tone: 'error' },
  'currency-locked': {
    message:
      'Currency cannot change while you have personal expenses saved. Delete those entries first; no conversion is applied.',
    tone: 'error',
  },
  'expense-not-found': {
    message: 'That expense could not be found. Refresh and try again.',
    tone: 'error',
  },
};

export function Notice({ notice }: { notice?: string | string[] }) {
  const noticeKey = typeof notice === 'string' ? notice : undefined;
  const item = noticeKey ? notices[noticeKey] : undefined;

  if (!item) {
    return null;
  }

  return (
    <p
      aria-live={item.tone === 'error' ? 'assertive' : 'polite'}
      className={`notice notice-${item.tone}`}
      role={item.tone === 'error' ? 'alert' : 'status'}
    >
      {item.message}
    </p>
  );
}
