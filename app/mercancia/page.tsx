'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CubeIcon, ArrowLeftIcon, ChartBarIcon } from '@heroicons/react/24/outline';

type Producto = {
  id_producto: string;
  nombre_producto: string;
  cantidad_disponible: number;
  valor_unitario_promedio: number;
  valor_total: number;
};

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n);

export default function MercanciaPage() {
  const [inventario, setInventario] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/datos')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Error al cargar'))))
      .then((d) => setInventario(d.inventario ?? []))
      .catch((e) => setError(e instanceof Error ? e.message : 'Error'))
      .finally(() => setLoading(false));
  }, []);

  const totalValor = inventario.reduce((s, p) => s + (p.valor_total ?? 0), 0);

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
          <Link href="/dinamico" className="btn-secondary flex items-center gap-2">
            <ChartBarIcon className="w-5 h-5" /> Ver en dashboard
          </Link>
        </div>

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
                  {inventario.map((p) => (
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
            {inventario.length === 0 && (
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
