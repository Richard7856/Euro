'use client';

import { useState, useEffect } from 'react';
import { useCurrency } from '@/lib/currencyContext';
import { useProfileOptional } from '@/lib/profileContext';
import { PencilIcon } from '@heroicons/react/24/outline';

export default function CurrencyRateAdmin() {
  const { rateMxnPerUsd, refetchRate } = useCurrency();
  const profile = useProfileOptional()?.profile;
  const isAdmin = profile?.rol === 'admin';
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(String(rateMxnPerUsd));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setValue(String(rateMxnPerUsd));
  }, [rateMxnPerUsd, open]);

  if (!isAdmin) return null;

  const save = async () => {
    const num = parseFloat(value.replace(',', '.'));
    if (!Number.isFinite(num) || num <= 0) {
      setError('Escribe un número positivo');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usd_to_mxn: num }),
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Error al guardar');
        return;
      }
      await refetchRate();
      setOpen(false);
    } catch {
      setError('Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-zinc-500">1 USD</span>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-xs text-zinc-400 hover:text-amber-400 flex items-center gap-1"
          title="Editar tipo de cambio (admin)"
        >
          {rateMxnPerUsd} MXN
          <PencilIcon className="w-3.5 h-3.5" />
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => !saving && setOpen(false)}>
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 w-full max-w-xs shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-slate-100 mb-2">Tipo de cambio USD → MXN</h3>
            <p className="text-sm text-slate-400 mb-4">1 USD = ___ MXN (para mostrar montos en dólares)</p>
            <input
              type="text"
              inputMode="decimal"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2 text-slate-200 mb-2"
              placeholder="18"
            />
            {error && <p className="text-sm text-red-400 mb-2">{error}</p>}
            <div className="flex gap-2">
              <button onClick={save} disabled={saving} className="btn-primary flex-1 text-sm py-2">
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
              <button type="button" onClick={() => !saving && setOpen(false)} className="btn-secondary text-sm py-2">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
