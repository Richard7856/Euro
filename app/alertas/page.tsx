'use client';

import { useState, useEffect, useCallback } from 'react';
import { ArrowPathIcon, BellAlertIcon, ExclamationTriangleIcon, ShoppingCartIcon, UserIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useEmpresaOptional } from '@/lib/empresaContext';

type CompraIncompleta = {
  id: string;
  id_compra: string;
  producto_nombre: string | null;
  id_proveedor: string | null;
  fecha_compra: string | null;
  cantidad_compra: number | null;
  costo_unitario: number | null;
  subtotal: number | null;
  estado_pago: string | null;
};

type CompraVencida = {
  id: string;
  id_compra: string;
  producto_nombre: string | null;
  id_proveedor: string | null;
  fecha_vencimiento: string;
  subtotal: number | null;
  pendiente_mxn: number | null;
  estado_pago: string | null;
  dias_vencido: number;
};

type PerfilIncompleto = {
  id: string;
  email: string | null;
  nombre: string | null;
  rol: string;
  activo: boolean;
};

type AlertasData = {
  compras_incompletas: CompraIncompleta[];
  compras_vencidas: CompraVencida[];
  perfiles_incompletos: PerfilIncompleto[];
  totales: {
    compras_incompletas: number;
    compras_vencidas: number;
    perfiles_incompletos: number;
  };
};

const fmt = (n: number | null) =>
  n != null
    ? new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)
    : '—';

