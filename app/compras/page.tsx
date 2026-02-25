'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon, ShoppingCartIcon, PlusIcon, PencilIcon, TrashIcon, TruckIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useCurrency } from '@/lib/currencyContext';

type Envio = {
  id_envio: string;
  producto: string;
  id_cliente: string;
  id_compra: string;
  tipo_envio: string;
  fecha_envio: string;
  proveedor_logistico: string;
  guia_rastreo: string;
  costo_envio: number;
  origen: string;
  destino: string;
  estado_envio: string;
  fecha_entrega?: string;
};

type Compra = {
  id: string;
  id_compra: string;
  id_producto: string | null;
  producto_nombre: string | null;
  fecha_compra: string | null;
  id_proveedor: string | null;
  tipo_compra: string | null;
  cantidad_compra: number | null;
  costo_unitario: number | null;
  subtotal: number | null;
  estado_pago: string | null;
  pagado_mxn?: number;
  pendiente_mxn?: number;
  tipo_cambio_usd?: number;
};

export default function ComprasPage() {
  const { formatCurrency } = useCurrency();
  const [compras, setCompras] = useState<Compra[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<'cerrado' | 'nuevo' | 'editar'>('cerrado');
  const [editing, setEditing] = useState<Compra | null>(null);
  const [form, setForm] = useState({
    id_compra: '',
    producto_nombre: '',
    id_proveedor: '',
    fecha_compra: new Date().toISOString().slice(0, 10),
    tipo_compra: 'Contado',
    cantidad_compra: '',
    costo_unitario: '',
    subtotal: '',
    estado_pago: 'Pendiente',
  });
  const [saving, setSaving] = useState(false);
  const [envios, setEnvios] = useState<Envio[]>([]);

  const fetchCompras = useCallback(() => {
    setLoading(true);
    fetch('/api/compras', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Error al cargar'))))
      .then((d) => setCompras(d.compras ?? []))
      .catch((e) => setError(e instanceof Error ? e.message : 'Error'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchCompras(); }, [fetchCompras]);

  useEffect(() => {
    fetch('/api/datos', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setEnvios(d.envios ?? []))
      .catch(() => setEnvios([]));
  }, []);

  const openNew = () => {
    setEditing(null);
    setForm({
      id_compra: '',
      producto_nombre: '',
      id_proveedor: '',
      fecha_compra: new Date().toISOString().slice(0, 10),
      tipo_compra: 'Contado',
      cantidad_compra: '',
      costo_unitario: '',
      subtotal: '',
      estado_pago: 'Pendiente',
    });
    setModal('nuevo');
  };

  const openEdit = (c: Compra) => {
    setEditing(c);
    setForm({
      id_compra: c.id_compra,
      producto_nombre: c.producto_nombre ?? '',
      id_proveedor: c.id_proveedor ?? '',
      fecha_compra: c.fecha_compra?.slice(0, 10) ?? '',
      tipo_compra: c.tipo_compra ?? 'Contado',
      cantidad_compra: String(c.cantidad_compra ?? ''),
      costo_unitario: String(c.costo_unitario ?? ''),
      subtotal: String(c.subtotal ?? ''),
      estado_pago: c.estado_pago ?? 'Pendiente',
    });
    setModal('editar');
  };

  const save = async () => {
    if (!form.id_compra) {
      alert('Completa ID compra');
      return;
    }
    setSaving(true);
    try {
      const subtotal = form.subtotal ? parseFloat(form.subtotal.replace(/[^0-9.-]/g, '')) : (parseFloat(form.cantidad_compra.replace(/[^0-9.-]/g, '')) || 0) * (parseFloat(form.costo_unitario.replace(/[^0-9.-]/g, '')) || 0);
      if (modal === 'nuevo') {
        const res = await fetch('/api/compras', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id_compra: form.id_compra,
            producto_nombre: form.producto_nombre || null,
            id_proveedor: form.id_proveedor || null,
            fecha_compra: form.fecha_compra || null,
            tipo_compra: form.tipo_compra,
            cantidad_compra: form.cantidad_compra ? parseFloat(form.cantidad_compra.replace(/[^0-9.-]/g, '')) : null,
            costo_unitario: form.costo_unitario ? parseFloat(form.costo_unitario.replace(/[^0-9.-]/g, '')) : null,
            subtotal: subtotal || null,
            estado_pago: form.estado_pago,
          }),
        });
        if (!res.ok) throw new Error((await res.json()).error);
      } else if (editing) {
        const idParam = editing.id ? `id=${encodeURIComponent(editing.id)}` : `id_compra=${encodeURIComponent(editing.id_compra)}`;
        const res = await fetch(`/api/compras?${idParam}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            id_compra: form.id_compra,
            producto_nombre: form.producto_nombre || null,
            id_proveedor: form.id_proveedor || null,
            fecha_compra: form.fecha_compra || null,
            tipo_compra: form.tipo_compra,
            cantidad_compra: form.cantidad_compra ? parseFloat(form.cantidad_compra.replace(/[^0-9.-]/g, '')) : null,
            costo_unitario: form.costo_unitario ? parseFloat(form.costo_unitario.replace(/[^0-9.-]/g, '')) : null,
            subtotal: subtotal || null,
            estado_pago: form.estado_pago,
          }),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Error ${res.status}`);
        }
      }
      setModal('cerrado');
      fetchCompras();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (compra: Compra) => {
    if (!confirm('¿Eliminar esta compra?')) return;
    try {
      const idParam = compra.id ? `id=${encodeURIComponent(compra.id)}` : `id_compra=${encodeURIComponent(compra.id_compra)}`;
      const res = await fetch(`/api/compras?${idParam}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Error ${res.status}`);
      }
      fetchCompras();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error al eliminar');
    }
  };

  return (
    <main className="min-h-screen page-bg text-slate-50 p-4 md:p-8">
      <div className="max-w-[1400px] mx-auto space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 rounded-lg hover:bg-slate-800 transition-colors">
              <ArrowLeftIcon className="w-6 h-6 text-slate-400" />
            </Link>
            <div className="inline-flex p-3 rounded-xl bg-amber-500/10">
              <ShoppingCartIcon className="h-8 w-8 text-amber-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-100">Compras</h1>
              <p className="text-slate-400">Registra y edita compras a proveedores.</p>
            </div>
          </div>
          <button onClick={openNew} className="btn-primary flex items-center gap-2">
            <PlusIcon className="w-5 h-5" /> Nueva compra
          </button>
        </div>

        {loading && <div className="text-center text-slate-500 py-12">Cargando...</div>}
        {error && <div className="rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 p-4">{error}</div>}

        {!loading && !error && (
          <div className="rounded-xl bg-slate-800/40 border border-slate-700/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-slate-400 bg-slate-800/60">
                  <tr>
                    <th className="py-3 px-4 font-medium">Fecha</th>
                    <th className="py-3 px-4 font-medium">ID Compra</th>
                    <th className="py-3 px-4 font-medium">Producto / Proveedor</th>
                    <th className="py-3 px-4 font-medium text-right">Subtotal</th>
                    <th className="py-3 px-4 font-medium text-right">Pendiente</th>
                    <th className="py-3 px-4 font-medium">Estado</th>
                    <th className="py-3 px-4 w-24">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {compras.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-800/30">
                      <td className="py-3 px-4 text-slate-400">{c.fecha_compra ? format(new Date(c.fecha_compra + 'T12:00:00'), 'd MMM yyyy', { locale: es }) : '—'}</td>
                      <td className="py-3 px-4 font-mono text-slate-200">{c.id_compra}</td>
                      <td className="py-3 px-4 text-slate-300">{c.producto_nombre ?? '—'} {c.id_proveedor && <span className="text-slate-500 text-xs">({c.id_proveedor})</span>}</td>
                      <td className="py-3 px-4 text-right font-mono text-amber-400">{formatCurrency(c.subtotal ?? 0, { rate: c.tipo_cambio_usd })}</td>
                      <td className="py-3 px-4 text-right font-mono text-red-400">{formatCurrency(c.pendiente_mxn ?? 0, { rate: c.tipo_cambio_usd })}</td>
                      <td className="py-3 px-4 text-slate-400">{c.estado_pago ?? '—'}</td>
                      <td className="py-3 px-4 flex gap-2">
                        <button onClick={() => openEdit(c)} className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white" title="Editar"><PencilIcon className="w-4 h-4" /></button>
                        <button onClick={() => remove(c)} className="p-1.5 rounded hover:bg-red-500/20 text-slate-400 hover:text-red-400" title="Eliminar"><TrashIcon className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {compras.length === 0 && (
              <div className="p-12 text-center text-slate-500">No hay compras. Haz clic en &quot;Nueva compra&quot; para registrar.</div>
            )}
          </div>
        )}

        {/* Envíos y logística (antes Contenedores) */}
        <section className="rounded-xl bg-slate-800/40 border border-slate-700/50 overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-700/50 bg-slate-800/60">
            <TruckIcon className="h-6 w-6 text-blue-400" />
            <h2 className="text-lg font-semibold text-slate-200">Envíos y logística</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-slate-400 bg-slate-800/60">
                <tr>
                  <th className="py-3 px-4 font-medium">ID Envío</th>
                  <th className="py-3 px-4 font-medium">Producto</th>
                  <th className="py-3 px-4 font-medium">Cliente</th>
                  <th className="py-3 px-4 font-medium">Tipo</th>
                  <th className="py-3 px-4 font-medium">Origen → Destino</th>
                  <th className="py-3 px-4 font-medium text-right">Costo</th>
                  <th className="py-3 px-4 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {envios.map((e) => (
                  <tr key={e.id_envio} className="hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-mono text-slate-200">{e.id_envio}</td>
                    <td className="py-3 px-4 text-slate-300">{e.producto || '—'}</td>
                    <td className="py-3 px-4 text-slate-400">{e.id_cliente || '—'}</td>
                    <td className="py-3 px-4 text-slate-400">{e.tipo_envio || '—'}</td>
                    <td className="py-3 px-4 text-slate-400">{e.origen || '—'} → {e.destino || '—'}</td>
                    <td className="py-3 px-4 text-right font-mono text-amber-400">{formatCurrency(e.costo_envio ?? 0)}</td>
                    <td className="py-3 px-4 text-slate-400">{e.estado_envio || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {envios.length === 0 && (
            <div className="p-8 text-center text-slate-500 text-sm">
              No hay envíos. Los envíos se cargan desde la tabla <code className="text-blue-400">envios</code> en Supabase.
            </div>
          )}
        </section>
      </div>

      {modal !== 'cerrado' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => !saving && setModal('cerrado')}>
          <div className="bg-slate-800 rounded-xl border border-slate-700 max-w-md w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-slate-100 mb-4">{modal === 'nuevo' ? 'Nueva compra' : 'Editar compra'}</h2>
            <div className="space-y-3">
              <label className="block text-sm text-slate-400">ID Compra *</label>
              <input type="text" value={form.id_compra} onChange={(e) => setForm((f) => ({ ...f, id_compra: e.target.value }))} className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-slate-200" />
              <label className="block text-sm text-slate-400">Producto</label>
              <input type="text" value={form.producto_nombre} onChange={(e) => setForm((f) => ({ ...f, producto_nombre: e.target.value }))} className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-slate-200" />
              <label className="block text-sm text-slate-400">Proveedor (ID o nombre)</label>
              <input type="text" value={form.id_proveedor} onChange={(e) => setForm((f) => ({ ...f, id_proveedor: e.target.value }))} className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-slate-200" />
              <label className="block text-sm text-slate-400">Fecha compra</label>
              <input type="date" value={form.fecha_compra} onChange={(e) => setForm((f) => ({ ...f, fecha_compra: e.target.value }))} className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-slate-200" />
              <label className="block text-sm text-slate-400">Tipo</label>
              <select value={form.tipo_compra} onChange={(e) => setForm((f) => ({ ...f, tipo_compra: e.target.value }))} className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-slate-200">
                <option value="Contado">Contado</option>
                <option value="Crédito">Crédito</option>
              </select>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-slate-400">Cantidad</label>
                  <input type="text" value={form.cantidad_compra} onChange={(e) => setForm((f) => ({ ...f, cantidad_compra: e.target.value }))} className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-slate-200" />
                </div>
                <div>
                  <label className="block text-sm text-slate-400">Costo unit.</label>
                  <input type="text" value={form.costo_unitario} onChange={(e) => setForm((f) => ({ ...f, costo_unitario: e.target.value }))} className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-slate-200" />
                </div>
              </div>
              <label className="block text-sm text-slate-400">Subtotal</label>
              <input type="text" value={form.subtotal} onChange={(e) => setForm((f) => ({ ...f, subtotal: e.target.value }))} className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-slate-200" placeholder="O se calcula de cant × costo" />
              <label className="block text-sm text-slate-400">Estado pago</label>
              <select value={form.estado_pago} onChange={(e) => setForm((f) => ({ ...f, estado_pago: e.target.value }))} className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-slate-200">
                <option value="Pendiente">Pendiente</option>
                <option value="PAGADO">Pagado</option>
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
