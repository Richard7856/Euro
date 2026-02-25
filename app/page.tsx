'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  CurrencyDollarIcon,
  CubeIcon,
  UserGroupIcon,
  TruckIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  ArrowRightIcon,
  BuildingStorefrontIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';
import { useEmpresaOptional } from '@/lib/empresaContext';
import { useCurrency } from '@/lib/currencyContext';
import { CashFlowAnalyzer } from '@/lib/cashFlowAnalyzer';
import { ventasData, pedidosData, enviosData } from '@/lib/sampleData';
import { gastosDetallados, comprasData, inventarioData, cuentasPorCobrar } from '@/lib/cashFlowData';
import type { FiltroFecha, Inventario, CuentaPorCobrar, Envio } from '@/types/financial';
import type { Venta } from '@/types/financial';
import type { GastoDetallado } from '@/types/financial';
import type { Compra } from '@/types/financial';
import { subMonths, format } from 'date-fns';
import { parseISO, isWithinInterval } from 'date-fns';
import { parseDateForFilter } from '@/lib/dateUtils';

const getDefaultDateRange = (): FiltroFecha => {
  const hasta = new Date();
  const desde = subMonths(hasta, 1);
  return { desde: format(desde, 'yyyy-MM-dd'), hasta: format(hasta, 'yyyy-MM-dd') };
};

function filterByDateRange<T>(items: T[], getDate: (item: T) => string | undefined, filtro: FiltroFecha): T[] {
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
  { href: '/financiero', label: 'Financiero', desc: 'Efectivo, CxC, CxP, ventas, compras y análisis', Icon: CurrencyDollarIcon },
  { href: '/mercancia', label: 'Mercancía y almacenes', desc: 'Ubicación de mercancía por almacén', Icon: CubeIcon },
  { href: '/bodegas', label: 'Bodegas', desc: 'Inventario por bodega, entradas y salidas', Icon: BuildingStorefrontIcon },
  { href: '/clientes', label: 'Clientes y crédito', desc: 'Clientes, crédito y cobranza', Icon: UserGroupIcon },
  { href: '/contenedores', label: 'Contenedores', desc: 'Seguimiento de contenedores en tránsito', Icon: TruckIcon },
  { href: '/precios', label: 'Precios proveedores', desc: 'Precios recibidos de proveedores y precios de venta final', Icon: BanknotesIcon },
  { href: '/promesas', label: 'Promesas de pago', desc: 'Promesas de proveedores y clientes', Icon: CalendarDaysIcon },
  { href: '/dinamico', label: 'Datos en vivo', desc: 'Dashboard conectado a Supabase', Icon: ChartBarIcon },
];

const EMPTY_VENTAS: Venta[] = [];
const EMPTY_GASTOS: GastoDetallado[] = [];
const EMPTY_COMPRAS: Compra[] = [];
const EMPTY_INVENTARIO: Inventario[] = [];
const EMPTY_CxC: CuentaPorCobrar[] = [];
const EMPTY_ENVIOS: Envio[] = [];

export default function InicioPage() {
  const [filtroFecha] = useState<FiltroFecha>(getDefaultDateRange);
  const empresaContext = useEmpresaOptional();
  const empresaInfo = empresaContext?.empresaInfo ?? { name: 'Euromex', subtitle: 'Import/Export', slug: 'euromex' as const };
  const isEuromex = empresaContext?.empresa === 'euromex';
  const { formatCurrency } = useCurrency();

  const ventasFiltradas = useMemo(
    () => (isEuromex ? filterByDateRange(ventasData, (v) => (v as Venta).fecha_pago, filtroFecha) : EMPTY_VENTAS),
    [filtroFecha, isEuromex]
  );
  const gastosFiltrados = useMemo(
    () => (isEuromex ? filterByDateRange(gastosDetallados, (g) => (g as GastoDetallado).fecha, filtroFecha) : EMPTY_GASTOS),
    [filtroFecha, isEuromex]
  );
  const comprasFiltradas = useMemo(
    () => (isEuromex ? filterByDateRange(comprasData, (c) => (c as Compra).fecha_compra, filtroFecha) : EMPTY_COMPRAS),
    [filtroFecha, isEuromex]
  );
  const inventarioParaKpis = isEuromex ? inventarioData : EMPTY_INVENTARIO;
  const cxCParaKpis = isEuromex ? cuentasPorCobrar : EMPTY_CxC;
  const enviosParaKpis = isEuromex ? enviosData : EMPTY_ENVIOS;
  const analyzer = useMemo(
    () =>
      new CashFlowAnalyzer(
        ventasFiltradas,
        gastosFiltrados,
        comprasFiltradas,
        inventarioParaKpis,
        cxCParaKpis,
        enviosParaKpis
      ),
    [ventasFiltradas, gastosFiltrados, comprasFiltradas, inventarioParaKpis, cxCParaKpis, enviosParaKpis]
  );

  const kpis = analyzer.generarCashPositionKPIs();
  const totalCobrado = ventasFiltradas.reduce((s, v) => s + (v as Venta).monto_pagado, 0);

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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="kpi-card-neutral p-4">
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Cashflow</p>
              <p className="mt-1 text-2xl font-bold text-zinc-100">{formatCurrency(kpis.efectivo_disponible.value)}</p>
            </div>
            <div className="kpi-card-neutral p-4">
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Cuentas por cobrar</p>
              <p className="mt-1 text-2xl font-bold text-zinc-100">{formatCurrency(kpis.cuentas_por_cobrar.value)}</p>
            </div>
            <div className="kpi-card-neutral p-4">
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Valor inventario</p>
              <p className="mt-1 text-2xl font-bold text-zinc-100">{formatCurrency(kpis.inventario_valor.value)}</p>
            </div>
            <div className="kpi-card-neutral p-4">
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Cuentas por pagar</p>
              <p className="mt-1 text-2xl font-bold text-zinc-100">{formatCurrency(kpis.cuentas_por_pagar.value)}</p>
            </div>
          </div>
          <p className="text-sm text-zinc-500 mt-2">Cobrado en periodo: {formatCurrency(totalCobrado)}</p>
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
