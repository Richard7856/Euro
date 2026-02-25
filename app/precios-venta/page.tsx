'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon, DocumentChartBarIcon, PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { PrecioVenta } from '@/types/financial';
import { useCurrency } from '@/lib/currencyContext';
import ExportButtons from '@/components/ExportButtons';

export default function PreciosVentaPage() {
  const { formatCurrency } = useCurrency();
  const [precios, setPrecios] = useState<PrecioVenta[]>([]);
  const [productos, setProductos] = useState<{ id_producto: string; nombre_producto: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<'cerrado' | 'nuevo' | 'editar'>('cerrado');
  const [editing, setEditing] = useState<PrecioVenta | null>(null);
  const [saving, setSaving] = useState(false);
  const [vigenteEn, setVigenteEn] = useState(new Date().toISOString().slice(0, 10));
  const [form, setForm] = useState({
    id_producto: '',
    nombre_producto: '',
    precio_venta: '',
    moneda: 'MXN',
    unidad: 'kg',
    vigente_desde: new Date().toISOString().slice(0, 10),
    vigente_hasta: '',
    origen: 'manual',
  });

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

  const fetchPrecios = useCallback(() => {
    setLoading(true);
    fetch(`/api/precios-venta?vigente_en=${vigenteEn}`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Error al cargar'))))
      .then((d) => setPrecios(d.precios ?? []))
      .catch((e) => setError(e instanceof Error ? e.message : 'Error'))
      .finally(() => setLoading(false));
  }, [vigenteEn]);

  useEffect(() => {
    fetchProductos();
  }, [fetchProductos]);
  useEffect(() => {
    fetchPrecios();
  }, [fetchPrecios]);

  const openNew = () => {
    setEditing(null);
    setForm({
      id_producto: '',
      nombre_producto: '',
      precio_venta: '',
      moneda: 'MXN',
      unidad: 'kg',
      vigente_desde: new Date().toISOString().slice(0, 10),
      vigente_hasta: '',
      origen: 'manual',
    });
    setModal('nuevo');
  };
  const openEdit = (p: PrecioVenta) => {
    setEditing(p);
    setForm({
      id_producto: p.id_producto,
      nombre_producto: p.nombre_producto ?? '',
      precio_venta: String(p.precio_venta ?? ''),
      moneda: p.moneda || 'MXN',
      unidad: p.unidad || 'kg',
      vigente_desde: (p.vigente_desde || '').slice(0, 10),
      vigente_hasta: (p.vigente_hasta || '').slice(0, 10) || '',
      origen: p.origen || 'manual',
    });
    setModal('editar');
  };

  const save = async () => {
    if (!form.id_producto.trim()) {
      alert('Producto es obligatorio');
      return;
    }
    const precio = parseFloat(form.precio_venta.replace(/[^0-9.-]/g, ''));
    if (isNaN(precio) || precio < 0) {
      alert('Precio de venta inválido');
      return;
    }
    setSaving(true);
    try {
      if (modal === 'nuevo') {
        const res = await fetch('/api/precios-venta', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id_producto: form.id_producto.trim(),
            nombre_producto: form.nombre_producto.trim() || null,
            precio_venta: precio,
            moneda: form.moneda || 'MXN',
            unidad: form.unidad || 'kg',
            vigente_desde: form.vigente_desde || null,
            vigente_hasta: form.vigente_hasta || null,
            origen: form.origen,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
      } else if (editing) {
        const res = await fetch(`/api/precios-venta?id=${editing.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id_producto: form.id_producto.trim(),
            nombre_producto: form.nombre_producto.trim() || null,
            precio_venta: precio,
            moneda: form.moneda || 'MXN',
            unidad: form.unidad || 'kg',
            vigente_desde: form.vigente_desde || null,
            vigente_hasta: form.vigente_hasta || null,
            origen: form.origen,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
      }
      setModal('cerrado');
      fetchPrecios();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('¿Eliminar este precio de venta?')) return;
    try {
      const res = await fetch(`/api/precios-venta?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      fetchPrecios();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error al eliminar');
    }
  };

  const formatMoney = (n: number) => formatCurrency(n, { maxFraction: 2 });
  const exportColumns = [
    { key: 'id_producto', label: 'ID Producto' },
    { key: 'nombre_producto', label: 'Producto' },
    { key: 'precio_venta', label: 'Precio venta' },
    { key: 'unidad', label: 'Unidad' },
    { key: 'vigente_desde', label: 'Vigente desde' },
    { key: 'vigente_hasta', label: 'Vigente hasta' },
  ];
  const exportRows = precios.map((p) => ({
    id_producto: p.id_producto,
    nombre_producto: p.nombre_producto || p.id_producto,
    precio_venta: p.precio_venta,
    unidad: p.unidad || 'kg',
    vigente_desde: p.vigente_desde || '',
    vigente_hasta: p.vigente_hasta || '',
  }));

  return (
    <main className="min-h-screen page-bg text-slate-50 p-4 md:p-8">
      <div className="max-w-[1200px] mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 rounded-lg hover:bg-slate-800 transition-colors">
              <ArrowLeftIcon className="w-6 h-6 text-slate-400" />
            </Link>
            <div className="inline-flex p-3 rounded-xl bg-emerald-500/10">
              <DocumentChartBarIcon className="h-8 w-8 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-100">Precios de venta</h1>
              <p className="text-slate-400">Precio final por producto para mostrar al cliente y cotizador</p>
            </div>
          </div>
          <div className="flex gap-2 items-center flex-wrap">
            <ExportButtons title="Precios de venta" columns={exportColumns} rows={exportRows} filenameBase="precios-venta" />
            <Link href="/precios" className="btn-secondary flex items-center gap-2">
              Precios proveedores
            </Link>
            <button onClick={openNew} className="btn-primary flex items-center gap-2">
              <PlusIcon className="w-5 h-5" /> Nuevo precio venta
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <label className="text-slate-400">Vigentes en:</label>
          <input
            type="date"
            value={vigenteEn}
            onChange={(e) => setVigenteEn(e.target.value)}
            className="rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-slate-200"
          />
        </div>

        {error && <div className="rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 p-4">{error}</div>}
        {loading && <div className="text-slate-500 py-8 text-center">Cargando...</div>}

        {!loading && (
          <div className="rounded-xl bg-slate-800/40 border border-slate-700/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-slate-400 bg-slate-800/60">
                  <tr>
                    <th className="py-3 px-4 font-medium">Producto</th>
                    <th className="py-3 px-4 font-medium text-right">Precio venta</th>
                    <th className="py-3 px-4 font-medium">Unidad</th>
                    <th className="py-3 px-4 font-medium">Vigente desde</th>
                    <th className="py-3 px-4 font-medium">Vigente hasta</th>
                    <th className="py-3 px-4 w-24">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {precios.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-800/30">
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-200">{p.nombre_producto || p.id_producto}</span>
                        {p.nombre_producto && <span className="text-slate-500 text-xs block">{p.id_producto}</span>}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-400">{formatMoney(p.precio_venta)}</td>
                      <td className="py-3 px-4 text-slate-500">{p.unidad || 'kg'}</td>
                      <td className="py-3 px-4 text-slate-400">{p.vigente_desde ? format(new Date(p.vigente_desde + 'T12:00:00'), 'd MMM yyyy', { locale: es }) : '—'}</td>
                      <td className="py-3 px-4 text-slate-400">{p.vigente_hasta ? format(new Date(p.vigente_hasta + 'T12:00:00'), 'd MMM yyyy', { locale: es }) : '—'}</td>
                      <td className="py-3 px-4 flex gap-2">
                        <button onClick={() => openEdit(p)} className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white" title="Editar"><PencilIcon className="w-4 h-4" /></button>
                        <button onClick={() => remove(p.id)} className="p-1.5 rounded hover:bg-red-500/20 text-slate-400 hover:text-red-400" title="Eliminar"><TrashIcon className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {precios.length === 0 && (
              <div className="p-12 text-center text-slate-500">
                No hay precios de venta vigentes para esta fecha. Añade uno para mostrar a clientes.
              </div>
            )}
          </div>
        )}
      </div>

      {modal !== 'cerrado' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => !saving && setModal('cerrado')}>
          <div className="bg-slate-800 rounded-xl border border-slate-700 max-w-md w-full p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-slate-100 mb-4">{modal === 'nuevo' ? 'Nuevo precio de venta' : 'Editar precio de venta'}</h2>
            <div className="space-y-3">
              <label className="block text-sm text-slate-400">Producto *</label>
              <select
                value={form.id_producto}
                onChange={(e) => {
                  const pr = productos.find((p) => p.id_producto === e.target.value);
                  setForm((f) => ({ ...f, id_producto: e.target.value, nombre_producto: pr?.nombre_producto ?? '' }));
                }}
                className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-slate-200"
              >
                <option value="">— Seleccionar —</option>
                {productos.map((p) => (
                  <option key={p.id_producto} value={p.id_producto}>{p.nombre_producto} ({p.id_producto})</option>
                ))}
              </select>
              <label className="block text-sm text-slate-400">Nombre producto (opcional)</label>
              <input type="text" value={form.nombre_producto} onChange={(e) => setForm((f) => ({ ...f, nombre_producto: e.target.value }))} className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-slate-200" placeholder="Para mostrar" />
              <label className="block text-sm text-slate-400">Precio de venta *</label>
              <input type="text" value={form.precio_venta} onChange={(e) => setForm((f) => ({ ...f, precio_venta: e.target.value }))} className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-slate-200" placeholder="0" />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm text-slate-400">Moneda</label>
                  <input type="text" value={form.moneda} onChange={(e) => setForm((f) => ({ ...f, moneda: e.target.value }))} className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-slate-200" />
                </div>
                <div>
                  <label className="block text-sm text-slate-400">Unidad</label>
                  <input type="text" value={form.unidad} onChange={(e) => setForm((f) => ({ ...f, unidad: e.target.value }))} className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-slate-200" placeholder="kg" />
                </div>
              </div>
              <label className="block text-sm text-slate-400">Vigente desde</label>
              <input type="date" value={form.vigente_desde} onChange={(e) => setForm((f) => ({ ...f, vigente_desde: e.target.value }))} className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-slate-200" />
              <label className="block text-sm text-slate-400">Vigente hasta (vacío = indefinido)</label>
              <input type="date" value={form.vigente_hasta} onChange={(e) => setForm((f) => ({ ...f, vigente_hasta: e.target.value }))} className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-slate-200" />
              <label className="block text-sm text-slate-400">Origen</label>
              <select value={form.origen} onChange={(e) => setForm((f) => ({ ...f, origen: e.target.value }))} className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-slate-200">
                <option value="manual">Manual</option>
                <option value="markup">Markup</option>
                <option value="referencia">Referencia</option>
              </select>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={save} disabled={saving} className="btn-primary flex-1">{saving ? 'Guardando...' : 'Guardar'}</button>
              <button onClick={() => !saving && setModal('cerrado')} className="btn-secondary">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
