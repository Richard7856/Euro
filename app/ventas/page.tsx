'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon, CurrencyDollarIcon, PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useEmpresaOptional } from '@/lib/empresaContext';

type Cobro = {
  id: string;
  id_venta: string;
  id_producto: string | null;
  canal_cobro: string | null;
  fecha_pago: string;
  metodo_pago: string | null;
  monto_pagado: number;
  evidencia: string | null;
  notas: string | null;
};

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n);

export default function VentasPage() {
  const [cobros, setCobros] = useState<Cobro[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<'cerrado' | 'nuevo' | 'editar'>('cerrado');
  const [editing, setEditing] = useState<Cobro | null>(null);
  const [form, setForm] = useState({
    id_venta: '',
    id_producto: '',
    canal_cobro: 'DANTE',
    fecha_pago: new Date().toISOString().slice(0, 10),
    metodo_pago: 'TRANSFERENCIA',
    monto_pagado: '',
    notas: '',
  });
  const [saving, setSaving] = useState(false);

  const empresa = useEmpresaOptional()?.empresa;

  const fetchCobros = useCallback(() => {
    setLoading(true);
    fetch('/api/cobros', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Error al cargar'))))
      .then((d) => setCobros(d.cobros ?? []))
      .catch((e) => setError(e instanceof Error ? e.message : 'Error'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchCobros(); }, [fetchCobros, empresa]);

  const openNew = () => {
    setEditing(null);
    setForm({
      id_venta: '',
      id_producto: '',
      canal_cobro: 'DANTE',
      fecha_pago: new Date().toISOString().slice(0, 10),
      metodo_pago: 'TRANSFERENCIA',
      monto_pagado: '',
      notas: '',
    });
    setModal('nuevo');
  };

  const openEdit = (c: Cobro) => {
    setEditing(c);
    setForm({
      id_venta: c.id_venta,
      id_producto: c.id_producto ?? '',
      canal_cobro: c.canal_cobro ?? 'DANTE',
      fecha_pago: c.fecha_pago?.slice(0, 10) ?? '',
      metodo_pago: c.metodo_pago ?? 'TRANSFERENCIA',
      monto_pagado: String(c.monto_pagado ?? ''),
      notas: c.notas ?? '',
    });
    setModal('editar');
  };

  const save = async () => {
    if (!form.id_venta || !form.monto_pagado) {
      alert('Completa ID venta y monto');
      return;
    }
    setSaving(true);
    try {
      if (modal === 'nuevo') {
        const res = await fetch('/api/cobros', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id_venta: form.id_venta,
            id_producto: form.id_producto || null,
            canal_cobro: form.canal_cobro,
            fecha_pago: form.fecha_pago,
            metodo_pago: form.metodo_pago,
            monto_pagado: parseFloat(form.monto_pagado.replace(/[^0-9.-]/g, '')) || 0,
            notas: form.notas || null,
          }),
        });
        if (!res.ok) throw new Error((await res.json()).error);
      } else if (editing) {
        const res = await fetch(`/api/cobros?id=${editing.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id_venta: form.id_venta,
            id_producto: form.id_producto || null,
            canal_cobro: form.canal_cobro,
            fecha_pago: form.fecha_pago,
            metodo_pago: form.metodo_pago,
            monto_pagado: parseFloat(form.monto_pagado.replace(/[^0-9.-]/g, '')) || 0,
            notas: form.notas || null,
          }),
        });
        if (!res.ok) throw new Error((await res.json()).error);
      }
      setModal('cerrado');
      fetchCobros();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('¿Eliminar este cobro?')) return;
    try {
      const res = await fetch(`/api/cobros?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).error);
      fetchCobros();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error al eliminar');
    }
  };

  const total = cobros.reduce((s, c) => s + (c.monto_pagado ?? 0), 0);

  return (
    <main className="min-h-screen page-bg text-slate-50 p-4 md:p-8">
      <div className="max-w-[1400px] mx-auto space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 rounded-lg hover:bg-slate-800 transition-colors">
              <ArrowLeftIcon className="w-6 h-6 text-slate-400" />
            </Link>
            <div className="inline-flex p-3 rounded-xl theme-accent-muted-bg">
              <CurrencyDollarIcon className="h-8 w-8 theme-accent" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-100">Ventas (Cobros)</h1>
              <p className="text-slate-400">Registra y edita cobros de ventas.</p>
            </div>
          </div>
          <button onClick={openNew} className="btn-primary flex items-center gap-2">
            <PlusIcon className="w-5 h-5" /> Nueva venta / cobro
          </button>
        </div>

        {!loading && cobros.length > 0 && (
          <div className="rounded-xl bg-slate-800/40 border border-slate-700/50 p-4">
            <span className="text-slate-400 text-sm">Total cobrado </span>
            <span className="text-2xl font-bold theme-accent ml-2">{formatCurrency(total)}</span>
          </div>
        )}

        {loading && <div className="text-center text-slate-500 py-12">Cargando...</div>}
        {error && <div className="rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 p-4">{error}</div>}

        {!loading && !error && (
          <div className="rounded-xl bg-slate-800/40 border border-slate-700/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-slate-400 bg-slate-800/60">
                  <tr>
                    <th className="py-3 px-4 font-medium">Fecha</th>
                    <th className="py-3 px-4 font-medium">ID Venta</th>
                    <th className="py-3 px-4 font-medium">Canal</th>
                    <th className="py-3 px-4 font-medium">Método</th>
                    <th className="py-3 px-4 font-medium text-right">Monto</th>
                    <th className="py-3 px-4 w-24">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {cobros.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-800/30">
                      <td className="py-3 px-4 text-slate-400">{format(new Date(c.fecha_pago + 'T12:00:00'), 'd MMM yyyy', { locale: es })}</td>
                      <td className="py-3 px-4 font-mono text-slate-200">{c.id_venta}</td>
                      <td className="py-3 px-4 text-slate-400">{c.canal_cobro ?? '—'}</td>
                      <td className="py-3 px-4 text-slate-400">{c.metodo_pago ?? '—'}</td>
                      <td className="py-3 px-4 text-right font-mono theme-accent">{formatCurrency(c.monto_pagado)}</td>
                      <td className="py-3 px-4 flex gap-2">
                        <button onClick={() => openEdit(c)} className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white" title="Editar">
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button onClick={() => remove(c.id)} className="p-1.5 rounded hover:bg-red-500/20 text-slate-400 hover:text-red-400" title="Eliminar">
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {cobros.length === 0 && (
              <div className="p-12 text-center text-slate-500">
                No hay cobros. Haz clic en &quot;Nueva venta / cobro&quot; para registrar.
              </div>
            )}
          </div>
        )}
      </div>

      {modal !== 'cerrado' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => !saving && setModal('cerrado')}>
          <div className="bg-slate-800 rounded-xl border border-slate-700 max-w-md w-full p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-slate-100 mb-4">{modal === 'nuevo' ? 'Nueva venta / cobro' : 'Editar cobro'}</h2>
            <div className="space-y-3">
              <label className="block text-sm text-slate-400">ID Venta *</label>
              <input type="text" value={form.id_venta} onChange={(e) => setForm((f) => ({ ...f, id_venta: e.target.value }))} className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-slate-200" placeholder="Ej. V-001" />
              <label className="block text-sm text-slate-400">ID Producto</label>
              <input type="text" value={form.id_producto} onChange={(e) => setForm((f) => ({ ...f, id_producto: e.target.value }))} className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-slate-200" placeholder="Opcional" />
              <label className="block text-sm text-slate-400">Fecha pago</label>
              <input type="date" value={form.fecha_pago} onChange={(e) => setForm((f) => ({ ...f, fecha_pago: e.target.value }))} className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-slate-200" />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-slate-400">Canal</label>
                  <select value={form.canal_cobro} onChange={(e) => setForm((f) => ({ ...f, canal_cobro: e.target.value }))} className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-slate-200">
                    <option value="DANTE">DANTE</option>
                    <option value="EFECTIVO">EFECTIVO</option>
                    <option value="TRANSFERENCIA">TRANSFERENCIA</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400">Método</label>
                  <select value={form.metodo_pago} onChange={(e) => setForm((f) => ({ ...f, metodo_pago: e.target.value }))} className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-slate-200">
                    <option value="TRANSFERENCIA">Transferencia</option>
                    <option value="EFECTIVO">Efectivo</option>
                  </select>
                </div>
              </div>
              <label className="block text-sm text-slate-400">Monto *</label>
              <input type="text" value={form.monto_pagado} onChange={(e) => setForm((f) => ({ ...f, monto_pagado: e.target.value }))} className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-slate-200" placeholder="0" />
              <label className="block text-sm text-slate-400">Notas</label>
              <input type="text" value={form.notas} onChange={(e) => setForm((f) => ({ ...f, notas: e.target.value }))} className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-slate-200" />
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
