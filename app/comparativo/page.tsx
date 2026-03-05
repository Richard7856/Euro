'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon, ChartBarSquareIcon } from '@heroicons/react/24/outline';

type KPIs = {
  totalCxC: number;
  totalInventario: number;
  comprasPendiente: number;
  totalGastos: number;
  totalVentasMonto: number;
};

type EmpresaData = {
  slug: string;
  label: string;
  color: string;
  accent: string;
  kpis: KPIs | null;
  loading: boolean;
  error: string | null;
};

const EMPRESAS: { slug: string; label: string; color: string; accent: string }[] = [
  { slug: 'euromex', label: 'Euromex', color: 'from-emerald-500/10 to-emerald-500/5', accent: 'text-emerald-400 border-emerald-500/40' },
  { slug: 'garritas', label: 'Garritas', color: 'from-red-500/10 to-red-500/5', accent: 'text-red-400 border-red-500/40' },
  { slug: 'cigarros', label: 'Cigarros', color: 'from-amber-500/10 to-amber-500/5', accent: 'text-amber-400 border-amber-500/40' },
];

function formatMXN(n: number) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function computeKPIs(data: Record<string, unknown>): KPIs {
  const cxc = (data.cuentasPorCobrar as { monto_pendiente: number }[] | undefined) ?? [];
  const inventario = (data.inventario as { valor_total: number }[] | undefined) ?? [];
  const compras = (data.compras as { estado_pago?: string; pendiente_mxn?: number }[] | undefined) ?? [];
  const gastos = (data.gastos as { monto: number }[] | undefined) ?? [];
  const ventas = (data.ventas as { importe?: number; total_venta?: number }[] | undefined) ?? [];

  const totalCxC = cxc.reduce((s, c) => s + (c.monto_pendiente ?? 0), 0);
  const totalInventario = inventario.reduce((s, p) => s + (p.valor_total ?? 0), 0);
  const comprasPendiente = compras
    .filter((c) => c.estado_pago === 'Pendiente')
    .reduce((s, c) => s + (c.pendiente_mxn ?? 0), 0);
  const totalGastos = gastos.reduce((s, g) => s + (g.monto ?? 0), 0);
  const totalVentasMonto = ventas.reduce((s, v) => s + (v.importe ?? v.total_venta ?? 0), 0);

  return { totalCxC, totalInventario, comprasPendiente, totalGastos, totalVentasMonto };
}

export default function ComparativoPage() {
  const [empresasData, setEmpresasData] = useState<EmpresaData[]>(
    EMPRESAS.map((e) => ({ ...e, kpis: null, loading: true, error: null }))
  );

  useEffect(() => {
    EMPRESAS.forEach((empresa, idx) => {
      fetch('/api/datos', {
        credentials: 'include',
        headers: { 'x-empresa': empresa.slug },
      })
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Error al cargar'))))
        .then((data) => {
          setEmpresasData((prev) => {
            const next = [...prev];
            next[idx] = { ...next[idx], kpis: computeKPIs(data), loading: false, error: null };
            return next;
          });
        })
        .catch((e) => {
          setEmpresasData((prev) => {
            const next = [...prev];
            next[idx] = { ...next[idx], kpis: null, loading: false, error: e.message };
            return next;
          });
        });
    });
  }, []);

  const metrics: { label: string; key: keyof KPIs; description: string }[] = [
    { label: 'CxC pendiente', key: 'totalCxC', description: 'Cuentas por cobrar con saldo pendiente' },
    { label: 'Valor inventario', key: 'totalInventario', description: 'Valor total de productos en almacén' },
    { label: 'Compras pendiente', key: 'comprasPendiente', description: 'Compras a crédito sin pagar' },
    { label: 'Total gastos', key: 'totalGastos', description: 'Gastos operativos registrados' },
    { label: 'Ventas totales', key: 'totalVentasMonto', description: 'Importe total de ventas' },
  ];

  return (
    <main className="min-h-screen page-bg text-slate-50 p-4 md:p-8">
      <div className="max-w-[1400px] mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 rounded-lg hover:bg-slate-800 transition-colors">
            <ArrowLeftIcon className="w-6 h-6 text-slate-400" />
          </Link>
          <div className="inline-flex p-3 rounded-xl bg-violet-500/10">
            <ChartBarSquareIcon className="h-8 w-8 text-violet-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-100">Comparativo de empresas</h1>
            <p className="text-slate-400">KPIs clave de las 3 empresas en paralelo.</p>
          </div>
        </div>

        {/* Company columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {empresasData.map((emp) => (
            <div
              key={emp.slug}
              className={`rounded-xl bg-gradient-to-b ${emp.color} border ${emp.accent.split(' ').find((c) => c.startsWith('border-'))} p-5 space-y-4`}
            >
              <h2 className={`text-xl font-bold ${emp.accent.split(' ').find((c) => c.startsWith('text-'))}`}>
                {emp.label}
              </h2>
              {emp.loading && (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-10 rounded-lg bg-slate-700/40 animate-pulse" />
                  ))}
                </div>
              )}
              {emp.error && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 px-3 py-2 text-sm">
                  {emp.error}
                </div>
              )}
              {!emp.loading && !emp.error && emp.kpis && (
                <div className="space-y-3">
                  {metrics.map((m) => (
                    <div key={m.key} className="rounded-lg bg-slate-800/50 border border-slate-700/50 px-4 py-3">
                      <div className="text-xs text-slate-500 mb-0.5">{m.label}</div>
                      <div className={`text-lg font-bold font-mono ${emp.accent.split(' ').find((c) => c.startsWith('text-'))}`}>
                        {formatMXN(emp.kpis![m.key])}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Metric comparison table */}
        {empresasData.every((e) => !e.loading) && (
          <div className="rounded-xl bg-slate-800/40 border border-slate-700/50 overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-800/60 text-slate-400">
                <tr>
                  <th className="py-3 px-4 font-medium">Métrica</th>
                  {empresasData.map((e) => (
                    <th key={e.slug} className="py-3 px-4 font-medium text-right">{e.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {metrics.map((m) => {
                  const vals = empresasData.map((e) => e.kpis?.[m.key] ?? 0);
                  const maxVal = Math.max(...vals);
                  return (
                    <tr key={m.key} className="hover:bg-slate-800/30">
                      <td className="py-3 px-4 text-slate-300">
                        <div className="font-medium">{m.label}</div>
                        <div className="text-xs text-slate-500">{m.description}</div>
                      </td>
                      {empresasData.map((e, i) => {
                        const val = vals[i];
                        const isMax = val === maxVal && maxVal > 0;
                        return (
                          <td key={e.slug} className={`py-3 px-4 text-right font-mono text-sm ${isMax ? e.accent.split(' ').find((c) => c.startsWith('text-')) : 'text-slate-400'}`}>
                            {formatMXN(val)}
                            {isMax && <span className="ml-1 text-xs">↑</span>}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <p className="text-slate-500 text-xs text-center">
          Los datos se obtienen en tiempo real desde Supabase. Los gastos y ventas usan los registros de cada empresa.
        </p>
      </div>
    </main>
  );
}
