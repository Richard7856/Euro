'use client';

import { useState, useEffect } from 'react';
import { CuentaPorCobrar } from '@/types/financial';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import AgingTable from '@/components/AgingTable';
import { useEmpresaOptional } from '@/lib/empresaContext';

export default function CobranzaPage() {
  const empresa = useEmpresaOptional()?.empresa ?? 'euromex';
  const [filter, setFilter] = useState<'all' | 'vigente' | 'vencido'>('all');
  const [cuentasPorCobrar, setCuentasPorCobrar] = useState<CuentaPorCobrar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/datos', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Error al cargar'))))
      .then((d) => setCuentasPorCobrar(d.cuentasPorCobrar ?? []))
      .catch((e) => setError(e instanceof Error ? e.message : 'Error'))
      .finally(() => setLoading(false));
  }, [empresa]);

  const filteredCuentas = cuentasPorCobrar.filter((c) => {
    if (filter === 'all') return true;
    if (filter === 'vigente') return c.estado !== 'vencido';
    if (filter === 'vencido') return c.estado === 'vencido';
    return true;
  });

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  const totalPendiente = cuentasPorCobrar.reduce((sum, c) => sum + c.monto_pendiente, 0);
  const totalVencido = cuentasPorCobrar.filter((c) => c.estado === 'vencido').reduce((sum, c) => sum + c.monto_pendiente, 0);

  if (loading) {
    return (
      <main className="min-h-screen page-bg text-slate-50 p-4 md:p-8 flex items-center justify-center">
        <div className="text-slate-500">Cargando cobranza...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen page-bg text-slate-50 p-4 md:p-8">
        <div className="rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 p-4">{error}</div>
        <Link href="/" className="text-blue-400 hover:underline mt-4 inline-block">Volver al inicio</Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen page-bg text-slate-50 p-4 md:p-8">
      <div className="max-w-[1800px] mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 rounded-lg hover:bg-slate-800 transition-colors">
            <ArrowLeftIcon className="w-6 h-6 text-slate-400" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-100">Detalle de Cobranza y Créditos</h1>
            <p className="text-slate-400">Cartera de clientes y saldos pendientes (datos desde Supabase).</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-6 rounded-xl bg-slate-800/40 border border-slate-700/50 backdrop-blur-sm">
            <div className="text-sm text-slate-400 mb-1">Total por Cobrar</div>
            <div className="text-2xl font-bold text-blue-400">{formatCurrency(totalPendiente)}</div>
          </div>
          <div className="p-6 rounded-xl bg-slate-800/40 border border-slate-700/50 backdrop-blur-sm">
            <div className="text-sm text-slate-400 mb-1">Total Vencido</div>
            <div className="text-2xl font-bold text-red-400">{formatCurrency(totalVencido)}</div>
            {totalPendiente > 0 && (
              <div className="text-xs text-slate-500 mt-1">
                {((totalVencido / totalPendiente) * 100).toFixed(1)}% de la cartera
              </div>
            )}
          </div>
          <div className="p-6 rounded-xl bg-slate-800/40 border border-slate-700/50 backdrop-blur-sm">
            <div className="text-sm text-slate-400 mb-1">Clientes con Deuda</div>
            <div className="text-2xl font-bold text-slate-200">{new Set(filteredCuentas.filter((c) => c.monto_pendiente > 0).map((c) => c.id_cliente)).size}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <AgingTable cuentas={cuentasPorCobrar} />
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-200">Facturas Pendientes</h3>
              <div className="flex bg-slate-800 rounded-lg p-1 text-sm">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1 rounded-md transition-colors ${filter === 'all' ? 'bg-blue-500 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  Todas
                </button>
                <button
                  onClick={() => setFilter('vigente')}
                  className={`px-3 py-1 rounded-md transition-colors ${filter === 'vigente' ? 'bg-blue-500 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  Vigentes
                </button>
                <button
                  onClick={() => setFilter('vencido')}
                  className={`px-3 py-1 rounded-md transition-colors ${filter === 'vencido' ? 'bg-blue-500 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  Vencidas
                </button>
              </div>
            </div>

            <div className="bg-slate-800/20 rounded-xl border border-slate-700/50 overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="text-slate-400 bg-slate-800/50">
                  <tr>
                    <th className="py-3 px-4 font-medium">Cliente</th>
                    <th className="py-3 px-4 font-medium">Factura / Venta</th>
                    <th className="py-3 px-4 font-medium">Fecha</th>
                    <th className="py-3 px-4 font-medium">Vencimiento</th>
                    <th className="py-3 px-4 font-medium text-right">Monto</th>
                    <th className="py-3 px-4 font-medium text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {filteredCuentas.map((cuenta) => (
                    <tr key={cuenta.id_venta + cuenta.id_cliente} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-200">{cuenta.nombre_cliente}</td>
                      <td className="py-3 px-4 text-slate-400">{cuenta.id_venta}</td>
                      <td className="py-3 px-4 text-slate-400">{cuenta.fecha_venta}</td>
                      <td className="py-3 px-4 text-slate-400">{cuenta.fecha_vencimiento || '-'}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-200">{formatCurrency(cuenta.monto_pendiente)}</td>
                      <td className="py-3 px-4 text-center">
                        {cuenta.estado === 'vencido' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/20">
                            Vencido {cuenta.dias_vencido ? `(${cuenta.dias_vencido}d)` : ''}
                          </span>
                        ) : cuenta.estado === 'por_vencer' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-500/10 text-orange-500 border border-orange-500/20">
                            Por Vencer
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium theme-accent-muted-bg theme-accent border theme-accent-border">
                            Vigente
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredCuentas.length === 0 && (
                <div className="p-8 text-center text-slate-500">No hay cuentas que coincidan con el filtro.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
