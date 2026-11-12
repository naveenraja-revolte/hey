import { z } from 'zod';
import { expenseCategories, isValidExpenseDate, isValidMonthId } from './expense-data';
import { currencyOptions, parseAmountToMinorUnits, type Currency } from './money';

const amountSchema = z
  .string()
  .trim()
  .min(1, 'Enter an amount.')
  .max(24, 'Enter a smaller amount.')
  .regex(/^\d+(?:\.\d+)?$/, 'Enter a valid amount using digits and a decimal point.');

const expenseFieldsSchema = z.object({
  amount: amountSchema,
  category: z.enum(expenseCategories),
  occurredOn: z.string().refine(isValidExpenseDate, 'Choose a real calendar date.'),
  description: z.string().trim().max(80, 'Keep the description under 80 characters.'),
  month: z.string().refine(isValidMonthId, 'Choose a valid month.'),
});

export function validateExpenseFields(fields: Record<string, unknown>, currency: Currency) {
  const parsed = expenseFieldsSchema.safeParse(fields);

  if (!parsed.success) {
    return {
      success: false as const,
      message: parsed.error.issues[0]?.message ?? 'Check the expense details.',
    };
  }

  const amountMinor = parseAmountToMinorUnits(parsed.data.amount, currency);

  if (amountMinor === null) {
    return {
      success: false as const,
      message: `Enter a positive amount with no more than ${
        new Intl.NumberFormat('en', {
          style: 'currency',
          currency,
        }).resolvedOptions().maximumFractionDigits
      } decimal places.`,
    };
  }

  return {
    success: true as const,
    data: {
      amountMinor,
      category: parsed.data.category,
      occurredOn: parsed.data.occurredOn,
      description: parsed.data.description || null,
      month: parsed.data.month,
    },
  };
}

export function validateBudgetFields(fields: Record<string, unknown>, currency: Currency) {
  const parsed = z
    .object({
      amount: amountSchema,
      month: z.string().refine(isValidMonthId, 'Choose a valid month.'),
    })
    .safeParse(fields);

  if (!parsed.success) {
    return {
      success: false as const,
      message: parsed.error.issues[0]?.message ?? 'Check the budget amount.',
    };
  }

  const amountMinor = parseAmountToMinorUnits(parsed.data.amount, currency);

  if (amountMinor === null) {
    return { success: false as const, message: 'Enter a positive monthly budget amount.' };
  }

  return { success: true as const, data: { amountMinor, month: parsed.data.month } };
}

export function validateCurrency(value: unknown) {
  return z.enum(currencyOptions).safeParse(value);
}
