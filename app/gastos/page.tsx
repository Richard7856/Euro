'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon, BanknotesIcon, PlusIcon, PencilIcon, TrashIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useEmpresaOptional } from '@/lib/empresaContext';
import { useCurrency } from '@/lib/currencyContext';
import ExportButtons from '@/components/ExportButtons';

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

const AREA_LABELS: Record<string, string> = {
  fumigacion: 'Fumigación',
  empaque: 'Empaque',
  logistica: 'Logística',
  almacenaje: 'Almacén',
  compras: 'Compras',
  operativo: 'Operativo',
  Logística: 'Logística',
  Almacenaje: 'Almacén',
};

type GastoUnificado = {
  tipo: 'gasto';
  id: string;
  fecha: string;
  area: string;
  descripcion: string | null;
  monto: number;
  editable: true;
  original: Gasto;
};
type EnvioUnificado = {
  tipo: 'envio';
  id: string;
  fecha: string;
  area: string;
  descripcion: string;
  monto: number;
  editable: false;
};
function areaLabel(cat: string): string {
  return AREA_LABELS[cat] ?? cat;
}

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
  const [filtroFechaDesde, setFiltroFechaDesde] = useState('');
  const [filtroFechaHasta, setFiltroFechaHasta] = useState('');
  const [filtroArea, setFiltroArea] = useState('');

  const { formatCurrency } = useCurrency();

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

  const totalGastos = gastos.reduce((s, g) => s + g.monto, 0);
  const totalEnvios = envios.reduce((s, e) => s + (e.costo_envio ?? 0), 0);
  const totalGeneral = totalGastos + totalEnvios;

  const filasUnificadas: (GastoUnificado | EnvioUnificado)[] = [
    ...gastos.map((g): GastoUnificado => ({
      tipo: 'gasto',
      id: g.id,
      fecha: g.fecha,
      area: g.categoria,
      descripcion: g.descripcion,
      monto: g.monto,
      editable: true as const,
      original: g,
    })),
    ...envios.map((e): EnvioUnificado => ({
      tipo: 'envio',
      id: e.id_envio,
      fecha: e.fecha_envio ?? '',
      area: String(e.tipo_envio).toLowerCase().includes('resguardo') ? 'Almacenaje' : 'Logística',
      descripcion: [e.producto, e.origen && e.destino ? `${e.origen} → ${e.destino}` : ''].filter(Boolean).join(' · ') || '—',
      monto: e.costo_envio ?? 0,
      editable: false as const,
    })),
  ].sort((a, b) => {
    if (!a.fecha || !b.fecha) return 0;
    return new Date(b.fecha + 'T12:00:00').getTime() - new Date(a.fecha + 'T12:00:00').getTime();
  });

  const filasFiltradas = filasUnificadas.filter((f) => {
    if (filtroArea && areaLabel(f.area) !== filtroArea && f.area !== filtroArea) return false;
    if (filtroFechaDesde && f.fecha && f.fecha < filtroFechaDesde) return false;
    if (filtroFechaHasta && f.fecha && f.fecha > filtroFechaHasta) return false;
    return true;
  });

  const totalFiltrado = filasFiltradas.reduce((s, f) => s + f.monto, 0);
  const exportColumns = [
    { key: 'fecha', label: 'Fecha' },
    { key: 'area', label: 'Área' },
    { key: 'descripcion', label: 'Descripción' },
    { key: 'monto', label: 'Monto' },
  ];
  const exportRows = filasFiltradas.map((f) => ({
    fecha: f.fecha ? format(new Date(f.fecha + 'T12:00:00'), 'yyyy-MM-dd', { locale: es }) : '',
    area: areaLabel(f.area),
    descripcion: f.descripcion || '—',
    monto: f.monto,
  }));

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
          <div className="flex gap-2 flex-wrap">
            <ExportButtons
              title="Gastos"
              columns={exportColumns}
              rows={exportRows}
              filenameBase="gastos"
              getRowCells={(r) => [String(r.fecha), String(r.area), String(r.descripcion), String(r.monto)]}
            />
            <button onClick={openNew} className="btn-primary flex items-center gap-2">
              <PlusIcon className="w-5 h-5" /> Nuevo gasto
            </button>
          </div>
        </div>

        <div className="rounded-xl bg-slate-800/40 border border-slate-700/50 p-4 flex flex-wrap items-center gap-4">
          <FunnelIcon className="w-5 h-5 text-slate-400" />
          <span className="text-slate-400 text-sm">Filtros:</span>
          <input
            type="date"
            value={filtroFechaDesde}
            onChange={(e) => setFiltroFechaDesde(e.target.value)}
            className="rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-slate-200 text-sm"
            placeholder="Desde"
          />
          <input
            type="date"
            value={filtroFechaHasta}
            onChange={(e) => setFiltroFechaHasta(e.target.value)}
            className="rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-slate-200 text-sm"
            placeholder="Hasta"
          />
          <select
            value={filtroArea}
            onChange={(e) => setFiltroArea(e.target.value)}
            className="rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-slate-200 text-sm"
          >
            <option value="">Todas las áreas</option>
            {CATEGORIAS.map((c) => (
              <option key={c} value={areaLabel(c)}>{areaLabel(c)}</option>
            ))}
            <option value="Logística">Logística</option>
            <option value="Almacenaje">Almacenaje</option>
          </select>
        </div>

        {!loading && (gastos.length > 0 || envios.length > 0) && (
          <div className="rounded-xl bg-slate-800/40 border border-slate-700/50 p-6 flex flex-wrap gap-6">
            <div>
              <div className="text-sm text-slate-400">Total (filtrado)</div>
              <div className="text-2xl font-bold text-slate-100">{formatCurrency(totalFiltrado)}</div>
            </div>
            <div>
              <div className="text-sm text-slate-400">Total general</div>
              <div className="text-lg text-slate-300">{formatCurrency(totalGeneral)}</div>
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
                    <th className="py-3 px-4 font-medium">Área</th>
                    <th className="py-3 px-4 font-medium">Descripción</th>
                    <th className="py-3 px-4 font-medium text-right">Monto</th>
                    <th className="py-3 px-4 w-24">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {filasFiltradas.map((f) => (
                    <tr key={f.tipo === 'gasto' ? f.id : `envio-${f.id}`} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 text-slate-400">
                        {f.fecha ? format(new Date(f.fecha + 'T12:00:00'), 'd MMM yyyy', { locale: es }) : '—'}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-200">{areaLabel(f.area)}</td>
                      <td className="py-3 px-4 text-slate-400">{f.descripcion || '—'}</td>
                      <td className="py-3 px-4 text-right font-mono text-amber-400">{formatCurrency(f.monto)}</td>
                      <td className="py-3 px-4">
                        {f.editable ? (
                          <div className="flex gap-2">
                            <button onClick={() => openEdit(f.original)} className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white" title="Editar"><PencilIcon className="w-4 h-4" /></button>
                            <button onClick={() => remove(f.id)} className="p-1.5 rounded hover:bg-red-500/20 text-slate-400 hover:text-red-400" title="Eliminar"><TrashIcon className="w-4 h-4" /></button>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-xs">envío</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filasFiltradas.length === 0 && !loadingEnvios && (
              <div className="p-12 text-center text-slate-500">
                No hay gastos. Haz clic en &quot;Nuevo gasto&quot; o escribe en el chat: <code className="text-amber-400">gasto flete 5000 transporte</code>. Los costos de logística y almacén aparecen aquí si hay envíos registrados.
              </div>
            )}
            {(loading || loadingEnvios) && filasFiltradas.length === 0 && (
              <div className="p-12 text-center text-slate-500">Cargando...</div>
            )}
          </div>
        )}
      </div>

      {modal !== 'cerrado' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => !saving && setModal('cerrado')}>
          <div className="bg-slate-800 rounded-xl border border-slate-700 max-w-md w-full p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-slate-100 mb-4">{modal === 'nuevo' ? 'Nuevo gasto' : 'Editar gasto'}</h2>
            <div className="space-y-3">
              <label className="block text-sm text-slate-400">Área (tipo de gasto)</label>
              <select value={form.categoria} onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))} className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-slate-200">
                {CATEGORIAS.map((cat) => (
                  <option key={cat} value={cat}>{areaLabel(cat)}</option>
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
