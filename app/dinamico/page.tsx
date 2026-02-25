'use client';

import { useState, useEffect, useMemo } from 'react';
import { subMonths, format } from 'date-fns';
import { ArrowPathIcon, LinkIcon } from '@heroicons/react/24/outline';
import KPICard from '@/components/KPICard';
import InventarioKPICard from '@/components/InventarioKPICard';
import VentasCxCCliente from '@/components/VentasCxCCliente';
import ComprasSection from '@/components/ComprasSection';
import PagosPanel from '@/components/PagosPanel';
import ClientesWindow from '@/components/ClientesWindow';
import ProveedoresWindow from '@/components/ProveedoresWindow';
import DateRangeFilter from '@/components/DateRangeFilter';
import LogoutButton from '@/components/LogoutButton';
import ProductFilter from '@/components/ProductFilter';
import AlertasCriticas from '@/components/AlertasCriticas';
import MetricasOperativas from '@/components/MetricasOperativas';
import RecomendacionesEstrategicas from '@/components/RecomendacionesEstrategicas';
import { CashFlowAnalyzer } from '@/lib/cashFlowAnalyzer';
import { generarAlertasCriticas, generarMetricasOperativas, generarRecomendaciones } from '@/lib/analisisEstrategico';
import type { FiltroFecha } from '@/types/financial';
import type { Venta, GastoDetallado, Compra, Inventario, CuentaPorCobrar, PagoProveedor } from '@/types/financial';
import type { Envio } from '@/types/financial';
import type { Pedido } from '@/types/financial';
import { parseISO, isWithinInterval } from 'date-fns';
import { parseDateForFilter } from '@/lib/dateUtils';
import { useEmpresaOptional } from '@/lib/empresaContext';

const getDefaultDateRange = (): FiltroFecha => {
  const hasta = new Date();
  const desde = subMonths(hasta, 12);
  return { desde: format(desde, 'yyyy-MM-dd'), hasta: format(hasta, 'yyyy-MM-dd') };
};

