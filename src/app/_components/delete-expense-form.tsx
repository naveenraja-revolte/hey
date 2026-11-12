'use client';

import { deleteExpense } from '@/app/actions';
import type { FormEvent } from 'react';

export function DeleteExpenseForm({ expenseId, month }: { expenseId: string; month: string }) {
  function confirmDelete(event: FormEvent<HTMLFormElement>) {
    if (!window.confirm('Delete this expense? This cannot be undone.')) {
      event.preventDefault();
    }
  }

  return (
    <form action={deleteExpense} onSubmit={confirmDelete}>
      <input name="id" type="hidden" value={expenseId} />
      <input name="month" type="hidden" value={month} />
      <button className="button button-danger" type="submit">
        Delete
      </button>
    </form>
  );
}
