'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  CurrencyDollarIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  FunnelIcon,
  DocumentChartBarIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { PrecioProveedor } from '@/types/financial';
import { useCurrency } from '@/lib/currencyContext';
import ExportButtons from '@/components/ExportButtons';
import { USD_TO_MXN } from '@/lib/currency';

const FUENTES: { value: string; label: string }[] = [
  { value: 'manual', label: 'Manual' },
  { value: 'importacion', label: 'Importación' },
  { value: 'api', label: 'API' },
  { value: 'email', label: 'Email' },
  { value: 'whatsapp', label: 'WhatsApp' },
];

export default function PreciosProveedorPage() {
  const { formatCurrency } = useCurrency();
  const [precios, setPrecios] = useState<PrecioProveedor[]>([]);
  const [proveedores, setProveedores] = useState<{ id_proveedor: string; nombre_proveedor: string }[]>([]);
  const [productos, setProductos] = useState<{ id_producto: string; nombre_producto: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vistaUltimos, setVistaUltimos] = useState(false);
  const [filtroProveedor, setFiltroProveedor] = useState('');
  const [filtroProducto, setFiltroProducto] = useState('');
  const [filtroFechaDesde, setFiltroFechaDesde] = useState('');
  const [filtroFechaHasta, setFiltroFechaHasta] = useState('');
  const [modal, setModal] = useState<'cerrado' | 'nuevo' | 'editar'>('cerrado');
  const [editing, setEditing] = useState<PrecioProveedor | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    id_proveedor: '',
    nombre_proveedor: '',
    id_producto: '',
    concepto: '',
    precio: '',
    moneda: 'MXN',
    unidad: 'kg',
    fecha: new Date().toISOString().slice(0, 10),
    fuente: 'manual',
    referencia: '',
    observaciones: '',
  });

  const fetchProveedores = useCallback(() => {
    fetch('/api/proveedores', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setProveedores(d.proveedores ?? []))
      .catch(() => setProveedores([]));
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

  const fetchPrecios = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (vistaUltimos) params.set('ultimos', 'true');
    if (filtroProveedor) params.set('id_proveedor', filtroProveedor);
    if (filtroProducto) params.set('id_producto', filtroProducto);
    if (filtroFechaDesde) params.set('fecha_desde', filtroFechaDesde);
    if (filtroFechaHasta) params.set('fecha_hasta', filtroFechaHasta);
    params.set('limit', '300');
    fetch(`/api/precios-proveedor?${params}`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Error al cargar'))))
      .then((d) => setPrecios(d.precios ?? []))
      .catch((e) => setError(e instanceof Error ? e.message : 'Error'))
      .finally(() => setLoading(false));
  }, [vistaUltimos, filtroProveedor, filtroProducto, filtroFechaDesde, filtroFechaHasta]);

  useEffect(() => {
    fetchProveedores();
    fetchProductos();
  }, [fetchProveedores, fetchProductos]);
  useEffect(() => {
    fetchPrecios();
  }, [fetchPrecios]);

  const openNew = () => {
    setEditing(null);
    setForm({
      id_proveedor: '',
      nombre_proveedor: '',
      id_producto: '',
      concepto: '',
      precio: '',
      moneda: 'MXN',
      unidad: 'kg',
      fecha: new Date().toISOString().slice(0, 10),
      fuente: 'manual',
      referencia: '',
      observaciones: '',
    });
    setModal('nuevo');
  };
  const openEdit = (p: PrecioProveedor) => {
    setEditing(p);
    setForm({
      id_proveedor: p.id_proveedor,
      nombre_proveedor: p.nombre_proveedor ?? '',
      id_producto: p.id_producto ?? '',
      concepto: p.concepto ?? '',
      precio: String(p.precio ?? ''),
      moneda: p.moneda || 'MXN',
      unidad: p.unidad || 'kg',
      fecha: (p.fecha || '').slice(0, 10),
      fuente: p.fuente || 'manual',
      referencia: p.referencia ?? '',
      observaciones: p.observaciones ?? '',
    });
    setModal('editar');
  };

  const save = async () => {
    if (!form.id_proveedor.trim()) {
      alert('Proveedor es obligatorio');
      return;
    }
    const precio = parseFloat(form.precio.replace(/[^0-9.-]/g, ''));
    if (isNaN(precio) || precio < 0) {
      alert('Precio inválido');
      return;
    }
    setSaving(true);
    try {
      if (modal === 'nuevo') {
        const res = await fetch('/api/precios-proveedor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id_proveedor: form.id_proveedor.trim(),
            nombre_proveedor: form.nombre_proveedor.trim() || null,
            id_producto: form.id_producto.trim() || null,
            concepto: form.concepto.trim() || null,
            precio,
            moneda: form.moneda || 'MXN',
            unidad: form.unidad || 'kg',
            fecha: form.fecha || null,
            fuente: form.fuente,
            referencia: form.referencia.trim() || null,
            observaciones: form.observaciones.trim() || null,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
      } else if (editing) {
        const res = await fetch(`/api/precios-proveedor?id=${editing.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id_proveedor: form.id_proveedor.trim(),
            nombre_proveedor: form.nombre_proveedor.trim() || null,
            id_producto: form.id_producto.trim() || null,
            concepto: form.concepto.trim() || null,
            precio,
            moneda: form.moneda || 'MXN',
            unidad: form.unidad || 'kg',
            fecha: form.fecha || null,
            fuente: form.fuente,
            referencia: form.referencia.trim() || null,
            observaciones: form.observaciones.trim() || null,
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
    if (!confirm('¿Eliminar este registro de precio?')) return;
    try {
      const res = await fetch(`/api/precios-proveedor?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      fetchPrecios();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error al eliminar');
    }
  };

  const toMxn = (n: number, moneda: string) => (moneda && String(moneda).toUpperCase() === 'USD' ? n * USD_TO_MXN : n);
  const formatMoney = (n: number, moneda: string, rate?: number) => formatCurrency(toMxn(n, moneda), { maxFraction: 2, rate });
  const productoConcepto = (p: PrecioProveedor) => p.id_producto || p.concepto || '—';

  const exportColumns = [
    { key: 'fecha', label: 'Fecha' },
    { key: 'proveedor', label: 'Proveedor' },
    { key: 'producto_concepto', label: 'Producto / Concepto' },
    { key: 'precio', label: 'Precio' },
    { key: 'moneda', label: 'Moneda' },
    { key: 'fuente', label: 'Fuente' },
  ];
  const exportRows = precios.map((p) => ({
    fecha: p.fecha || '',
    proveedor: p.nombre_proveedor || p.id_proveedor,
    producto_concepto: productoConcepto(p),
    precio: p.precio,
    moneda: p.moneda || 'MXN',
    fuente: p.fuente || '',
  }));

  return (
    <main className="min-h-screen page-bg text-slate-50 p-4 md:p-8">
      <div className="max-w-[1400px] mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 rounded-lg hover:bg-slate-800 transition-colors">
              <ArrowLeftIcon className="w-6 h-6 text-slate-400" />
            </Link>
            <div className="inline-flex p-3 rounded-xl bg-amber-500/10">
              <CurrencyDollarIcon className="h-8 w-8 text-amber-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-100">Precios de proveedores</h1>
              <p className="text-slate-400">Recibidos por día o semana; ver todos o solo los últimos por producto/proveedor. Para recibir precios desde fuera (sin entrar al dash): POST /api/precios-proveedor/ingest con header X-Precios-Api-Key.</p>
            </div>
          </div>
          <div className="flex gap-2 items-center flex-wrap">
            <ExportButtons title="Precios proveedores" columns={exportColumns} rows={exportRows} filenameBase="precios-proveedor" />
            <Link href="/precios-venta" className="btn-secondary flex items-center gap-2">
              <DocumentChartBarIcon className="w-5 h-5" /> Precios de venta
            </Link>
            <button onClick={openNew} className="btn-primary flex items-center gap-2">
              <PlusIcon className="w-5 h-5" /> Nuevo precio
            </button>
          </div>
        </div>

        <div className="rounded-xl bg-slate-800/40 border border-slate-700/50 p-4 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <FunnelIcon className="w-5 h-5 text-slate-400" />
            <span className="text-slate-400 text-sm">Vista:</span>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={!vistaUltimos}
              onChange={() => setVistaUltimos(false)}
              className="rounded border-slate-600 text-amber-500 focus:ring-amber-500"
            />
            <span className="text-slate-300">Todos</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={vistaUltimos}
              onChange={() => setVistaUltimos(true)}
              className="rounded border-slate-600 text-amber-500 focus:ring-amber-500"
            />
            <span className="text-slate-300">Últimos (uno por proveedor + producto/concepto)</span>
          </label>
          <select
            value={filtroProveedor}
            onChange={(e) => setFiltroProveedor(e.target.value)}
            className="rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-slate-200 text-sm"
          >
            <option value="">Todos los proveedores</option>
            {proveedores.map((pr) => (
              <option key={pr.id_proveedor} value={pr.id_proveedor}>{pr.nombre_proveedor || pr.id_proveedor}</option>
            ))}
          </select>
          <select
            value={filtroProducto}
            onChange={(e) => setFiltroProducto(e.target.value)}
            className="rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-slate-200 text-sm"
          >
            <option value="">Todos los productos</option>
            {productos.map((p) => (
              <option key={p.id_producto} value={p.id_producto}>{p.nombre_producto} ({p.id_producto})</option>
            ))}
          </select>
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
        </div>

        {error && <div className="rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 p-4">{error}</div>}
        {loading && <div className="text-slate-500 py-8 text-center">Cargando...</div>}

        {!loading && (
          <div className="rounded-xl bg-slate-800/40 border border-slate-700/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-slate-400 bg-slate-800/60">
                  <tr>
                    <th className="py-3 px-4 font-medium">Fecha</th>
                    <th className="py-3 px-4 font-medium">Proveedor</th>
                    <th className="py-3 px-4 font-medium">Producto / Concepto</th>
                    <th className="py-3 px-4 font-medium text-right">Precio</th>
                    <th className="py-3 px-4 font-medium">Unidad</th>
                    <th className="py-3 px-4 font-medium">Fuente</th>
                    <th className="py-3 px-4 w-24">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {precios.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-800/30">
                      <td className="py-3 px-4 text-slate-400">{p.fecha ? format(new Date(p.fecha + 'T12:00:00'), 'd MMM yyyy', { locale: es }) : '—'}</td>
                      <td className="py-3 px-4 font-medium text-slate-200">{p.nombre_proveedor || p.id_proveedor}</td>
                      <td className="py-3 px-4 text-slate-300">{productoConcepto(p)}</td>
                      <td className="py-3 px-4 text-right font-mono text-amber-400">{formatMoney(p.precio, p.moneda, p.tipo_cambio_usd)}</td>
                      <td className="py-3 px-4 text-slate-500">{p.unidad || 'kg'}</td>
                      <td className="py-3 px-4 text-slate-500">{p.fuente || '—'}</td>
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
                No hay precios. Añade uno manualmente o recibe vía API/importación desde fuera.
              </div>
            )}
          </div>
        )}
      </div>

      {modal !== 'cerrado' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => !saving && setModal('cerrado')}>
          <div className="bg-slate-800 rounded-xl border border-slate-700 max-w-md w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-slate-100 mb-4">{modal === 'nuevo' ? 'Nuevo precio (proveedor)' : 'Editar precio'}</h2>
            <div className="space-y-3">
              <label className="block text-sm text-slate-400">Proveedor *</label>
              <select
                value={form.id_proveedor}
                onChange={(e) => {
                  const pr = proveedores.find((p) => p.id_proveedor === e.target.value);
                  setForm((f) => ({ ...f, id_proveedor: e.target.value, nombre_proveedor: pr?.nombre_proveedor ?? f.nombre_proveedor }));
                }}
                className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-slate-200"
              >
                <option value="">— Seleccionar o escribir abajo —</option>
                {proveedores.map((pr) => (
                  <option key={pr.id_proveedor} value={pr.id_proveedor}>{pr.nombre_proveedor || pr.id_proveedor}</option>
                ))}
              </select>
              {!proveedores.some((p) => p.id_proveedor === form.id_proveedor) && (
                <input
                  type="text"
                  value={form.id_proveedor}
                  onChange={(e) => setForm((f) => ({ ...f, id_proveedor: e.target.value }))}
                  className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-slate-200"
                  placeholder="ID proveedor"
                />
              )}
              <label className="block text-sm text-slate-400">Nombre proveedor</label>
              <input type="text" value={form.nombre_proveedor} onChange={(e) => setForm((f) => ({ ...f, nombre_proveedor: e.target.value }))} className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-slate-200" placeholder="Opcional" />
              <label className="block text-sm text-slate-400">Producto</label>
              <select
                value={form.id_producto}
                onChange={(e) => setForm((f) => ({ ...f, id_producto: e.target.value, concepto: e.target.value ? '' : f.concepto }))}
                className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-slate-200"
              >
                <option value="">— Concepto libre abajo —</option>
                {productos.map((p) => (
                  <option key={p.id_producto} value={p.id_producto}>{p.nombre_producto} ({p.id_producto})</option>
                ))}
              </select>
              <label className="block text-sm text-slate-400">Concepto (si no es producto)</label>
              <input type="text" value={form.concepto} onChange={(e) => setForm((f) => ({ ...f, concepto: e.target.value }))} className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-slate-200" placeholder="Ej. Flete CDMX" disabled={!!form.id_producto} />
              <label className="block text-sm text-slate-400">Precio *</label>
              <input type="text" value={form.precio} onChange={(e) => setForm((f) => ({ ...f, precio: e.target.value }))} className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-slate-200" placeholder="0" />
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
              <label className="block text-sm text-slate-400">Fecha</label>
              <input type="date" value={form.fecha} onChange={(e) => setForm((f) => ({ ...f, fecha: e.target.value }))} className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-slate-200" />
              <label className="block text-sm text-slate-400">Fuente</label>
              <select value={form.fuente} onChange={(e) => setForm((f) => ({ ...f, fuente: e.target.value }))} className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-slate-200">
                {FUENTES.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
              <label className="block text-sm text-slate-400">Referencia</label>
              <input type="text" value={form.referencia} onChange={(e) => setForm((f) => ({ ...f, referencia: e.target.value }))} className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-slate-200" placeholder="Opcional" />
              <label className="block text-sm text-slate-400">Observaciones</label>
              <input type="text" value={form.observaciones} onChange={(e) => setForm((f) => ({ ...f, observaciones: e.target.value }))} className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-slate-200" placeholder="Opcional" />
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
