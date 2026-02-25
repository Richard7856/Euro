'use client';

import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import { USD_TO_MXN } from '@/lib/currency';

export type DisplayCurrency = 'MXN' | 'USD';

type CurrencyContextValue = {
  currency: DisplayCurrency;
  setCurrency: (c: DisplayCurrency) => void;
  rateMxnPerUsd: number;
  formatCurrency: (amountMxn: number, options?: { maxFraction?: number }) => string;
  toDisplayAmount: (amountMxn: number) => number;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<DisplayCurrency>('MXN');
  const rateMxnPerUsd = USD_TO_MXN;

  const toDisplayAmount = useCallback(
    (amountMxn: number) => {
      if (currency === 'USD') return amountMxn / rateMxnPerUsd;
      return amountMxn;
    },
    [currency, rateMxnPerUsd]
  );

  const formatCurrency = useCallback(
    (amountMxn: number, options?: { maxFraction?: number }) => {
      const displayAmount = toDisplayAmount(amountMxn);
      const code = currency;
      return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: code,
        minimumFractionDigits: 0,
        maximumFractionDigits: options?.maxFraction ?? 0,
      }).format(displayAmount);
    },
    [currency, toDisplayAmount]
  );

  const value = useMemo(
    () => ({ currency, setCurrency, rateMxnPerUsd, formatCurrency, toDisplayAmount }),
    [currency, formatCurrency, toDisplayAmount, rateMxnPerUsd]
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    const fallback = (amountMxn: number) =>
      new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(amountMxn);
    return {
      currency: 'MXN' as DisplayCurrency,
      setCurrency: () => {},
      rateMxnPerUsd: USD_TO_MXN,
      formatCurrency: fallback,
      toDisplayAmount: (n: number) => n,
    };
  }
  return ctx;
}
