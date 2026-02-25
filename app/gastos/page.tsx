'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon, BanknotesIcon, PlusIcon, PencilIcon, TrashIcon, TruckIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useEmpresaOptional } from '@/lib/empresaContext';

type Gasto = {
  id: string;
  categoria: string;
  monto: number;
  descripcion: string | null;
  fecha: string;
  created_at: string;
};

type EnvioGasto = {
  id_envio: string;
  producto: string;
  id_cliente: string;
  tipo_envio: string;
  costo_envio: number;
  origen: string;
  destino: string;
  fecha_envio?: string;
};

const CATEGORIAS = ['fumigacion', 'empaque', 'logistica', 'almacenaje', 'compras', 'operativo'];

export default function GastosPage() {
  const empresa = useEmpresaOptional()?.empresa;
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [envios, setEnvios] = useState<EnvioGasto[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingEnvios, setLoadingEnvios] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<'cerrado' | 'nuevo' | 'editar'>('cerrado');
  const [editing, setEditing] = useState<Gasto | null>(null);
  const [form, setForm] = useState({
    categoria: 'operativo',
    monto: '',
    descripcion: '',
    fecha: new Date().toISOString().slice(0, 10),
  });
  const [saving, setSaving] = useState(false);

  const fetchGastos = useCallback(() => {
    setLoading(true);
    fetch('/api/gastos', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Error al cargar'))))
      .then((d) => setGastos(d.gastos ?? []))
      .catch((e) => setError(e instanceof Error ? e.message : 'Error'))
      .finally(() => setLoading(false));
  }, []);

  const fetchEnvios = useCallback(() => {
    setLoadingEnvios(true);
    fetch('/api/datos', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Error al cargar envíos'))))
      .then((d) => setEnvios(d.envios ?? []))
      .catch(() => setEnvios([]))
      .finally(() => setLoadingEnvios(false));
  }, []);

  useEffect(() => { fetchGastos(); }, [fetchGastos, empresa]);
  useEffect(() => { fetchEnvios(); }, [fetchEnvios, empresa]);

  const openNew = () => {
    setEditing(null);
    setForm({
      categoria: 'operativo',
      monto: '',
      descripcion: '',
      fecha: new Date().toISOString().slice(0, 10),
    });
    setModal('nuevo');
  };

  const openEdit = (g: Gasto) => {
    setEditing(g);
    setForm({
      categoria: g.categoria,
      monto: String(g.monto ?? ''),
      descripcion: g.descripcion ?? '',
      fecha: g.fecha?.slice(0, 10) ?? '',
    });
    setModal('editar');
  };

  const save = async () => {
    if (!form.monto) {
      alert('Indica el monto');
      return;
    }
    setSaving(true);
    try {
      const monto = parseFloat(form.monto.replace(/[^0-9.-]/g, '')) || 0;
      if (modal === 'nuevo') {
        const res = await fetch('/api/gastos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            categoria: form.categoria,
            monto,
            descripcion: form.descripcion || null,
            fecha: form.fecha || null,
          }),
        });
        if (!res.ok) throw new Error((await res.json()).error);
      } else if (editing) {
        const res = await fetch(`/api/gastos?id=${editing.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            categoria: form.categoria,
            monto,
            descripcion: form.descripcion || null,
            fecha: form.fecha || null,
          }),
        });
        if (!res.ok) throw new Error((await res.json()).error);
      }
      setModal('cerrado');
      fetchGastos();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('¿Eliminar este gasto?')) return;
    try {
      const res = await fetch(`/api/gastos?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).error);
      fetchGastos();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error al eliminar');
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
  const totalGastos = gastos.reduce((s, g) => s + g.monto, 0);
  const totalEnvios = envios.reduce((s, e) => s + (e.costo_envio ?? 0), 0);
  const tipoLabel = (t: string) => (String(t).toLowerCase().includes('resguardo') ? 'Almacenaje' : 'Logística');

  return (
    <main className="min-h-screen page-bg text-slate-50 p-4 md:p-8">
      <div className="max-w-[1200px] mx-auto space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 rounded-lg hover:bg-slate-800 transition-colors">
              <ArrowLeftIcon className="w-6 h-6 text-slate-400" />
            </Link>
            <div className="inline-flex p-3 rounded-xl bg-amber-500/10">
              <BanknotesIcon className="h-8 w-8 text-amber-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-100">Gastos</h1>
              <p className="text-slate-400">Registra, edita y elimina gastos. También puedes usar el chat: gasto categoria monto</p>
            </div>
          </div>
          <button onClick={openNew} className="btn-primary flex items-center gap-2">
            <PlusIcon className="w-5 h-5" /> Nuevo gasto
          </button>
        </div>

        {!loading && (gastos.length > 0 || envios.length > 0) && (
          <div className="rounded-xl bg-slate-800/40 border border-slate-700/50 p-6 flex flex-wrap gap-6">
            <div>
              <div className="text-sm text-slate-400">Total gastos (categorías)</div>
              <div className="text-2xl font-bold text-amber-400">{formatCurrency(totalGastos)}</div>
            </div>
            <div>
              <div className="text-sm text-slate-400">Total logística y almacenaje (envíos)</div>
              <div className="text-2xl font-bold text-blue-400">{formatCurrency(totalEnvios)}</div>
            </div>
            <div>
              <div className="text-sm text-slate-400">Total general</div>
              <div className="text-2xl font-bold text-slate-100">{formatCurrency(totalGastos + totalEnvios)}</div>
            </div>
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
                    <th className="py-3 px-4 font-medium">Categoría</th>
                    <th className="py-3 px-4 font-medium">Descripción</th>
                    <th className="py-3 px-4 font-medium text-right">Monto</th>
                    <th className="py-3 px-4 w-24">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {gastos.map((g) => (
                    <tr key={g.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 text-slate-400">{format(new Date(g.fecha + 'T12:00:00'), 'd MMM yyyy', { locale: es })}</td>
                      <td className="py-3 px-4 font-medium text-slate-200">{g.categoria}</td>
                      <td className="py-3 px-4 text-slate-400">{g.descripcion || '—'}</td>
                      <td className="py-3 px-4 text-right font-mono text-amber-400">{formatCurrency(g.monto)}</td>
                      <td className="py-3 px-4 flex gap-2">
                        <button onClick={() => openEdit(g)} className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white" title="Editar"><PencilIcon className="w-4 h-4" /></button>
                        <button onClick={() => remove(g.id)} className="p-1.5 rounded hover:bg-red-500/20 text-slate-400 hover:text-red-400" title="Eliminar"><TrashIcon className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {gastos.length === 0 && (
              <div className="p-12 text-center text-slate-500">
                No hay gastos. Haz clic en &quot;Nuevo gasto&quot; o escribe en el chat: <code className="text-amber-400">gasto flete 5000 transporte</code>
              </div>
            )}
          </div>
        )}

        {/* Logística y almacenaje (desde envíos) */}
        <section className="rounded-xl bg-slate-800/40 border border-slate-700/50 overflow-hidden">
          <div className="p-4 border-b border-slate-700/50 flex items-center gap-2">
            <TruckIcon className="h-5 w-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-slate-200">Logística y almacenaje (envíos)</h2>
          </div>
          {loadingEnvios && <div className="p-6 text-center text-slate-500">Cargando envíos...</div>}
          {!loadingEnvios && envios.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-slate-400 bg-slate-800/60">
                  <tr>
                    <th className="py-3 px-4 font-medium">ID</th>
                    <th className="py-3 px-4 font-medium">Producto</th>
                    <th className="py-3 px-4 font-medium">Tipo</th>
                    <th className="py-3 px-4 font-medium">Origen → Destino</th>
                    <th className="py-3 px-4 font-medium text-right">Costo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {envios.map((e) => (
                    <tr key={e.id_envio} className="hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-mono text-slate-300">{e.id_envio}</td>
                      <td className="py-3 px-4 text-slate-300">{e.producto || '—'}</td>
                      <td className="py-3 px-4 text-slate-400">{tipoLabel(e.tipo_envio)}</td>
                      <td className="py-3 px-4 text-slate-400">{e.origen || '—'} → {e.destino || '—'}</td>
                      <td className="py-3 px-4 text-right font-mono text-blue-400">{formatCurrency(e.costo_envio ?? 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="p-3 border-t border-slate-700/50 text-right text-slate-300 font-medium">
                Subtotal envíos: {formatCurrency(totalEnvios)}
              </div>
            </div>
          )}
          {!loadingEnvios && envios.length === 0 && (
            <div className="p-8 text-center text-slate-500 text-sm">
              No hay envíos. Los costos de logística y almacenaje se registran en la tabla <strong>envíos</strong> (p. ej. en Contenedores o vía migración).
            </div>
          )}
        </section>
      </div>

      {modal !== 'cerrado' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => !saving && setModal('cerrado')}>
          <div className="bg-slate-800 rounded-xl border border-slate-700 max-w-md w-full p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-slate-100 mb-4">{modal === 'nuevo' ? 'Nuevo gasto' : 'Editar gasto'}</h2>
            <div className="space-y-3">
              <label className="block text-sm text-slate-400">Categoría</label>
              <select value={form.categoria} onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))} className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-slate-200">
                {CATEGORIAS.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <label className="block text-sm text-slate-400">Monto *</label>
              <input type="text" value={form.monto} onChange={(e) => setForm((f) => ({ ...f, monto: e.target.value }))} className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-slate-200" placeholder="0" />
              <label className="block text-sm text-slate-400">Descripción</label>
              <input type="text" value={form.descripcion} onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))} className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-slate-200" />
              <label className="block text-sm text-slate-400">Fecha</label>
              <input type="date" value={form.fecha} onChange={(e) => setForm((f) => ({ ...f, fecha: e.target.value }))} className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-slate-200" />
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
