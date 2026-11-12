export const expenseCategories = [
  'Groceries',
  'Dining',
  'Transport',
  'Home',
  'Health',
  'Shopping',
  'Bills',
  'Other',
] as const;

export type ExpenseCategory = (typeof expenseCategories)[number];

type DateParts = {
  year: number;
  month: number;
  day: number;
};

function getMonthParts(value: string): { year: number; month: number } {
  return {
    year: Number(value.slice(0, 4)),
    month: Number(value.slice(5, 7)),
  };
}

function getDateParts(value: string): DateParts {
  return {
    ...getMonthParts(value),
    day: Number(value.slice(8, 10)),
  };
}

export function isValidExpenseDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const { year, month, day } = getDateParts(value);

  if (year < 1000) {
    return false;
  }

  const date = new Date(year, month - 1, day);

  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

export function isValidMonthId(value: string): boolean {
  if (!/^\d{4}-\d{2}$/.test(value)) {
    return false;
  }

  const { year, month } = getMonthParts(value);
  return year >= 1000 && month >= 1 && month <= 12;
}

export function getCurrentMonthId(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function getMonthBounds(monthId: string): { start: string; end: string } {
  const { year, month } = getMonthParts(monthId);
  const lastDay = new Date(year, month, 0).getDate();

  return {
    start: `${monthId}-01`,
    end: `${monthId}-${String(lastDay).padStart(2, '0')}`,
  };
}

export function shiftMonth(monthId: string, offset: number): string {
  const { year, month } = getMonthParts(monthId);
  const date = new Date(year, month - 1 + offset, 1);

  return getCurrentMonthId(date);
}

export function getMonthLabel(monthId: string, locale = 'en'): string {
  const { year, month } = getMonthParts(monthId);
  return new Intl.DateTimeFormat(locale, {
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, month - 1, 1));
}

export function getDateLabel(value: string, locale = 'en'): string {
  const { year, month, day } = getDateParts(value);
  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
  }).format(new Date(year, month - 1, day));
}

export function getTodayInputValue(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')}`;
}

export function getDefaultExpenseDate(monthId: string, now = new Date()): string {
  if (monthId >= getCurrentMonthId(now)) {
    return getTodayInputValue(now);
  }

  const { year, month } = getMonthParts(monthId);
  const lastDay = new Date(year, month, 0).getDate();
  const day = Math.min(now.getDate(), lastDay);

  return `${monthId}-${String(day).padStart(2, '0')}`;
}
