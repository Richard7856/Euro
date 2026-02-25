'use client';

import { FiltroFecha } from '@/types/financial';
import { CalendarDaysIcon } from '@heroicons/react/24/outline';

interface DateRangeFilterProps {
  value: FiltroFecha;
  onChange: (filtro: FiltroFecha) => void;
}

export default function DateRangeFilter({ value, onChange }: DateRangeFilterProps) {
  const handleDesdeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...value, desde: e.target.value });
  };

  const handleHastaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...value, hasta: e.target.value });
  };

  return (
    <div className="flex flex-wrap items-center gap-4 p-4 rounded-xl bg-slate-800/40 border border-slate-700/50">
      <div className="flex items-center gap-2 text-slate-300">
        <CalendarDaysIcon className="w-5 h-5" />
        <span className="font-medium">Rango de fechas</span>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <div>
          <label className="block text-xs text-slate-500 mb-1">Desde</label>
          <input
            type="date"
            value={value.desde}
            onChange={handleDesdeChange}
            className="px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-600 text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Hasta</label>
          <input
            type="date"
            value={value.hasta}
            onChange={handleHastaChange}
            className="px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-600 text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
      </div>
    </div>
  );
}
