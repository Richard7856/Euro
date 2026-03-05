'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  CurrencyDollarIcon,
  CubeIcon,
  UserGroupIcon,
  TruckIcon,
  CalendarDaysIcon,
  ArrowRightIcon,
  BuildingStorefrontIcon,
  BanknotesIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';
import { useEmpresaOptional } from '@/lib/empresaContext';
import { useCurrency } from '@/lib/currencyContext';
import { CashFlowAnalyzer } from '@/lib/cashFlowAnalyzer';
import type { FiltroFecha, Inventario, CuentaPorCobrar, Envio } from '@/types/financial';
import type { Venta } from '@/types/financial';
import type { GastoDetallado } from '@/types/financial';
import type { Compra } from '@/types/financial';
import { subMonths, format, parseISO, isWithinInterval } from 'date-fns';
import { parseDateForFilter } from '@/lib/dateUtils';

const getDefaultDateRange = (): FiltroFecha => {
  const hasta = new Date();
  const desde = subMonths(hasta, 1);
  return { desde: format(desde, 'yyyy-MM-dd'), hasta: format(hasta, 'yyyy-MM-dd') };
};

function filterByDate<T>(items: T[], getDate: (item: T) => string | undefined, filtro: FiltroFecha): T[] {
  const desde = parseISO(filtro.desde);
  const hasta = parseISO(filtro.hasta);
  return items.filter((item) => {
    const fechaStr = getDate(item);
    if (!fechaStr) return true;
    const fecha = parseDateForFilter(fechaStr);
    if (!fecha) return true;
    return isWithinInterval(fecha, { start: desde, end: hasta });
  });
}

const modules = [
  { href: '/financiero', label: 'Financiero', desc: 'Efectivo, CxC, CxP, ventas, compras y análisis en tiempo real', Icon: CurrencyDollarIcon },
  { href: '/mercancia', label: 'Mercancía y almacenes', desc: 'Ubicación de mercancía por almacén', Icon: CubeIcon },
  { href: '/bodegas', label: 'Bodegas', desc: 'Inventario por bodega, entradas y salidas', Icon: BuildingStorefrontIcon },
  { href: '/clientes', label: 'Clientes y crédito', desc: 'Clientes, crédito y cobranza', Icon: UserGroupIcon },
  { href: '/compras', label: 'Compras y envíos', desc: 'Compras a proveedores y tabla de envíos y logística', Icon: TruckIcon },
  { href: '/contenedores', label: 'Contenedores', desc: 'Rastreo de envíos, guías y logística', Icon: MapPinIcon },
  { href: '/precios', label: 'Precios proveedores', desc: 'Precios recibidos de proveedores y precios de venta final', Icon: BanknotesIcon },
  { href: '/promesas', label: 'Promesas de pago', desc: 'Promesas de proveedores y clientes', Icon: CalendarDaysIcon },
];

type DatosApi = {
  ventas: Venta[];
  gastos: GastoDetallado[];
  compras: Compra[];
  inventario: Inventario[];
  cuentasPorCobrar: CuentaPorCobrar[];
  envios: Envio[];
};

