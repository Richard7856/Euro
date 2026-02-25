'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { CubeIcon, ArrowLeftIcon, ChartBarIcon, BuildingStorefrontIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { useCurrency } from '@/lib/currencyContext';
import ExportButtons from '@/components/ExportButtons';
import { useEmpresaOptional } from '@/lib/empresaContext';

type Producto = {
  id_producto: string;
  nombre_producto: string;
  cantidad_disponible: number;
  valor_unitario_promedio: number;
  valor_total: number;
};

export default function MercanciaPage() {
  const empresa = useEmpresaOptional()?.empresa ?? 'euromex';
  const [inventario, setInventario] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroTexto, setFiltroTexto] = useState('');
  const { formatCurrency } = useCurrency();

  const inventarioFiltrado = useMemo(() => {
    if (!filtroTexto.trim()) return inventario;
    const t = filtroTexto.toLowerCase().trim();
    return inventario.filter(
      (p) =>
        (p.id_producto || '').toLowerCase().includes(t) ||
        (p.nombre_producto || '').toLowerCase().includes(t)
    );
  }, [inventario, filtroTexto]);

  useEffect(() => {
    fetch('/api/datos', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Error al cargar'))))
      .then((d) => setInventario(d.inventario ?? []))
      .catch((e) => setError(e instanceof Error ? e.message : 'Error'))
      .finally(() => setLoading(false));
  }, [empresa]);

  const totalValor = inventarioFiltrado.reduce((s, p) => s + (p.valor_total ?? 0), 0);
  const exportColumns = [
    { key: 'id_producto', label: 'ID' },
    { key: 'nombre_producto', label: 'Producto' },
    { key: 'cantidad_disponible', label: 'Cantidad' },
    { key: 'valor_unitario_promedio', label: 'Valor unit.' },
    { key: 'valor_total', label: 'Valor total' },
  ];
  const exportRows = inventarioFiltrado.map((p) => ({
    id_producto: p.id_producto,
    nombre_producto: p.nombre_producto,
    cantidad_disponible: p.cantidad_disponible,
    valor_unitario_promedio: p.valor_unitario_promedio,
    valor_total: p.valor_total,
  }));

  return (
    <main className="min-h-screen page-bg text-slate-50 p-4 md:p-8">
      <div className="max-w-[1200px] mx-auto space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 rounded-lg hover:bg-slate-800 transition-colors">
              <ArrowLeftIcon className="w-6 h-6 text-slate-400" />
            </Link>
            <div className="inline-flex p-3 rounded-xl bg-blue-500/10">
              <CubeIcon className="h-8 w-8 text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-100">Mercancía e inventario</h1>
              <p className="text-slate-400">Productos y valor en almacén. Los datos se alimentan desde Supabase.</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <ExportButtons title="Inventario" columns={exportColumns} rows={exportRows} filenameBase="inventario" />
            <Link href="/bodegas" className="btn-secondary flex items-center gap-2">
              <BuildingStorefrontIcon className="w-5 h-5" /> Bodegas
            </Link>
            <Link href="/dinamico" className="btn-secondary flex items-center gap-2">
              <ChartBarIcon className="w-5 h-5" /> Ver en dashboard
            </Link>
          </div>
        </div>

        {!loading && inventario.length > 0 && (
          <div className="rounded-xl bg-slate-800/40 border border-slate-700/50 p-4 flex flex-wrap items-center gap-4">
            <FunnelIcon className="w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={filtroTexto}
              onChange={(e) => setFiltroTexto(e.target.value)}
              placeholder="Filtrar por ID o nombre..."
              className="rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-slate-200 text-sm w-64"
            />
          </div>
        )}

        {!loading && inventario.length > 0 && (
          <div className="rounded-xl bg-slate-800/40 border border-slate-700/50 p-4">
            <span className="text-slate-400 text-sm">Valor total inventario </span>
            <span className="text-2xl font-bold text-blue-400 ml-2">{formatCurrency(totalValor)}</span>
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
                    <th className="py-3 px-4 font-medium">ID</th>
                    <th className="py-3 px-4 font-medium">Producto</th>
                    <th className="py-3 px-4 font-medium text-right">Cantidad</th>
                    <th className="py-3 px-4 font-medium text-right">Valor unit.</th>
                    <th className="py-3 px-4 font-medium text-right">Valor total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {inventarioFiltrado.map((p) => (
                    <tr key={p.id_producto} className="hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-mono text-blue-400">{p.id_producto}</td>
                      <td className="py-3 px-4 font-medium text-slate-200">{p.nombre_producto}</td>
                      <td className="py-3 px-4 text-right text-slate-300">{p.cantidad_disponible ?? 0}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-400">{formatCurrency(p.valor_unitario_promedio ?? 0)}</td>
                      <td className="py-3 px-4 text-right font-mono text-blue-400">{formatCurrency(p.valor_total ?? 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {inventarioFiltrado.length === 0 && (
              <div className="p-12 text-center text-slate-500">
                No hay productos en inventario. Registra productos en la base de datos o ejecuta la migración desde Sheets (admin).
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
