import { Currency } from "../types";

export const CURRENCY_CONFIG: Record<Currency, { symbol: string; locale: string }> = {
  KES: { symbol: 'KSh', locale: 'en-KE' },
  USD: { symbol: '$', locale: 'en-US' },
  UGX: { symbol: 'USh', locale: 'en-UG' },
  TZS: { symbol: 'TSh', locale: 'en-TZ' },
  NGN: { symbol: '₦', locale: 'en-NG' },
  GHS: { symbol: 'GH₵', locale: 'en-GH' },
  ZAR: { symbol: 'R', locale: 'en-ZA' },
};

export function formatCurrency(amount: number, currency: Currency): string {
  const config = CURRENCY_CONFIG[currency] || CURRENCY_CONFIG.KES;
  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: currency,
    currencyDisplay: 'symbol',
  }).format(amount);
}

// Note: useCurrency hook will be implemented in a context or component where user profile is available.
// For now, providing a standalone formatter.
