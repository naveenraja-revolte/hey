import { isValidMonthId } from './expense-data';

export function getPageNumber(value: string | string[] | undefined): number {
  if (typeof value !== 'string' || !/^\d+$/.test(value)) {
    return 1;
  }

  const page = Number(value);
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}

export function getMonthParam(value: string | string[] | undefined, fallback: string): string {
  return typeof value === 'string' && isValidMonthId(value) && value <= fallback ? value : fallback;
}

export function getLocale(value: string | null): string {
  const first = value?.split(',')[0]?.split(';')[0]?.trim();

  if (!first) {
    return 'en';
  }

  try {
    return Intl.getCanonicalLocales(first)[0] ?? 'en';
  } catch {
    return 'en';
  }
}