function filterByDateRange<T>(
  items: T[],
  getDate: (item: T) => string | undefined,
  filtro: FiltroFecha
): T[] {
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

type DashboardData = {
  ventas: Array<{ id_venta: string; id_producto: string; canal_cobro: string; fecha_pago: string; metodo_pago: string; monto_pagado: number }>;
  pedidos: Pedido[];
  envios: Envio[];
  compras: Compra[];
  gastos: GastoDetallado[];
  pagos: PagoProveedor[];
  cuentasPorCobrar: CuentaPorCobrar[];
  inventario: Inventario[];
  _meta?: { counts: Record<string, number> };
};

export default function DashboardDinamicoPage() {
  const empresaContext = useEmpresaOptional();
  const empresaName = empresaContext?.empresaInfo?.name ?? 'Euromex';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [filtroFecha, setFiltroFecha] = useState<FiltroFecha>(getDefaultDateRange);
  const [filtroProducto, setFiltroProducto] = useState<string>('');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/datos', { credentials: 'include' });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || `Error ${res.status}`);
      }
      const json = await res.json();
      setData(json);
      setLastUpdate(new Date().toLocaleString('es-MX', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar datos');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [empresaContext?.empresa]);

  const ventasPorFecha = useMemo(
    () => (data ? filterByDateRange(data.ventas, (v) => v.fecha_pago, filtroFecha) : []),
    [data, filtroFecha]
  );
  const gastosFiltrados = useMemo(
    () => (data ? filterByDateRange(data.gastos, (g) => g.fecha, filtroFecha) : []),
    [data, filtroFecha]
  );
  const comprasPorFecha = useMemo(
    () => (data ? filterByDateRange(data.compras, (c) => c.fecha_compra, filtroFecha) : []),
    [data, filtroFecha]
  );
  const ventasFiltradas = useMemo(() => {
    if (!filtroProducto) return ventasPorFecha;
    return ventasPorFecha.filter((v) => v.id_producto === filtroProducto);
  }, [ventasPorFecha, filtroProducto]);
  const comprasFiltradas = useMemo(() => {
    if (!filtroProducto || !data) return comprasPorFecha;
    const nombreProducto = data.inventario.find((p) => p.id_producto === filtroProducto)?.nombre_producto;
    return comprasPorFecha.filter((c) => c.id_producto === filtroProducto || c.producto_nombre === nombreProducto);
  }, [comprasPorFecha, filtroProducto, data]);
  const inventarioFiltrado = useMemo(() => {
    if (!data) return [];
    if (!filtroProducto) return data.inventario;
    return data.inventario.filter((p) => p.id_producto === filtroProducto);
  }, [data, filtroProducto]);

  const analyzer = useMemo(() => {
    if (!data) return null;
    return new CashFlowAnalyzer(
      ventasFiltradas as Venta[],
      gastosFiltrados,
      comprasFiltradas,
      inventarioFiltrado,
      data.cuentasPorCobrar,
      data.envios ?? []
    );
  }, [data, ventasFiltradas, gastosFiltrados, comprasFiltradas, inventarioFiltrado]);

  const kpis = analyzer?.generarCashPositionKPIs();

  const totalCobrado = useMemo(() => data ? ventasFiltradas.reduce((s, v) => s + v.monto_pagado, 0) : 0, [data, ventasFiltradas]);
  const datosAnalisis = useMemo(() => {
    if (!data || !kpis) return null;
    return {
      efectivo: kpis.efectivo_disponible.value,
      cuentasPorCobrar: kpis.cuentas_por_cobrar.value,
      inventarioValor: kpis.inventario_valor.value,
      cuentasPorPagar: kpis.cuentas_por_pagar.value,
      totalCobrado,
      totalVendido: totalCobrado + kpis.cuentas_por_cobrar.value,
      compras: data.compras,
      inventario: data.inventario,
      cuentas: data.cuentasPorCobrar,
    };
  }, [data, kpis, totalCobrado]);

  const alertas = useMemo(() => datosAnalisis ? generarAlertasCriticas(datosAnalisis) : [], [datosAnalisis]);
  const metricas = useMemo(() => datosAnalisis ? generarMetricasOperativas(datosAnalisis) : [], [datosAnalisis]);
  const recomendaciones = useMemo(() => generarRecomendaciones(alertas, metricas), [alertas, metricas]);

  if (loading && !data) {
    return (
      <div className="min-h-screen page-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 spinner-theme rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Cargando datos...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen page-bg flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center bg-slate-800/60 rounded-xl p-8 border border-slate-700">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-slate-100 mb-2">No se pudieron cargar los datos</h2>
          <p className="text-slate-400 mb-6">{error}</p>
          <p className="text-sm text-slate-500 mb-6">
            Verifica tu sesión y la conexión a Supabase.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <button onClick={fetchData} className="btn-primary flex items-center gap-2">
              <ArrowPathIcon className="w-5 h-5" />
              Reintentar
            </button>
            <a href="/" className="btn-secondary flex items-center gap-2">
              <LinkIcon className="w-5 h-5" />
              Dashboard estático
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (!data || !kpis) {
    return null;
  }

  return (
    <main className="min-h-screen page-bg text-slate-50 p-4 md:p-8">
      <div className="max-w-[1800px] mx-auto space-y-8">
        <DateRangeFilter value={filtroFecha} onChange={setFiltroFecha} />

        <ProductFilter
          products={data.inventario.map((p) => ({ id_producto: p.id_producto, nombre_producto: p.nombre_producto }))}
          value={filtroProducto}
          onChange={setFiltroProducto}
        />

        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded theme-accent-muted-bg theme-accent-light text-xs font-bold">EN VIVO · BD</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold gradient-text">
              Datos en vivo
            </h1>
            <p className="text-slate-400 mt-2">Datos desde la base de datos · {empresaName}</p>
            {lastUpdate && <p className="text-sm text-slate-500 mt-1">Última actualización: {lastUpdate}</p>}
            {data._meta?.counts && (
              <p className="text-xs text-slate-500 mt-1">
                {data._meta.counts.ventas} cobros · {data._meta.counts.pedidos} pedidos · {data._meta.counts.envios} envíos · {data._meta.counts.gastos} gastos · {data._meta.counts.compras} compras · {data._meta.counts.inventario} productos
              </p>
            )}
          </div>
          <div className="flex gap-2 items-center flex-wrap">
            <LogoutButton />
            <a href="/" className="btn-secondary flex items-center gap-2">
              <LinkIcon className="w-5 h-5" />
              Estático
            </a>
            <button onClick={fetchData} className="btn-primary flex items-center gap-2 hover:scale-105 transition-transform">
              <ArrowPathIcon className="w-5 h-5" />
              Actualizar
            </button>
          </div>
        </header>

        <section>
          <h2 className="text-xl font-bold text-slate-300 mb-4 flex items-center gap-2">
            <span>💰</span>
            <span>Posición de Efectivo</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard kpi={kpis.efectivo_disponible} />
            <div onClick={() => window.location.href = '/cobranza'} className="cursor-pointer transition-transform hover:scale-[1.02]">
              <KPICard kpi={kpis.cuentas_por_cobrar} />
            </div>
            <InventarioKPICard kpi={kpis.inventario_valor} inventario={inventarioFiltrado} />
            <KPICard kpi={kpis.gastos_almacenaje_logistica_fumigacion} />
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-300 mb-4 flex items-center gap-2">
            <span>📊</span>
            <span>Compromisos y Flujo</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard kpi={kpis.cuentas_por_pagar} />
            <KPICard kpi={kpis.flujo_neto_mes} />
            <KPICard kpi={kpis.burn_rate} />
            <KPICard kpi={kpis.runway_meses} />
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-300 mb-4 flex items-center gap-2">
            <span>💰</span>
            <span>Ventas · Cuentas por Cobrar</span>
          </h2>
          <VentasCxCCliente
            cuentas={data.cuentasPorCobrar}
            pedidos={data.pedidos}
            envios={data.envios}
            gastos={data.gastos}
          />
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-300 mb-4 flex items-center gap-2">
            <span>🛒</span>
            <span>Compras</span>
          </h2>
          <ComprasSection compras={comprasFiltradas} />
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-300 mb-4 flex items-center gap-2">
            <span>💳</span>
            <span>Pagos</span>
          </h2>
          <PagosPanel pagos={data.pagos} compras={data.compras} />
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-300 mb-4 flex items-center gap-2">
            <span>👥</span>
            <span>Ventana de Clientes</span>
          </h2>
          <ClientesWindow cuentas={data.cuentasPorCobrar} pedidos={data.pedidos} />
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-300 mb-4 flex items-center gap-2">
            <span>🏭</span>
            <span>Ventana de Proveedores</span>
          </h2>
          <ProveedoresWindow gastos={data.gastos} compras={data.compras} envios={data.envios} />
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-300 mb-4 flex items-center gap-2">
            <span>📋</span>
            <span>Análisis Estratégico</span>
          </h2>
          <div className="space-y-6">
            <AlertasCriticas alertas={alertas} />
            <MetricasOperativas metricas={metricas} />
            <RecomendacionesEstrategicas recomendaciones={recomendaciones} />
          </div>
        </section>

        <footer className="text-center text-slate-500 text-sm pt-8 border-t border-zinc-800">
          <p>Datos en vivo · Base de datos · {empresaName} © 2026</p>
        </footer>
      </div>
    </main>
  );
}
