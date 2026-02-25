'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon, PlusIcon, TrashIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { useEmpresaOptional } from '@/lib/empresaContext';

type GastoExtra = { concepto: string; monto_usd: number; nota: string };
type CotizacionGuardada = {
  id: string;
  producto_concepto: string;
  cantidad: number;
  unidad: string;
  costo_compra_total_usd: number;
  gastos_extra: GastoExtra[];
  tipo_cambio_mxn: number;
  moneda_venta: string;
  inversion_final_usd: number;
  costo_unitario_final_usd: number;
  modo_margen: string;
  margen_porcentaje_deseado: number | null;
  precio_venta_unitario: number | null;
  margen_real_porcentaje: number | null;
  created_at: string;
};

const formatUSD = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 4 }).format(n);
const formatMXN = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

const UNIDADES = ['kg', 'ton', 'lb', 'caja', 'unidad', 'L', 'm³'];

export default function CotizadorPage() {
  const empresaContext = useEmpresaOptional();
  const isEuromex = empresaContext?.empresa === 'euromex';

  const [producto, setProducto] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [unidad, setUnidad] = useState('kg');
  const [costoCompraUsd, setCostoCompraUsd] = useState('');
  const [gastos, setGastos] = useState<GastoExtra[]>([
    { concepto: 'Transporte Terrestre', monto_usd: 0, nota: '' },
    { concepto: 'Flete Internacional', monto_usd: 0, nota: '' },
    { concepto: 'Gastos Aduanales', monto_usd: 0, nota: '' },
  ]);
  const [tipoCambio, setTipoCambio] = useState('18');
  const [moneda, setMoneda] = useState<'USD' | 'MXN'>('USD');
  const [modoMargen, setModoMargen] = useState<'porcentaje' | 'precio_fijo'>('porcentaje');
  const [margenPorcentaje, setMargenPorcentaje] = useState('');
  const [precioFijo, setPrecioFijo] = useState('');
  const [guardadas, setGuardadas] = useState<CotizacionGuardada[]>([]);
  const [loadingGuardadas, setLoadingGuardadas] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

  const cantidadNum = Math.max(0, parseFloat(String(cantidad).replace(/[^0-9.-]/g, '')) || 0);
  const costoCompraNum = Math.max(0, parseFloat(String(costoCompraUsd).replace(/[^0-9.-]/g, '')) || 0);
  const tipoCambioNum = Math.max(0.01, parseFloat(String(tipoCambio).replace(/[^0-9.-]/g, '')) || 18);
  const totalGastosUsd = gastos.reduce((s, g) => s + (Number(g.monto_usd) || 0), 0);
  const inversionFinalUsd = costoCompraNum + totalGastosUsd;
  const costoUnitarioOrigen = cantidadNum > 0 ? costoCompraNum / cantidadNum : 0;
  const costoUnitarioFinalUsd = cantidadNum > 0 ? inversionFinalUsd / cantidadNum : 0;

  const margenPctNum = parseFloat(String(margenPorcentaje).replace(/[^0-9.-]/g, '')) || 0;
  const precioFijoNum = parseFloat(String(precioFijo).replace(/[^0-9.-]/g, '')) || 0;

  const precioVentaSugeridoUsd = modoMargen === 'porcentaje' && margenPctNum >= 0
    ? costoUnitarioFinalUsd * (1 + margenPctNum / 100)
    : 0;
  const precioFijoEnUsd = moneda === 'MXN' ? precioFijoNum / tipoCambioNum : precioFijoNum;
  const margenRealPct = modoMargen === 'precio_fijo' && precioFijoNum > 0 && costoUnitarioFinalUsd > 0
    ? ((precioFijoEnUsd - costoUnitarioFinalUsd) / costoUnitarioFinalUsd) * 100
    : null;

  const fetchGuardadas = useCallback(() => {
    if (!isEuromex) return;
    setLoadingGuardadas(true);
    fetch('/api/cotizaciones')
      .then((r) => r.json())
      .then((d) => setGuardadas(d.cotizaciones ?? []))
      .catch(() => setGuardadas([]))
      .finally(() => setLoadingGuardadas(false));
  }, [isEuromex]);

  useEffect(() => {
    fetchGuardadas();
  }, [fetchGuardadas]);

  const addGasto = () => {
    setGastos((prev) => [...prev, { concepto: '', monto_usd: 0, nota: '' }]);
  };

  const updateGasto = (i: number, field: keyof GastoExtra, value: string | number) => {
    setGastos((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: value };
      return next;
    });
  };

  const removeGasto = (i: number) => {
    setGastos((prev) => prev.filter((_, idx) => idx !== i));
  };

  const guardar = async () => {
    if (!isEuromex) {
      setMessage({ type: 'error', text: 'El cotizador solo está disponible para Euromex.' });
      return;
    }
    if (!producto.trim() || cantidadNum <= 0) {
      setMessage({ type: 'error', text: 'Completa producto y cantidad.' });
      return;
    }
    const precioUnit = modoMargen === 'porcentaje'
      ? (moneda === 'MXN' ? precioVentaSugeridoUsd * tipoCambioNum : precioVentaSugeridoUsd)
      : precioFijoNum;
    const margenDeseado = modoMargen === 'porcentaje' ? margenPctNum : null;
    const margenReal = modoMargen === 'precio_fijo' ? margenRealPct : margenPctNum;

    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/cotizaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          producto_concepto: producto.trim(),
          cantidad: cantidadNum,
          unidad,
          costo_compra_total_usd: costoCompraNum,
          gastos_extra: gastos.map((g) => ({
            concepto: g.concepto || 'Gasto',
            monto_usd: Number(g.monto_usd) || 0,
            nota: g.nota || '',
          })),
          tipo_cambio_mxn: tipoCambioNum,
          moneda_venta: moneda,
          inversion_final_usd: inversionFinalUsd,
          costo_unitario_final_usd: costoUnitarioFinalUsd,
          modo_margen: modoMargen,
          margen_porcentaje_deseado: margenDeseado,
          precio_venta_unitario: precioUnit || null,
          margen_real_porcentaje: margenReal != null ? margenReal : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Error al guardar' });
        return;
      }
      setMessage({ type: 'ok', text: 'Cotización guardada. Queda registrado el precio de venta.' });
      fetchGuardadas();
    } catch {
      setMessage({ type: 'error', text: 'Error de conexión' });
    } finally {
      setSaving(false);
    }
  };

  if (!isEuromex) {
    return (
      <main className="min-h-screen text-zinc-50 p-4 md:p-8" style={{ backgroundColor: 'var(--shell-bg)' }}>
        <div className="max-w-2xl mx-auto">
          <Link href="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-zinc-200 mb-6">
            <ArrowLeftIcon className="h-5 w-5" />
            Volver al inicio
          </Link>
          <div className="glass-card p-8 text-center">
            <h1 className="text-xl font-bold text-zinc-200 mb-2">Cotizador</h1>
            <p className="text-zinc-400">
              El cotizador está disponible solo para <strong className="text-zinc-200">Euromex</strong>. Cambia la empresa en el menú para acceder.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen text-zinc-50 p-4 md:p-8" style={{ backgroundColor: 'var(--shell-bg)' }}>
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-zinc-200">
              <ArrowLeftIcon className="h-5 w-5" />
              Inicio
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold gradient-text">Cotizador</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMoneda('USD')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${moneda === 'USD' ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'}`}
            >
              USD
            </button>
            <button
              type="button"
              onClick={() => setMoneda('MXN')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${moneda === 'MXN' ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'}`}
            >
              MXN
            </button>
            <button type="button" onClick={fetchGuardadas} className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-zinc-200" title="Actualizar lista">
              <ArrowPathIcon className="h-5 w-5" />
            </button>
          </div>
        </header>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Columna izquierda: Origen + Gastos */}
          <div className="space-y-6">
            <section className="glass-card p-6">
              <h2 className="text-lg font-semibold text-zinc-200 mb-4">Origen de mercancía</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Producto / Concepto</label>
                  <input
                    type="text"
                    value={producto}
                    onChange={(e) => setProducto(e.target.value)}
                    placeholder="Ej. Mango Tommy Atkins"
                    className="w-full rounded-lg bg-zinc-800/80 border border-zinc-700 px-3 py-2 text-zinc-100 placeholder-zinc-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Cantidad</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={cantidad}
                      onChange={(e) => setCantidad(e.target.value)}
                      placeholder="10000"
                      className="w-full rounded-lg bg-zinc-800/80 border border-zinc-700 px-3 py-2 text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Unidad</label>
                    <select
                      value={unidad}
                      onChange={(e) => setUnidad(e.target.value)}
                      className="w-full rounded-lg bg-zinc-800/80 border border-zinc-700 px-3 py-2 text-zinc-100"
                    >
                      {UNIDADES.map((u) => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Costo total de compra (USD)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={costoCompraUsd}
                    onChange={(e) => setCostoCompraUsd(e.target.value)}
                    placeholder="50000"
                    className="w-full rounded-lg bg-zinc-800/80 border border-zinc-700 px-3 py-2 text-zinc-100"
                  />
                </div>
                {cantidadNum > 0 && costoCompraNum >= 0 && (
                  <p className="text-sm text-zinc-400 pt-1">
                    Costo unitario origen: <span className="text-emerald-400 font-medium">{formatUSD(costoUnitarioOrigen)} USD / {unidad}</span>
                  </p>
                )}
              </div>
            </section>

            <section className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-zinc-200">Gastos logísticos e indirectos</h2>
                <button
                  type="button"
                  onClick={addGasto}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 text-sm font-medium"
                >
                  <PlusIcon className="h-4 w-4" /> Añadir gasto
                </button>
              </div>
              <div className="space-y-3">
                {gastos.map((g, i) => (
                  <div key={i} className="grid grid-cols-[1fr,120px,1fr,auto] gap-2 items-start">
                    <input
                      type="text"
                      value={g.concepto}
                      onChange={(e) => updateGasto(i, 'concepto', e.target.value)}
                      placeholder="Concepto"
                      className="rounded-lg bg-zinc-800/80 border border-zinc-700 px-2 py-1.5 text-sm text-zinc-100"
                    />
                    <input
                      type="text"
                      inputMode="decimal"
                      value={g.monto_usd === 0 ? '' : g.monto_usd}
                      onChange={(e) => updateGasto(i, 'monto_usd', parseFloat(e.target.value.replace(/[^0-9.-]/g, '')) || 0)}
                      placeholder="0"
                      className="rounded-lg bg-zinc-800/80 border border-zinc-700 px-2 py-1.5 text-sm text-zinc-100"
                    />
                    <input
                      type="text"
                      value={g.nota}
                      onChange={(e) => updateGasto(i, 'nota', e.target.value)}
                      placeholder="Nota"
                      className="rounded-lg bg-zinc-800/80 border border-zinc-700 px-2 py-1.5 text-sm text-zinc-100"
                    />
                    <button type="button" onClick={() => removeGasto(i)} className="p-1.5 text-zinc-500 hover:text-red-400">
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-sm text-zinc-400 mt-3">
                Total otros gastos: <span className="text-zinc-200 font-medium">{formatUSD(totalGastosUsd)} USD</span>
              </p>
            </section>
          </div>

          {/* Columna derecha: Análisis + Margen + Guardar */}
          <div className="space-y-6">
            <section className="rounded-xl p-6 bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700">
              <h2 className="text-lg font-semibold text-zinc-100 mb-4">Análisis Euromex</h2>
              <p className="text-sm text-zinc-400 mb-4">Tipo de cambio: <span className="text-zinc-200 font-medium">{formatMXN(tipoCambioNum)} MXN</span></p>
              <div className="space-y-3 mb-6">
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wide">Inversión final proyectada</p>
                  <p className="text-2xl font-bold text-zinc-50">{formatUSD(inversionFinalUsd)} USD</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wide">Costo unitario final</p>
                  <p className="text-xl font-bold text-emerald-400">{formatUSD(costoUnitarioFinalUsd)} / {unidad}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setModoMargen('porcentaje')}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium ${modoMargen === 'porcentaje' ? 'bg-emerald-600 text-white' : 'bg-zinc-700/50 text-zinc-400 hover:text-zinc-200'}`}
                  >
                    % ganancia
                  </button>
                  <button
                    type="button"
                    onClick={() => setModoMargen('precio_fijo')}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium ${modoMargen === 'precio_fijo' ? 'bg-emerald-600 text-white' : 'bg-zinc-700/50 text-zinc-400 hover:text-zinc-200'}`}
                  >
                    Precio fijo
                  </button>
                </div>

                {modoMargen === 'porcentaje' ? (
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Margen de ganancia deseado (%)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={margenPorcentaje}
                      onChange={(e) => setMargenPorcentaje(e.target.value)}
                      placeholder="25"
                      className="w-full rounded-lg bg-zinc-800 border border-zinc-600 px-3 py-2 text-zinc-100"
                    />
                    {margenPctNum >= 0 && costoUnitarioFinalUsd > 0 && (
                      <p className="mt-2 text-sm text-zinc-300">
                        Precio de venta sugerido: <span className="text-emerald-400 font-bold">
                          {moneda === 'USD' ? formatUSD(precioVentaSugeridoUsd) : formatMXN(precioVentaSugeridoUsd * tipoCambioNum)} / {unidad}
                        </span>
                      </p>
                    )}
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Precio de venta por unidad ({moneda})</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={precioFijo}
                      onChange={(e) => setPrecioFijo(e.target.value)}
                      placeholder={moneda === 'USD' ? '6.25' : '125'}
                      className="w-full rounded-lg bg-zinc-800 border border-zinc-600 px-3 py-2 text-zinc-100"
                    />
                    {margenRealPct != null && (
                      <p className="mt-2 text-sm text-zinc-300">
                        Margen: <span className={`font-bold ${margenRealPct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{margenRealPct.toFixed(1)}%</span>
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <input
                  type="text"
                  inputMode="decimal"
                  value={tipoCambio}
                  onChange={(e) => setTipoCambio(e.target.value)}
                  placeholder="20"
                  className="w-24 rounded-lg bg-zinc-800 border border-zinc-600 px-2 py-1.5 text-sm text-zinc-100"
                  title="Tipo de cambio MXN"
                />
                <span className="text-zinc-500 text-sm self-center">MXN por USD</span>
                <button
                  type="button"
                  onClick={guardar}
                  disabled={saving || !producto.trim() || cantidadNum <= 0}
                  className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-500 disabled:opacity-50 disabled:pointer-events-none"
                >
                  {saving ? 'Guardando…' : 'Guardar en BD'}
                </button>
              </div>
            </section>

            {message && (
              <div className={`rounded-lg p-3 text-sm ${message.type === 'ok' ? 'bg-emerald-900/40 text-emerald-200 border border-emerald-700' : 'bg-red-900/40 text-red-200 border border-red-700'}`}>
                {message.text}
              </div>
            )}

            {/* Lista de cotizaciones guardadas */}
            <section className="glass-card p-6">
              <h2 className="text-lg font-semibold text-zinc-200 mb-3">Precios de venta guardados</h2>
              {loadingGuardadas ? (
                <p className="text-zinc-500 text-sm">Cargando…</p>
              ) : guardadas.length === 0 ? (
                <p className="text-zinc-500 text-sm">Aún no hay cotizaciones guardadas.</p>
              ) : (
                <ul className="space-y-2 max-h-64 overflow-y-auto">
                  {guardadas.slice(0, 20).map((c) => (
                    <li key={c.id} className="flex flex-wrap items-baseline justify-between gap-2 py-2 border-b border-zinc-700/50 last:border-0 text-sm">
                      <span className="text-zinc-300 font-medium">{c.producto_concepto}</span>
                      <span className="text-zinc-500">
                        {c.cantidad} {c.unidad} · {c.precio_venta_unitario != null ? (c.moneda_venta === 'MXN' ? formatMXN(c.precio_venta_unitario) : formatUSD(c.precio_venta_unitario)) : '-'} / {c.unidad}
                        {c.margen_real_porcentaje != null && <span className="text-emerald-500 ml-1">({c.margen_real_porcentaje.toFixed(0)}%)</span>}
                        {c.margen_porcentaje_deseado != null && c.margen_real_porcentaje == null && <span className="text-zinc-400 ml-1">({c.margen_porcentaje_deseado}% margen)</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