export default function InicioPage() {
  const filtroFecha = useMemo<FiltroFecha>(getDefaultDateRange, []);
  const empresaContext = useEmpresaOptional();
  const empresaInfo = empresaContext?.empresaInfo ?? { name: 'Euromex', subtitle: 'Import/Export', slug: 'euromex' as const };
  const empresa = empresaContext?.empresa ?? 'euromex';
  const { formatCurrency } = useCurrency();

  const [datos, setDatos] = useState<DatosApi | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const headers: Record<string, string> = { 'x-empresa-slug': empresa };
    const params = new URLSearchParams({ desde: filtroFecha.desde, hasta: filtroFecha.hasta });
    fetch(`/api/datos?${params}`, { credentials: 'include', headers })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((json) => {
        setDatos({
          ventas: (json.ventas ?? []).map((v: Record<string, unknown>) => ({
            id_venta: String(v.id_venta ?? v.id ?? ''),
            fecha_pago: v.fecha_pago ? String(v.fecha_pago) : undefined,
            monto_pagado: Number(v.monto_pagado ?? v.total ?? 0),
            metodo_pago: v.metodo_pago ? String(v.metodo_pago) : undefined,
          })),
          gastos: (json.gastos ?? []).map((g: Record<string, unknown>) => ({
            id: String(g.id ?? ''),
            fecha: g.fecha ? String(g.fecha) : undefined,
            categoria: g.categoria ? String(g.categoria) : undefined,
            monto: Number(g.monto ?? 0),
            descripcion: g.descripcion ? String(g.descripcion) : undefined,
          })),
          compras: (json.compras ?? []).map((c: Record<string, unknown>) => ({
            id_compra: String(c.id_compra ?? ''),
            fecha_compra: c.fecha_compra ? String(c.fecha_compra) : undefined,
            producto_nombre: String(c.producto_nombre ?? ''),
            inversion_mxn: Number(c.inversion_mxn ?? c.subtotal ?? 0),
            pagado_mxn: Number(c.pagado_mxn ?? 0),
            pendiente_mxn: Number(c.pendiente_mxn ?? 0),
            tipo_pago: (String(c.tipo_pago ?? 'Contado') as 'Crédito' | 'Contado'),
            proveedor: String(c.proveedor ?? ''),
            estado: String(c.estado ?? 'Pendiente'),
            kg: Number(c.kg ?? 0),
          })),
          inventario: (json.inventario ?? []).map((i: Record<string, unknown>) => ({
            id_producto: String(i.id_producto ?? i.id ?? ''),
            producto: i.producto ? String(i.producto) : undefined,
            costo_unitario: Number(i.costo_unitario ?? 0),
            cantidad_disponible: Number(i.cantidad_disponible ?? 0),
            valor_total: Number(i.valor_total ?? (Number(i.costo_unitario ?? 0) * Number(i.cantidad_disponible ?? 0))),
          })),
          cuentasPorCobrar: (json.cuentasPorCobrar ?? []).map((c: Record<string, unknown>) => ({
            id_venta: String(c.id_venta ?? c.id ?? ''),
            monto_pendiente: Number(c.monto_pendiente ?? 0),
            fecha_vencimiento: c.fecha_vencimiento ? String(c.fecha_vencimiento) : undefined,
          })),
          envios: (json.envios ?? []).map((e: Record<string, unknown>) => ({
            id_envio: String(e.id_envio ?? e.id ?? ''),
            costo_envio: Number(e.costo_envio ?? 0),
            estado_envio: e.estado_envio ? String(e.estado_envio) : undefined,
          })),
        });
      })
      .catch(() => setDatos(null))
      .finally(() => setLoading(false));
  }, [empresa, filtroFecha]);

  const ventasFiltradas = useMemo(
    () => datos ? filterByDate(datos.ventas, (v) => v.fecha_pago, filtroFecha) : [],
    [datos, filtroFecha]
  );
  const gastosFiltrados = useMemo(
    () => datos ? filterByDate(datos.gastos, (g) => g.fecha, filtroFecha) : [],
    [datos, filtroFecha]
  );
  const comprasFiltradas = useMemo(
    () => datos ? filterByDate(datos.compras, (c) => c.fecha_compra, filtroFecha) : [],
    [datos, filtroFecha]
  );

  const analyzer = useMemo(
    () =>
      datos
        ? new CashFlowAnalyzer(ventasFiltradas, gastosFiltrados, comprasFiltradas, datos.inventario, datos.cuentasPorCobrar, datos.envios)
        : null,
    [datos, ventasFiltradas, gastosFiltrados, comprasFiltradas]
  );

  const kpis = analyzer?.generarCashPositionKPIs();
  const totalCobrado = ventasFiltradas.reduce((s, v) => s + (v.monto_pagado ?? 0), 0);

  return (
    <main className="min-h-screen text-zinc-50 p-4 md:p-8" style={{ backgroundColor: 'var(--shell-bg)' }}>
      <div className="max-w-[1800px] mx-auto space-y-10">
        <header className="mb-10">
          <h1 className="text-4xl md:text-5xl font-bold gradient-text">
            Inicio
          </h1>
          <p className="text-zinc-400 mt-2">Resumen operativo · {empresaInfo.name} {empresaInfo.subtitle && `· ${empresaInfo.subtitle}`}</p>
        </header>

        <section>
          <h2 className="text-xl font-bold text-zinc-300 mb-4">Resumen financiero (último mes)</h2>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="kpi-card-neutral p-4 animate-pulse">
                  <div className="h-3 bg-zinc-700 rounded w-1/2 mb-3" />
                  <div className="h-7 bg-zinc-700 rounded w-3/4" />
                </div>
              ))}
            </div>
          ) : !datos ? (
            <div className="rounded-xl bg-zinc-800/50 border border-zinc-700/50 p-6 text-zinc-400 text-sm">
              No se pudieron cargar los datos financieros.{' '}
              <Link href="/financiero" className="text-amber-400 hover:underline">Ver Financiero →</Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="kpi-card-neutral p-4">
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Cashflow</p>
                  <p className="mt-1 text-2xl font-bold text-zinc-100">{formatCurrency(kpis?.efectivo_disponible.value ?? 0)}</p>
                </div>
                <div className="kpi-card-neutral p-4">
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Cuentas por cobrar</p>
                  <p className="mt-1 text-2xl font-bold text-zinc-100">{formatCurrency(kpis?.cuentas_por_cobrar.value ?? 0)}</p>
                </div>
                <div className="kpi-card-neutral p-4">
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Valor inventario</p>
                  <p className="mt-1 text-2xl font-bold text-zinc-100">{formatCurrency(kpis?.inventario_valor.value ?? 0)}</p>
                </div>
                <div className="kpi-card-neutral p-4">
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Cuentas por pagar</p>
                  <p className="mt-1 text-2xl font-bold text-zinc-100">{formatCurrency(kpis?.cuentas_por_pagar.value ?? 0)}</p>
                </div>
              </div>
              <p className="text-sm text-zinc-500 mt-2">Cobrado en periodo: {formatCurrency(totalCobrado)}</p>
            </>
          )}
        </section>

        <section>
          <h2 className="text-xl font-bold text-zinc-300 mb-4">Módulos</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {modules.map(({ href, label, desc, Icon }) => (
              <Link
                key={href}
                href={href}
                className="group flex items-start gap-4 rounded-xl bg-zinc-900/50 border border-zinc-800 p-5 hover:bg-zinc-800/60 hover:border-zinc-700 transition-all"
              >
                <div className="rounded-lg theme-module-icon-bg p-3">
                  <Icon className="h-6 w-6 theme-module-icon theme-module-hover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-zinc-100 transition-colors group-hover:[color:var(--module-hover)]">{label}</h3>
                  <p className="text-sm text-zinc-400 mt-0.5">{desc}</p>
                </div>
                <ArrowRightIcon className="h-5 w-5 shrink-0 mt-1 theme-module-icon" style={{ color: 'var(--module-icon)' }} />
              </Link>
            ))}
          </div>
        </section>

        <footer className="text-center text-zinc-500 text-sm pt-8 border-t border-zinc-800">
          <p>Dashboard {empresaInfo.name} · {empresaInfo.subtitle} © 2026</p>
        </footer>
      </div>
    </main>
  );
}
