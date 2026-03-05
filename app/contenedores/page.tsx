'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon, MapPinIcon, PlusIcon, PencilIcon, TrashIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import ImportModal, { type ImportField } from '@/components/ImportModal';

const ENVIOS_FIELDS: ImportField[] = [
  { key: 'id_envio',            label: 'ID_Envio',            required: true },
  { key: 'producto',            label: 'Producto' },
  { key: 'id_cliente',          label: 'ID_Cliente' },
  { key: 'id_compra',           label: 'ID_Compra' },
  { key: 'tipo_envio',          label: 'Tipo_Envio' },
  { key: 'fecha_envio',         label: 'Fecha_Envio' },
  { key: 'proveedor_logistico', label: 'Proveedor_Logistico' },
  { key: 'guia_rastreo',        label: 'Guía_Rastreo' },
  { key: 'costo_envio',         label: 'Costo_Envio' },
  { key: 'origen',              label: 'Origen' },
  { key: 'destino',             label: 'Destino' },
  { key: 'estado_envio',        label: 'Estado_Envio' },
  { key: 'fecha_entrega',       label: 'Fecha_Entrega' },
];

const ENVIOS_COLUMN_MAP: Record<string, string> = {
  'id_envio': 'id_envio', 'idenvio': 'id_envio',
  'producto': 'producto',
  'id_cliente': 'id_cliente', 'idcliente': 'id_cliente',
  'id_compra': 'id_compra', 'idcompra': 'id_compra',
  'tipo_envio': 'tipo_envio', 'tipoenvio': 'tipo_envio',
  'fecha_envio': 'fecha_envio', 'fechaenvio': 'fecha_envio',
  'proveedor_logistico': 'proveedor_logistico', 'proveedorlogistico': 'proveedor_logistico',
  'guia_rastreo': 'guia_rastreo', 'guiarastreo': 'guia_rastreo', 'guia': 'guia_rastreo',
  'costo_envio': 'costo_envio', 'costoenvio': 'costo_envio',
  'origen': 'origen',
  'destino': 'destino',
  'estado_envio': 'estado_envio', 'estadoenvio': 'estado_envio',
  'fecha_entrega': 'fecha_entrega', 'fechaentrega': 'fecha_entrega',
};
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useCurrency } from '@/lib/currencyContext';
import { useEmpresaOptional } from '@/lib/empresaContext';

type Envio = {
  id_envio: string;
  producto: string | null;
  id_cliente: string | null;
  id_compra: string | null;
  tipo_envio: string | null;
  fecha_envio: string | null;
  proveedor_logistico: string | null;
  guia_rastreo: string | null;
  costo_envio: number | null;
  origen: string | null;
  destino: string | null;
  estado_envio: string | null;
  fecha_entrega: string | null;
};

const ESTADOS = ['Pendiente', 'En tránsito', 'Entregado', 'Cancelado'];

const estadoColor: Record<string, string> = {
  'En tránsito': 'bg-blue-500/20 text-blue-400',
  'Entregado': 'bg-emerald-500/20 text-emerald-400',
  'Cancelado': 'bg-red-500/20 text-red-400',
  'Pendiente': 'bg-amber-500/20 text-amber-400',
};

const inputClass = 'w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2 text-slate-200';

const emptyForm = {
  id_envio: '', producto: '', id_cliente: '', id_compra: '', tipo_envio: 'Compra',
  fecha_envio: new Date().toISOString().slice(0, 10), proveedor_logistico: '', guia_rastreo: '',
  costo_envio: '', origen: '', destino: '', estado_envio: 'Pendiente', fecha_entrega: '',
};

