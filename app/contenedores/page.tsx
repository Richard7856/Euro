'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { TruckIcon, ArrowLeftIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { useEmpresaOptional } from '@/lib/empresaContext';

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

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n);

export default function ContenedoresPage() {
  const empresa = useEmpresaOptional()?.empresa;
  const [envios, setEnvios] = useState<Envio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch('/api/datos', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Error al cargar'))))
      .then((d) => setEnvios(d.envios ?? []))
      .catch((e) => setError(e instanceof Error ? e.message : 'Error'))
      .finally(() => setLoading(false));
  }, [empresa]);

  return (
    <main className="min-h-screen page-bg text-slate-50 p-4 md:p-8">
      <div className="max-w-[1400px] mx-auto space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 rounded-lg hover:bg-slate-800 transition-colors">
              <ArrowLeftIcon className="w-6 h-6 text-slate-400" />
            </Link>
            <div className="inline-flex p-3 rounded-xl bg-blue-500/10">
              <TruckIcon className="h-8 w-8 text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-100">Envíos y logística</h1>
              <p className="text-slate-400">Seguimiento de envíos (producto, cliente, compra, costo). Solo envíos de la empresa seleccionada.</p>
            </div>
          </div>
          <Link href="/dinamico" className="btn-secondary flex items-center gap-2">
            <ChartBarIcon className="w-5 h-5" /> Ver en dashboard
          </Link>
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
              <div className="p-12 text-center text-slate-500">
                No hay envíos registrados. Los envíos se cargan desde la tabla <code className="text-blue-400">envios</code> en Supabase.
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
