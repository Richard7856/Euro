'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  BuildingStorefrontIcon,
  PlusIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  CubeIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Bodega } from '@/types/financial';
import { useCurrency } from '@/lib/currencyContext';
import ExportButtons from '@/components/ExportButtons';

type InventarioBodegaRow = {
  id: string;
  bodega_id: string;
  id_producto: string;
  cantidad: number;
  valor_unitario_promedio: number;
  updated_at: string;
  nombre_bodega: string | null;
  nombre_producto: string | null;
};

type MovimientoRow = {
  id: string;
  bodega_id: string;
  id_producto: string;
  tipo: string;
  cantidad: number;
  unidad: string;
  referencia_tipo: string | null;
  referencia_id: string | null;
  observaciones: string | null;
  created_at: string;
};

type ProductoOption = { id_producto: string; nombre_producto: string };

export default function BodegasPage() {
  const { formatCurrency } = useCurrency();
  const [bodegas, setBodegas] = useState<Bodega[]>([]);
  const [productos, setProductos] = useState<ProductoOption[]>([]);
  const [inventario, setInventario] = useState<InventarioBodegaRow[]>([]);
  const [movimientos, setMovimientos] = useState<MovimientoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingInv, setLoadingInv] = useState(false);
  const [loadingMov, setLoadingMov] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bodegaSeleccionada, setBodegaSeleccionada] = useState<string>('');
  const [modalBodega, setModalBodega] = useState(false);
  const [modalMovimiento, setModalMovimiento] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formBodega, setFormBodega] = useState({ nombre: '', codigo: '', direccion: '' });
  const [formMov, setFormMov] = useState({
    tipo: 'entrada' as 'entrada' | 'salida',
    id_producto: '',
    cantidad: '',
    unidad: 'kg',
    referencia_tipo: 'manual' as string,
    referencia_id: '',
    observaciones: '',
  });

  const fetchBodegas = useCallback(() => {
    fetch('/api/bodegas', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Error al cargar'))))
      .then((d) => setBodegas(d.bodegas ?? []))
      .catch((e) => setError(e instanceof Error ? e.message : 'Error'))
      .finally(() => setLoading(false));
  }, []);

  const fetchProductos = useCallback(() => {
    fetch('/api/datos', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        const inv = d.inventario ?? [];
        setProductos(inv.map((p: { id_producto: string; nombre_producto: string }) => ({
          id_producto: p.id_producto,
          nombre_producto: p.nombre_producto || p.id_producto,
        })));
      })
      .catch(() => setProductos([]));
  }, []);

  const fetchInventario = useCallback((bodegaId: string) => {
    if (!bodegaId) {
      setInventario([]);
      return;
    }
    setLoadingInv(true);
    fetch(`/api/inventario-bodega?bodega_id=${encodeURIComponent(bodegaId)}`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setInventario(d.inventario ?? []))
      .catch(() => setInventario([]))
      .finally(() => setLoadingInv(false));
  }, []);

  const fetchMovimientos = useCallback((bodegaId: string) => {
    const url = bodegaId
      ? `/api/movimientos-inventario?bodega_id=${encodeURIComponent(bodegaId)}&limit=80`
      : '/api/movimientos-inventario?limit=80';
    setLoadingMov(true);
    fetch(url, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setMovimientos(d.movimientos ?? []))
      .catch(() => setMovimientos([]))
      .finally(() => setLoadingMov(false));
  }, []);

  useEffect(() => {
    fetchBodegas();
    fetchProductos();
  }, [fetchBodegas, fetchProductos]);

  useEffect(() => {
    if (bodegaSeleccionada) {
      fetchInventario(bodegaSeleccionada);
      fetchMovimientos(bodegaSeleccionada);
    } else {
      setInventario([]);
      fetchMovimientos('');
    }
  }, [bodegaSeleccionada, fetchInventario, fetchMovimientos]);

  const guardarBodega = async () => {
    if (!formBodega.nombre.trim()) {
      alert('El nombre es obligatorio');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/bodegas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: formBodega.nombre.trim(),
          codigo: formBodega.codigo.trim() || null,
          direccion: formBodega.direccion.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setModalBodega(false);
      setFormBodega({ nombre: '', codigo: '', direccion: '' });
      fetchBodegas();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const guardarMovimiento = async () => {
    if (!bodegaSeleccionada) {
      alert('Selecciona una bodega');
      return;
    }
    if (!formMov.id_producto) {
      alert('Selecciona un producto');
      return;
    }
    const cantidad = parseFloat(formMov.cantidad.replace(/[^0-9.-]/g, '')) || 0;
    if (cantidad <= 0) {
      alert('La cantidad debe ser mayor a 0');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/movimientos-inventario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bodega_id: bodegaSeleccionada,
          id_producto: formMov.id_producto,
          tipo: formMov.tipo,
          cantidad,
          unidad: formMov.unidad || 'kg',
          referencia_tipo: formMov.referencia_tipo || 'manual',
          referencia_id: formMov.referencia_id || null,
          observaciones: formMov.observaciones || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setModalMovimiento(false);
      setFormMov({
        tipo: 'entrada',
        id_producto: '',
        cantidad: '',
        unidad: 'kg',
        referencia_tipo: 'manual',
        referencia_id: '',
        observaciones: '',
      });
      fetchInventario(bodegaSeleccionada);
      fetchMovimientos(bodegaSeleccionada);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error al registrar movimiento');
    } finally {
      setSaving(false);
    }
  };

  const totalInventarioBodega = inventario.reduce((s, i) => s + i.cantidad, 0);
  const valorTotalBodega = inventario.reduce((s, i) => s + i.cantidad * i.valor_unitario_promedio, 0);
  const formatNum = (n: number) => n.toLocaleString('es-MX', { maximumFractionDigits: 2 });
  const bodegaNombre = (id: string) => bodegas.find((b) => b.id === id)?.nombre ?? id;
  const exportColumnsInv = [
    { key: 'nombre_producto', label: 'Producto' },
    { key: 'cantidad', label: 'Cantidad' },
    { key: 'valor_unitario_promedio', label: 'Valor unit.' },
    { key: 'valor_total', label: 'Valor total' },
  ];
  const exportRowsInv = inventario.map((i) => ({
    nombre_producto: i.nombre_producto || i.id_producto,
    cantidad: i.cantidad,
    valor_unitario_promedio: i.valor_unitario_promedio,
    valor_total: i.cantidad * i.valor_unitario_promedio,
  }));
  const exportColumnsMov = [
    { key: 'created_at', label: 'Fecha' },
    { key: 'tipo', label: 'Tipo' },
    { key: 'id_producto', label: 'Producto' },
    { key: 'cantidad', label: 'Cantidad' },
    { key: 'observaciones', label: 'Observaciones' },
  ];
  const exportRowsMov = movimientos.map((m) => ({
    created_at: m.created_at,
    tipo: m.tipo,
    id_producto: m.id_producto,
    cantidad: m.cantidad,
    observaciones: m.observaciones || '',
  }));

  return (
    <main className="min-h-screen page-bg text-slate-50 p-4 md:p-8">
      <div className="max-w-[1400px] mx-auto space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 rounded-lg hover:bg-slate-800 transition-colors">
              <ArrowLeftIcon className="w-6 h-6 text-slate-400" />
            </Link>
            <div className="inline-flex p-3 rounded-xl bg-emerald-500/10">
              <BuildingStorefrontIcon className="h-8 w-8 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-100">Bodegas</h1>
              <p className="text-slate-400">Inventario por bodega, entradas y salidas</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setModalBodega(true)} className="btn-primary flex items-center gap-2">
              <PlusIcon className="w-5 h-5" /> Nueva bodega
            </button>
            <button
              onClick={() => bodegaSeleccionada && setModalMovimiento(true)}
              disabled={!bodegaSeleccionada}
              className="btn-secondary flex items-center gap-2 disabled:opacity-50"
            >
              <ArrowDownTrayIcon className="w-5 h-5" /> Entrada / Salida
            </button>
          </div>
        </div>

        {loading && <div className="text-slate-500 py-4">Cargando bodegas...</div>}
        {error && <div className="rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 p-4">{error}</div>}

        {!loading && (
          <>
            <div className="flex flex-wrap items-center gap-4">
              <label className="text-slate-400">Bodega:</label>
              <select
                value={bodegaSeleccionada}
                onChange={(e) => setBodegaSeleccionada(e.target.value)}
                className="rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-slate-200 min-w-[200px]"
              >
                <option value="">— Todas (solo movimientos) —</option>
                {bodegas.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.codigo ? `${b.codigo} – ${b.nombre}` : b.nombre}
                  </option>
                ))}
              </select>
            </div>

            {bodegaSeleccionada && (
              <div className="rounded-xl bg-slate-800/40 border border-slate-700/50 p-4 flex flex-wrap gap-6">
                <div>
                  <div className="text-sm text-slate-400">Total unidades (bodega)</div>
                  <div className="text-2xl font-bold text-slate-100">{formatNum(totalInventarioBodega)}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-400">Valor estimado</div>
                  <div className="text-2xl font-bold text-emerald-400">{formatCurrency(valorTotalBodega)}</div>
                </div>
              </div>
            )}

            {bodegaSeleccionada && (
              <section className="rounded-xl bg-slate-800/40 border border-slate-700/50 overflow-hidden">
                <div className="p-4 border-b border-slate-700/50 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CubeIcon className="h-5 w-5 text-emerald-400" />
                    <h2 className="text-lg font-semibold text-slate-200">Inventario en {bodegaNombre(bodegaSeleccionada)}</h2>
                  </div>
                  <ExportButtons title={`Inventario ${bodegaNombre(bodegaSeleccionada)}`} columns={exportColumnsInv} rows={exportRowsInv} filenameBase="inventario-bodega" />
                </div>
                {loadingInv && <div className="p-6 text-center text-slate-500">Cargando...</div>}
                {!loadingInv && inventario.length === 0 && (
                  <div className="p-8 text-center text-slate-500">Sin inventario en esta bodega. Registra una entrada.</div>
                )}
                {!loadingInv && inventario.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-slate-400 bg-slate-800/60">
                        <tr>
                          <th className="py-3 px-4 font-medium">Producto</th>
                          <th className="py-3 px-4 font-medium text-right">Cantidad</th>
                          <th className="py-3 px-4 font-medium text-right">Valor unit.</th>
                          <th className="py-3 px-4 font-medium text-right">Valor total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700/50">
                        {inventario.map((i) => (
                          <tr key={i.id} className="hover:bg-slate-800/30">
                            <td className="py-3 px-4 font-medium text-slate-200">
                              {i.nombre_producto || i.id_producto}
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-slate-300">{formatNum(i.cantidad)}</td>
                            <td className="py-3 px-4 text-right text-slate-400">
                              {formatCurrency(i.valor_unitario_promedio, { maxFraction: 2 })}
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-emerald-400">
                              {formatCurrency(i.cantidad * i.valor_unitario_promedio)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}

            <section className="rounded-xl bg-slate-800/40 border border-slate-700/50 overflow-hidden">
            <div className="p-4 border-b border-slate-700/50 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ArrowUpTrayIcon className="h-5 w-5 text-blue-400" />
                <h2 className="text-lg font-semibold text-slate-200">
                  Movimientos {bodegaSeleccionada ? `· ${bodegaNombre(bodegaSeleccionada)}` : '(todas)'}
                </h2>
              </div>
              <ExportButtons title="Movimientos inventario" columns={exportColumnsMov} rows={exportRowsMov} filenameBase="movimientos-inventario" />
            </div>
              {loadingMov && <div className="p-6 text-center text-slate-500">Cargando...</div>}
              {!loadingMov && movimientos.length === 0 && (
                <div className="p-8 text-center text-slate-500">No hay movimientos registrados.</div>
              )}
              {!loadingMov && movimientos.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-slate-400 bg-slate-800/60">
                      <tr>
                        <th className="py-3 px-4 font-medium">Fecha</th>
                        {!bodegaSeleccionada && <th className="py-3 px-4 font-medium">Bodega</th>}
                        <th className="py-3 px-4 font-medium">Tipo</th>
                        <th className="py-3 px-4 font-medium">Producto</th>
                        <th className="py-3 px-4 font-medium text-right">Cantidad</th>
                        <th className="py-3 px-4 font-medium">Ref.</th>
                        <th className="py-3 px-4 font-medium">Observaciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                      {movimientos.map((m) => (
                        <tr key={m.id} className="hover:bg-slate-800/30">
                          <td className="py-3 px-4 text-slate-400">
                            {format(new Date(m.created_at), 'd MMM yyyy HH:mm', { locale: es })}
                          </td>
                          {!bodegaSeleccionada && (
                            <td className="py-3 px-4 text-slate-300">{bodegaNombre(m.bodega_id)}</td>
                          )}
                          <td className="py-3 px-4">
                            <span
                              className={
                                m.tipo === 'entrada'
                                  ? 'text-emerald-400'
                                  : m.tipo === 'salida'
                                    ? 'text-amber-400'
                                    : 'text-slate-400'
                              }
                            >
                              {m.tipo === 'entrada' ? 'Entrada' : m.tipo === 'salida' ? 'Salida' : m.tipo}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-300">{m.id_producto}</td>
                          <td className="py-3 px-4 text-right font-mono text-slate-200">
                            {formatNum(m.cantidad)} {m.unidad}
                          </td>
                          <td className="py-3 px-4 text-slate-500 text-xs">
                            {m.referencia_tipo || '—'} {m.referencia_id ? `#${m.referencia_id}` : ''}
                          </td>
                          <td className="py-3 px-4 text-slate-500 max-w-[180px] truncate">{m.observaciones || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </div>

      {modalBodega && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => !saving && setModalBodega(false)}>
          <div className="bg-slate-800 rounded-xl border border-slate-700 max-w-md w-full p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-slate-100 mb-4">Nueva bodega</h2>
            <div className="space-y-3">
              <label className="block text-sm text-slate-400">Nombre *</label>
              <input
                type="text"
                value={formBodega.nombre}
                onChange={(e) => setFormBodega((f) => ({ ...f, nombre: e.target.value }))}
                className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-slate-200"
                placeholder="Ej. Bodega CDMX"
              />
              <label className="block text-sm text-slate-400">Código</label>
              <input
                type="text"
                value={formBodega.codigo}
                onChange={(e) => setFormBodega((f) => ({ ...f, codigo: e.target.value }))}
                className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-slate-200"
                placeholder="Ej. B01"
              />
              <label className="block text-sm text-slate-400">Dirección</label>
              <input
                type="text"
                value={formBodega.direccion}
                onChange={(e) => setFormBodega((f) => ({ ...f, direccion: e.target.value }))}
                className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-slate-200"
                placeholder="Opcional"
              />
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={guardarBodega} disabled={saving} className="btn-primary flex-1">
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
              <button onClick={() => !saving && setModalBodega(false)} className="btn-secondary">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {modalMovimiento && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => !saving && setModalMovimiento(false)}>
          <div className="bg-slate-800 rounded-xl border border-slate-700 max-w-md w-full p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-slate-100 mb-4">Registrar entrada / salida</h2>
            <div className="space-y-3">
              <label className="block text-sm text-slate-400">Tipo</label>
              <select
                value={formMov.tipo}
                onChange={(e) => setFormMov((f) => ({ ...f, tipo: e.target.value as 'entrada' | 'salida' }))}
                className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-slate-200"
              >
                <option value="entrada">Entrada</option>
                <option value="salida">Salida</option>
              </select>
              <label className="block text-sm text-slate-400">Producto *</label>
              <select
                value={formMov.id_producto}
                onChange={(e) => setFormMov((f) => ({ ...f, id_producto: e.target.value }))}
                className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-slate-200"
              >
                <option value="">— Seleccionar —</option>
                {productos.map((p) => (
                  <option key={p.id_producto} value={p.id_producto}>
                    {p.nombre_producto} ({p.id_producto})
                  </option>
                ))}
              </select>
              <label className="block text-sm text-slate-400">Cantidad *</label>
              <input
                type="text"
                value={formMov.cantidad}
                onChange={(e) => setFormMov((f) => ({ ...f, cantidad: e.target.value }))}
                className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-slate-200"
                placeholder="0"
              />
              <label className="block text-sm text-slate-400">Unidad</label>
              <input
                type="text"
                value={formMov.unidad}
                onChange={(e) => setFormMov((f) => ({ ...f, unidad: e.target.value }))}
                className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-slate-200"
                placeholder="kg"
              />
              <label className="block text-sm text-slate-400">Referencia (tipo)</label>
              <select
                value={formMov.referencia_tipo}
                onChange={(e) => setFormMov((f) => ({ ...f, referencia_tipo: e.target.value }))}
                className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-slate-200"
              >
                <option value="manual">Manual</option>
                <option value="compra">Compra</option>
                <option value="venta">Venta</option>
                <option value="ajuste">Ajuste</option>
                <option value="inicial">Inicial</option>
              </select>
              <label className="block text-sm text-slate-400">Referencia (ID compra/venta)</label>
              <input
                type="text"
                value={formMov.referencia_id}
                onChange={(e) => setFormMov((f) => ({ ...f, referencia_id: e.target.value }))}
                className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-slate-200"
                placeholder="Opcional"
              />
              <label className="block text-sm text-slate-400">Observaciones</label>
              <input
                type="text"
                value={formMov.observaciones}
                onChange={(e) => setFormMov((f) => ({ ...f, observaciones: e.target.value }))}
                className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-slate-200"
                placeholder="Opcional"
              />
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={guardarMovimiento} disabled={saving} className="btn-primary flex-1">
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
              <button onClick={() => !saving && setModalMovimiento(false)} className="btn-secondary">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