export default function ContenedoresPage() {
  const { formatCurrency } = useCurrency();
  const empresa = useEmpresaOptional()?.empresa ?? 'euromex';
  const [envios, setEnvios] = useState<Envio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<'cerrado' | 'nuevo' | 'editar'>('cerrado');
  const [editing, setEditing] = useState<Envio | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const fetchEnvios = useCallback(() => {
    setLoading(true);
    const headers: Record<string, string> = { 'x-empresa-slug': empresa };
    fetch('/api/envios', { credentials: 'include', headers })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Error al cargar'))))
      .then((d) => setEnvios(d.envios ?? []))
      .catch((e) => setError(e instanceof Error ? e.message : 'Error'))
      .finally(() => setLoading(false));
  }, [empresa]);

  useEffect(() => { fetchEnvios(); }, [fetchEnvios]);

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setModal('nuevo');
  };

  const openEdit = (e: Envio) => {
    setEditing(e);
    setForm({
      id_envio: e.id_envio,
      producto: e.producto ?? '',
      id_cliente: e.id_cliente ?? '',
      id_compra: e.id_compra ?? '',
      tipo_envio: e.tipo_envio ?? 'Compra',
      fecha_envio: e.fecha_envio?.slice(0, 10) ?? '',
      proveedor_logistico: e.proveedor_logistico ?? '',
      guia_rastreo: e.guia_rastreo ?? '',
      costo_envio: String(e.costo_envio ?? ''),
      origen: e.origen ?? '',
      destino: e.destino ?? '',
      estado_envio: e.estado_envio ?? 'Pendiente',
      fecha_entrega: e.fecha_entrega?.slice(0, 10) ?? '',
    });
    setModal('editar');
  };

  const setF = (v: typeof emptyForm) => setForm(v);

  const save = async () => {
    if (!form.id_envio) { alert('Completa ID envío'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        costo_envio: form.costo_envio ? parseFloat(form.costo_envio) : null,
        fecha_envio: form.fecha_envio || null,
        fecha_entrega: form.fecha_entrega || null,
      };
      let res: Response;
      if (modal === 'editar' && editing) {
        res = await fetch(`/api/envios?id=${encodeURIComponent(editing.id_envio)}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/envios', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(payload),
        });
      }
      if (!res.ok) throw new Error((await res.json()).error);
      setModal('cerrado');
      fetchEnvios();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('¿Eliminar este envío?')) return;
    try {
      const res = await fetch(`/api/envios?id=${encodeURIComponent(id)}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error((await res.json()).error);
      fetchEnvios();
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
            <div className="inline-flex p-3 rounded-xl bg-sky-500/10">
              <MapPinIcon className="h-8 w-8 text-sky-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-100">Contenedores y Envíos</h1>
              <p className="text-slate-400">Gestiona envíos, guías de rastreo y logística.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowImport(true)} className="btn-secondary flex items-center gap-2">
              <ArrowUpTrayIcon className="w-5 h-5" /> Importar CSV / XLSX
            </button>
            <button onClick={openNew} className="btn-primary flex items-center gap-2">
              <PlusIcon className="w-5 h-5" /> Nuevo envío
            </button>
          </div>
        </div>

        {loading && <div className="text-center text-slate-500 py-12">Cargando...</div>}
        {error && <div className="rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 p-4">{error}</div>}

        {!loading && !error && (
          <div className="rounded-xl bg-slate-800/40 border border-slate-700/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-slate-400 bg-slate-800/60">
                  <tr>
                    <th className="py-3 px-4 font-medium">ID Envío</th>
                    <th className="py-3 px-4 font-medium">Producto</th>
                    <th className="py-3 px-4 font-medium">Fecha</th>
                    <th className="py-3 px-4 font-medium">Origen → Destino</th>
                    <th className="py-3 px-4 font-medium">Guía</th>
                    <th className="py-3 px-4 font-medium text-right">Costo</th>
                    <th className="py-3 px-4 font-medium">Estado</th>
                    <th className="py-3 px-4 w-24">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {envios.map((e) => (
                    <tr key={e.id_envio} className="hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-mono text-sky-400 text-xs">{e.id_envio}</td>
                      <td className="py-3 px-4 text-slate-200">{e.producto ?? '—'}</td>
                      <td className="py-3 px-4 text-slate-400 text-xs">{e.fecha_envio ? format(new Date(e.fecha_envio + 'T12:00:00'), 'd MMM yyyy', { locale: es }) : '—'}</td>
                      <td className="py-3 px-4 text-slate-400 text-xs">{e.origen ?? '—'} → {e.destino ?? '—'}</td>
                      <td className="py-3 px-4 font-mono text-slate-300 text-xs">{e.guia_rastreo ?? '—'}</td>
                      <td className="py-3 px-4 text-right text-amber-400 font-mono">{formatCurrency(e.costo_envio ?? 0)}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${estadoColor[e.estado_envio ?? ''] ?? 'bg-slate-700 text-slate-400'}`}>
                          {e.estado_envio ?? '—'}
                        </span>
                      </td>
                      <td className="py-3 px-4 flex gap-2">
                        <button onClick={() => openEdit(e)} className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white" title="Editar"><PencilIcon className="w-4 h-4" /></button>
                        <button onClick={() => remove(e.id_envio)} className="p-1.5 rounded hover:bg-red-500/20 text-slate-400 hover:text-red-400" title="Eliminar"><TrashIcon className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {envios.length === 0 && (
              <div className="p-12 text-center text-slate-500">No hay envíos registrados. Haz clic en &quot;Nuevo envío&quot; para agregar.</div>
            )}
          </div>
        )}
      </div>

      {showImport && (
        <ImportModal
          title="Envíos / Logística"
          fields={ENVIOS_FIELDS}
          columnMap={ENVIOS_COLUMN_MAP}
          apiEndpoint="/api/import/envios"
          onClose={() => setShowImport(false)}
          onSuccess={(n) => { setShowImport(false); fetchEnvios(); alert(`✅ ${n} envíos importados`); }}
        />
      )}

      {modal !== 'cerrado' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => !saving && setModal('cerrado')}>
          <div className="bg-slate-800 rounded-xl border border-slate-700 max-w-lg w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto" onClick={(ev) => ev.stopPropagation()}>
            <h2 className="text-xl font-bold text-slate-100 mb-4">{modal === 'nuevo' ? 'Nuevo envío' : 'Editar envío'}</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-sm text-slate-400 mb-1">ID Envío *</label>
                <input type="text" value={form.id_envio} onChange={(e) => setF({ ...form, id_envio: e.target.value })} className={inputClass} disabled={modal === 'editar'} />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Producto</label>
                <input type="text" value={form.producto} onChange={(e) => setF({ ...form, producto: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">ID Cliente</label>
                <input type="text" value={form.id_cliente} onChange={(e) => setF({ ...form, id_cliente: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">ID Compra</label>
                <input type="text" value={form.id_compra} onChange={(e) => setF({ ...form, id_compra: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Tipo envío</label>
                <select value={form.tipo_envio} onChange={(e) => setF({ ...form, tipo_envio: e.target.value })} className={inputClass}>
                  <option value="Compra">Compra</option>
                  <option value="Resguardo">Resguardo</option>
                  <option value="Venta">Venta</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Fecha envío</label>
                <input type="date" value={form.fecha_envio} onChange={(e) => setF({ ...form, fecha_envio: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Fecha entrega</label>
                <input type="date" value={form.fecha_entrega} onChange={(e) => setF({ ...form, fecha_entrega: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Proveedor logístico</label>
                <input type="text" value={form.proveedor_logistico} onChange={(e) => setF({ ...form, proveedor_logistico: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Guía de rastreo</label>
                <input type="text" value={form.guia_rastreo} onChange={(e) => setF({ ...form, guia_rastreo: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Origen</label>
                <input type="text" value={form.origen} onChange={(e) => setF({ ...form, origen: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Destino</label>
                <input type="text" value={form.destino} onChange={(e) => setF({ ...form, destino: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Costo envío (MXN)</label>
                <input type="number" min="0" step="0.01" value={form.costo_envio} onChange={(e) => setF({ ...form, costo_envio: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Estado</label>
                <select value={form.estado_envio} onChange={(e) => setF({ ...form, estado_envio: e.target.value })} className={inputClass}>
                  {ESTADOS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
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
