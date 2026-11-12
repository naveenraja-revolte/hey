'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { currencyFromLocale, type Currency } from '@/lib/money';
import { getCurrentMonthId, isValidMonthId } from '@/lib/expense-data';
import {
  validateBudgetFields,
  validateCurrency,
  validateExpenseFields,
} from '@/lib/expense-validation';
import {
  createExpense as createExpenseRecord,
  deleteExpense as deleteExpenseRecord,
  initializeLocalData,
  updateCurrency as updateCurrencyRecord,
  updateExpense as updateExpenseRecord,
  updateMonthlyBudget,
} from '@/services/expense.service';

function monthFromForm(formData: FormData): string {
  const value = formData.get('month');
  return typeof value === 'string' && isValidMonthId(value) ? value : getCurrentMonthId();
}

function stringFields(formData: FormData, keys: string[]): Record<string, unknown> {
  return Object.fromEntries(
    keys.map((key) => {
      const value = formData.get(key);
      return [key, typeof value === 'string' ? value : ''];
    })
  );
}

function finishAction(month: string, notice: string): never {
  revalidatePath('/');
  redirect(`/?month=${encodeURIComponent(month)}&notice=${encodeURIComponent(notice)}`);
}

async function getCurrency(): Promise<Currency> {
  const requestHeaders = await headers();
  const defaultCurrency = currencyFromLocale(requestHeaders.get('accept-language'));
  const appSettings = await initializeLocalData(defaultCurrency);
  return appSettings.currency as Currency;
}

export async function createExpense(formData: FormData): Promise<void> {
  const month = monthFromForm(formData);
  const currency = await getCurrency();
  const result = validateExpenseFields(
    stringFields(formData, ['amount', 'category', 'occurredOn', 'description', 'month']),
    currency
  );

  if (!result.success) {
    finishAction(month, 'invalid-expense');
  }

  await createExpenseRecord(result.data);
  finishAction(month, 'expense-added');
}

export async function updateExpense(formData: FormData): Promise<void> {
  const month = monthFromForm(formData);
  const id = z.string().uuid().safeParse(formData.get('id'));

  if (!id.success) {
    finishAction(month, 'expense-not-found');
  }

  const currency = await getCurrency();
  const result = validateExpenseFields(
    stringFields(formData, ['amount', 'category', 'occurredOn', 'description', 'month']),
    currency
  );

  if (!result.success) {
    finishAction(month, 'invalid-expense');
  }

  const updated = await updateExpenseRecord(id.data, result.data);
  finishAction(month, updated ? 'expense-updated' : 'expense-not-found');
}

export async function deleteExpense(formData: FormData): Promise<void> {
  const month = monthFromForm(formData);
  const id = z.string().uuid().safeParse(formData.get('id'));

  if (!id.success) {
    finishAction(month, 'expense-not-found');
  }

  const deleted = await deleteExpenseRecord(id.data);
  finishAction(month, deleted ? 'expense-deleted' : 'expense-not-found');
}

export async function saveMonthlyBudget(formData: FormData): Promise<void> {
  const month = monthFromForm(formData);
  const currency = await getCurrency();
  const result = validateBudgetFields(stringFields(formData, ['amount', 'month']), currency);

  if (!result.success) {
    finishAction(month, 'invalid-budget');
  }

  await updateMonthlyBudget(result.data.amountMinor);
  finishAction(month, 'budget-saved');
}

export async function saveCurrency(formData: FormData): Promise<void> {
  const month = monthFromForm(formData);
  const result = validateCurrency(formData.get('currency'));

  if (!result.success) {
    finishAction(month, 'invalid-currency');
  }

  const updated = await updateCurrencyRecord(result.data as Currency);
  finishAction(month, updated ? 'currency-saved' : 'currency-locked');
}
