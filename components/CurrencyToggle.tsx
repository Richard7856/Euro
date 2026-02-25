'use client';

import { useCurrency } from '@/lib/currencyContext';

export default function CurrencyToggle() {
  const { currency, setCurrency } = useCurrency();
  return (
    <div className="flex rounded-lg bg-slate-800/80 border border-slate-600/50 p-0.5">
      <button
        type="button"
        onClick={() => setCurrency('MXN')}
        className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
          currency === 'MXN' ? 'bg-amber-500/20 text-amber-400' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        MXN
      </button>
      <button
        type="button"
        onClick={() => setCurrency('USD')}
        className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
          currency === 'USD' ? 'bg-amber-500/20 text-amber-400' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        USD
      </button>
    </div>
  );
}
