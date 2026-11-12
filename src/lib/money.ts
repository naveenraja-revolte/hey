export const currencyOptions = [
  'USD',
  'CAD',
  'GBP',
  'EUR',
  'AUD',
  'NZD',
  'JPY',
  'CHF',
  'CNY',
  'INR',
  'MXN',
  'BRL',
  'KRW',
  'SGD',
  'HKD',
  'SEK',
  'NOK',
  'DKK',
  'PLN',
  'CZK',
  'ZAR',
  'AED',
  'TRY',
  'ILS',
] as const;

export type Currency = (typeof currencyOptions)[number];

const currencyByRegion: Record<string, Currency> = {
  AE: 'AED',
  AU: 'AUD',
  AT: 'EUR',
  BE: 'EUR',
  BR: 'BRL',
  CA: 'CAD',
  CH: 'CHF',
  CN: 'CNY',
  CZ: 'CZK',
  DE: 'EUR',
  DK: 'DKK',
  ES: 'EUR',
  FI: 'EUR',
  FR: 'EUR',
  GB: 'GBP',
  GR: 'EUR',
  HK: 'HKD',
  IE: 'EUR',
  IL: 'ILS',
  IN: 'INR',
  IT: 'EUR',
  JP: 'JPY',
  KR: 'KRW',
  MX: 'MXN',
  NL: 'EUR',
  NO: 'NOK',
  NZ: 'NZD',
  PL: 'PLN',
  PT: 'EUR',
  SE: 'SEK',
  SG: 'SGD',
  US: 'USD',
  ZA: 'ZAR',
};

export function getCurrencyFractionDigits(currency: Currency): number {
  return (
    new Intl.NumberFormat('en', {
      style: 'currency',
      currency,
    }).resolvedOptions().maximumFractionDigits ?? 2
  );
}

export function parseAmountToMinorUnits(value: string, currency: Currency): number | null {
  const normalized = value.trim();

  if (!/^\d+(?:\.\d+)?$/.test(normalized)) {
    return null;
  }

  const decimalIndex = normalized.indexOf('.');
  const wholePart = decimalIndex < 0 ? normalized : normalized.slice(0, decimalIndex);
  const fractionPart = decimalIndex < 0 ? '' : normalized.slice(decimalIndex + 1);
  const fractionDigits = getCurrencyFractionDigits(currency);

  if (fractionPart.length > fractionDigits) {
    return null;
  }

  const scale = 10n ** BigInt(fractionDigits);
  const fraction =
    fractionDigits === 0 ? 0n : BigInt(fractionPart.padEnd(fractionDigits, '0') || '0');
  const minorUnits = BigInt(wholePart) * scale + fraction;

  if (minorUnits <= 0n || minorUnits > BigInt(Number.MAX_SAFE_INTEGER)) {
    return null;
  }

  return Number(minorUnits);
}

export function formatMoney(amountMinor: number, currency: Currency, locale = 'en'): string {
  const fractionDigits = getCurrencyFractionDigits(currency);

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(amountMinor / 10 ** fractionDigits);
}

export function formatAmountForInput(amountMinor: number, currency: Currency): string {
  const fractionDigits = getCurrencyFractionDigits(currency);
  const scale = 10n ** BigInt(fractionDigits);
  const amount = BigInt(amountMinor);
  const wholePart = amount / scale;

  if (fractionDigits === 0) {
    return wholePart.toString();
  }

  const fractionPart = (amount % scale).toString().padStart(fractionDigits, '0');
  return `${wholePart}.${fractionPart}`;
}

export function currencyFromLocale(acceptLanguage: string | null): Currency {
  if (acceptLanguage) {
    for (const candidate of acceptLanguage.split(',')) {
      const languageTag = candidate.split(';')[0]?.trim();

      if (!languageTag) {
        continue;
      }

      try {
        const region = new Intl.Locale(languageTag).maximize().region;
        const currency = region ? currencyByRegion[region] : undefined;

        if (currency) {
          return currency;
        }
      } catch {
        continue;
      }
    }
  }

  return 'USD';
}

export function getCurrencyLabel(currency: Currency): string {
  const displayNames = new Intl.DisplayNames(['en'], { type: 'currency' });
  return `${displayNames.of(currency) ?? currency} (${currency})`;
}
