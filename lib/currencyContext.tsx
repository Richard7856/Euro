'use client';

import { createContext, useContext, useState, useCallback, useMemo, useEffect, type ReactNode } from 'react';
import { USD_TO_MXN as DEFAULT_USD_TO_MXN } from '@/lib/currency';

export type DisplayCurrency = 'MXN' | 'USD';

export type FormatCurrencyOptions = { maxFraction?: number; /** Rate al guardar el registro; si no se pasa, se usa el global (solo nuevos) */ rate?: number };

type CurrencyContextValue = {
  currency: DisplayCurrency;
  setCurrency: (c: DisplayCurrency) => void;
  rateMxnPerUsd: number;
  refetchRate: () => Promise<void>;
  formatCurrency: (amountMxn: number, options?: FormatCurrencyOptions) => string;
  toDisplayAmount: (amountMxn: number, rate?: number) => number;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<DisplayCurrency>('MXN');
  const [rateMxnPerUsd, setRateMxnPerUsd] = useState(DEFAULT_USD_TO_MXN);

  const refetchRate = useCallback(async () => {
    try {
      const res = await fetch('/api/config', { credentials: 'include' });
      if (res.ok) {
        const d = await res.json();
        const r = Number(d?.usd_to_mxn);
        if (Number.isFinite(r) && r > 0) setRateMxnPerUsd(r);
      }
    } catch {
      // keep current or default
    }
  }, []);

  useEffect(() => {
    refetchRate();
  }, [refetchRate]);

  const toDisplayAmount = useCallback(
    (amountMxn: number, rate?: number) => {
      const r = rate != null && rate > 0 ? rate : rateMxnPerUsd;
      if (currency === 'USD') return amountMxn / r;
      return amountMxn;
    },
    [currency, rateMxnPerUsd]
  );

  const formatCurrency = useCallback(
    (amountMxn: number, options?: FormatCurrencyOptions) => {
      const rate = options?.rate;
      const displayAmount = toDisplayAmount(amountMxn, rate);
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
    () => ({ currency, setCurrency, rateMxnPerUsd, refetchRate, formatCurrency, toDisplayAmount }),
    [currency, formatCurrency, toDisplayAmount, rateMxnPerUsd, refetchRate]
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
      rateMxnPerUsd: DEFAULT_USD_TO_MXN,
      refetchRate: async () => {},
      formatCurrency: fallback,
      toDisplayAmount: (n: number) => n,
    };
  }
  return ctx;
}
