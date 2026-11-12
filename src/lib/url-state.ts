export type QueryValues = Record<string, string | string[] | undefined>;

export function queryValue(values: QueryValues, key: string): string {
  const value = values[key];
  return typeof value === 'string' ? value : '';
}

export function queryPage(values: QueryValues): number {
  const parsed = Number.parseInt(queryValue(values, 'page'), 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

export function flatQuery(values: QueryValues): Record<string, string> {
  return Object.fromEntries(
    Object.entries(values).flatMap(([key, value]) => typeof value === 'string' ? [[key, value]] : []),
  );
}