function Badge({ count, variant }: { count: number; variant: 'red' | 'amber' | 'slate' }) {
  const cls = {
    red: 'bg-red-500/20 text-red-400 border-red-500/40',
    amber: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
    slate: 'bg-slate-500/20 text-slate-400 border-slate-500/40',
  }[variant];
  return (
    <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${cls}`}>
      {count}
    </span>
  );
}

function MissingField({ missing }: { missing: boolean }) {
  if (!missing) return <span className="text-green-400 text-xs">✓</span>;
  return <span className="text-red-400 text-xs font-bold">✗</span>;
}

function UrgencyBadge({ dias }: { dias: number }) {
  if (dias >= 30) return <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/40">{dias}d vencido</span>;
  if (dias >= 7) return <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40">{dias}d vencido</span>;
  return <span className="px-2 py-0.5 rounded text-xs font-bold bg-orange-500/20 text-orange-400 border border-orange-500/40">{dias}d vencido</span>;
}

export default function AlertasPage() {
  const empresaContext = useEmpresaOptional();
  const [data, setData] = useState<AlertasData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState('');

  const fetchAlertas = useCallback(() => {
    setLoading(true);
    const headers: Record<string, string> = {};
    if (empresaContext?.empresa) headers['x-empresa-slug'] = empresaContext.empresa;

    fetch('/api/alertas', { credentials: 'include', headers })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((json: AlertasData) => {
        setData(json);
        setLastUpdate(new Date().toLocaleString('es-MX', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }));
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [empresaContext?.empresa]);

  useEffect(() => { fetchAlertas(); }, [fetchAlertas]);

  const totalAlertas = data ? data.totales.compras_incompletas + data.totales.compras_vencidas + data.totales.perfiles_incompletos : 0;

  return (
    <main className="min-h-screen page-bg text-slate-50 p-4 md:p-8">
      <div className="max-w-[1400px] mx-auto space-y-8">

        {/* Header */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BellAlertIcon className="w-8 h-8 text-amber-400" />
            <div>
              <h1 className="text-3xl md:text-4xl font-bold gradient-text">Centro de Alertas</h1>
              <p className="text-slate-400 mt-1">Datos incompletos, pagos vencidos y perfiles sin completar</p>
              {lastUpdate && <p className="text-xs text-slate-500 mt-0.5">Última actualización: {lastUpdate}</p>}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {totalAlertas > 0 && (
              <span className="text-sm text-slate-400">{totalAlertas} alerta{totalAlertas !== 1 ? 's' : ''} en total</span>
            )}
            <button
              onClick={fetchAlertas}
              disabled={loading}
              className="btn-primary flex items-center gap-2 hover:scale-105 transition-transform"
            >
              <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
          </div>
        </header>

        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-4 spinner-theme rounded-full animate-spin" />
          </div>
        )}

        {!loading && !data && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 px-6 py-4">
            Error al cargar alertas. Verifica tu sesión.
          </div>
        )}

        {!loading && data && (
          <div className="space-y-8">

            {/* Panel 1: Compras incompletas */}
            <section className="chart-container space-y-4">
              <div className="flex items-center gap-3">
                <ShoppingCartIcon className="w-5 h-5 text-red-400" />
                <h2 className="text-lg font-bold text-slate-100">Compras con datos incompletos</h2>
                <Badge count={data.totales.compras_incompletas} variant="red" />
              </div>
              {data.compras_incompletas.length === 0 ? (
                <p className="text-slate-500 text-sm py-4">No hay compras con datos incompletos. ✓</p>
              ) : (
                <>
                  <p className="text-slate-400 text-sm">
                    Estas compras tienen campos críticos vacíos que afectan los cálculos financieros.
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-700/50 text-slate-400 text-left">
                          <th className="py-3 px-3 font-medium">ID Compra</th>
                          <th className="py-3 px-3 font-medium">Producto</th>
                          <th className="py-3 px-3 font-medium text-center">Proveedor</th>
                          <th className="py-3 px-3 font-medium text-center">Fecha</th>
                          <th className="py-3 px-3 font-medium text-center">Cantidad</th>
                          <th className="py-3 px-3 font-medium text-center">Costo</th>
                          <th className="py-3 px-3 font-medium text-right">Subtotal</th>
                          <th className="py-3 px-3 font-medium">Acción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.compras_incompletas.map((c) => (
                          <tr key={c.id} className="border-b border-slate-700/30 hover:bg-slate-800/40">
                            <td className="py-3 px-3 font-mono text-slate-300 text-xs">{c.id_compra || c.id.slice(0, 8)}</td>
                            <td className="py-3 px-3 text-slate-200">
                              {c.producto_nombre ? c.producto_nombre : <span className="text-red-400 text-xs font-semibold">Sin producto</span>}
                            </td>
                            <td className="py-3 px-3 text-center"><MissingField missing={!c.id_proveedor} /></td>
                            <td className="py-3 px-3 text-center"><MissingField missing={!c.fecha_compra} /></td>
                            <td className="py-3 px-3 text-center"><MissingField missing={c.cantidad_compra == null} /></td>
                            <td className="py-3 px-3 text-center"><MissingField missing={c.costo_unitario == null} /></td>
                            <td className="py-3 px-3 text-right text-slate-300">{fmt(c.subtotal)}</td>
                            <td className="py-3 px-3">
                              <Link href="/compras" className="text-xs px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300">
                                Completar →
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </section>

            {/* Panel 2: Compras vencidas */}
            <section className="chart-container space-y-4">
              <div className="flex items-center gap-3">
                <ExclamationTriangleIcon className="w-5 h-5 text-amber-400" />
                <h2 className="text-lg font-bold text-slate-100">Compras con pago vencido</h2>
                <Badge count={data.totales.compras_vencidas} variant="amber" />
              </div>
              {data.compras_vencidas.length === 0 ? (
                <p className="text-slate-500 text-sm py-4">No hay compras con pagos vencidos. ✓</p>
              ) : (
                <>
                  <p className="text-slate-400 text-sm">
                    Compras con estado Pendiente cuya fecha de vencimiento ya pasó.
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-700/50 text-slate-400 text-left">
                          <th className="py-3 px-3 font-medium">ID Compra</th>
                          <th className="py-3 px-3 font-medium">Producto</th>
                          <th className="py-3 px-3 font-medium">Proveedor</th>
                          <th className="py-3 px-3 font-medium">Vencimiento</th>
                          <th className="py-3 px-3 font-medium">Urgencia</th>
                          <th className="py-3 px-3 font-medium text-right">Pendiente</th>
                          <th className="py-3 px-3 font-medium">Acción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.compras_vencidas.map((c) => (
                          <tr key={c.id} className="border-b border-slate-700/30 hover:bg-slate-800/40">
                            <td className="py-3 px-3 font-mono text-slate-300 text-xs">{c.id_compra || c.id.slice(0, 8)}</td>
                            <td className="py-3 px-3 text-slate-200">{c.producto_nombre ?? '—'}</td>
                            <td className="py-3 px-3 text-slate-400 text-xs">{c.id_proveedor ?? '—'}</td>
                            <td className="py-3 px-3 text-slate-300 text-xs">{c.fecha_vencimiento}</td>
                            <td className="py-3 px-3"><UrgencyBadge dias={c.dias_vencido} /></td>
                            <td className="py-3 px-3 text-right font-semibold text-red-400">{fmt(c.pendiente_mxn ?? c.subtotal)}</td>
                            <td className="py-3 px-3">
                              <Link href="/compras" className="text-xs px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300">
                                Ver compra →
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </section>

            {/* Panel 3: Perfiles incompletos */}
            <section className="chart-container space-y-4">
              <div className="flex items-center gap-3">
                <UserIcon className="w-5 h-5 text-slate-400" />
                <h2 className="text-lg font-bold text-slate-100">Perfiles sin completar o inactivos</h2>
                <Badge count={data.totales.perfiles_incompletos} variant="slate" />
              </div>
              {data.perfiles_incompletos.length === 0 ? (
                <p className="text-slate-500 text-sm py-4">Todos los perfiles están completos y activos. ✓</p>
              ) : (
                <>
                  <p className="text-slate-400 text-sm">
                    Usuarios sin nombre asignado o marcados como inactivos.
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-700/50 text-slate-400 text-left">
                          <th className="py-3 px-3 font-medium">Email</th>
                          <th className="py-3 px-3 font-medium">Nombre</th>
                          <th className="py-3 px-3 font-medium">Rol</th>
                          <th className="py-3 px-3 font-medium">Estado</th>
                          <th className="py-3 px-3 font-medium">Acción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.perfiles_incompletos.map((p) => (
                          <tr key={p.id} className="border-b border-slate-700/30 hover:bg-slate-800/40">
                            <td className="py-3 px-3 text-slate-300">{p.email ?? <span className="text-red-400 text-xs">Sin email</span>}</td>
                            <td className="py-3 px-3">
                              {p.nombre
                                ? <span className="text-slate-200">{p.nombre}</span>
                                : <span className="text-amber-400 text-xs font-semibold">Sin nombre</span>}
                            </td>
                            <td className="py-3 px-3">
                              <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-700 text-slate-300">{p.rol}</span>
                            </td>
                            <td className="py-3 px-3">
                              {p.activo
                                ? <span className="text-green-400 text-xs">Activo</span>
                                : <span className="text-slate-500 text-xs">Inactivo</span>}
                            </td>
                            <td className="py-3 px-3">
                              <Link href="/perfiles" className="text-xs px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300">
                                Ir a Perfiles →
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </section>

          </div>
        )}
      </div>
    </main>
  );
}
