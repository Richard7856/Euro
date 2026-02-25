'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { subMonths, format } from 'date-fns';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import KPICard from '@/components/KPICard';
import InventarioKPICard from '@/components/InventarioKPICard';
import VentasCxCCliente from '@/components/VentasCxCCliente';
import ComprasSection from '@/components/ComprasSection';
import PagosPanel from '@/components/PagosPanel';
import ClientesWindow from '@/components/ClientesWindow';
import ProveedoresWindow from '@/components/ProveedoresWindow';
import DateRangeFilter from '@/components/DateRangeFilter';
import ProductFilter from '@/components/ProductFilter';
import AlertasCriticas from '@/components/AlertasCriticas';
import MetricasOperativas from '@/components/MetricasOperativas';
import RecomendacionesEstrategicas from '@/components/RecomendacionesEstrategicas';
import { CashFlowAnalyzer } from '@/lib/cashFlowAnalyzer';
import { generarAlertasCriticas, generarMetricasOperativas, generarRecomendaciones } from '@/lib/analisisEstrategico';
import { ventasData, pedidosData, enviosData } from '@/lib/sampleData';
import { gastosDetallados, comprasData, inventarioData, cuentasPorCobrar, pagosProveedorData } from '@/lib/cashFlowData';
import type { FiltroFecha, Inventario, CuentaPorCobrar, Envio, Pedido, PagoProveedor } from '@/types/financial';
import type { Venta } from '@/types/financial';
import type { GastoDetallado } from '@/types/financial';
import type { Compra } from '@/types/financial';
import { parseISO, isWithinInterval } from 'date-fns';
import { parseDateForFilter } from '@/lib/dateUtils';
import { useEmpresaOptional } from '@/lib/empresaContext';

const getDefaultDateRange = (): FiltroFecha => {
  const hasta = new Date();
  const desde = subMonths(hasta, 12);
  return {
    desde: format(desde, 'yyyy-MM-dd'),
    hasta: format(hasta, 'yyyy-MM-dd')
  };
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

type DatosApi = {
  ventas: Venta[];
  pedidos: { id_pedido: string; id_venta: string; id_cliente: string; fecha_pedido: string; total_pedido: number }[];
  envios: { id_envio: string; producto: string; id_cliente: string; id_compra: string }[];
  compras: Compra[];
  gastos: GastoDetallado[];
  pagos: { id_compra: string; monto_pago: number }[];
  cuentasPorCobrar: { id_cliente: string; monto_total: number; monto_cobrado: number; monto_pendiente: number }[];
  inventario: { id_producto: string; nombre_producto: string; cantidad_disponible: number; valor_unitario_promedio: number; valor_total: number }[];
};

export default function FinancieroPage() {
  const empresaContext = useEmpresaOptional();
  const isEuromex = empresaContext?.empresa === 'euromex';

  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [filtroFecha, setFiltroFecha] = useState<FiltroFecha>(getDefaultDateRange);
  const [filtroProducto, setFiltroProducto] = useState<string>('');
  const [datosApi, setDatosApi] = useState<DatosApi | null>(null);

  const updateTimestamp = useCallback(() => {
    setLastUpdate(
      new Date().toLocaleString('es-MX', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    );
  }, []);

  useEffect(() => {
    if (isEuromex) {
      const t = setTimeout(() => { setLoading(false); updateTimestamp(); }, 500);
      return () => clearTimeout(t);
    }
    let cancelled = false;
    setLoading(true);
    fetch('/api/datos')
      .then((r) => r.ok ? r.json() : Promise.reject(new Error('Error al cargar')))
      .then((json) => {
        if (cancelled) return;
        const ventas = (json.ventas ?? []).map((v: Record<string, unknown>) => ({
          id_venta: String(v.id_venta ?? ''),
          fecha_pago: String(v.fecha_pago ?? ''),
          monto_pagado: Number(v.monto_pagado ?? 0),
          id_producto: v.id_producto ? String(v.id_producto) : undefined,
        }));
        const compras = (json.compras ?? []).map((c: Record<string, unknown>) => ({
          id_compra: String(c.id_compra ?? ''),
          producto_nombre: String(c.producto_nombre ?? c.movimiento ?? ''),
          fecha_compra: c.fecha_compra ? String(c.fecha_compra).slice(0, 10) : undefined,
          subtotal: Number(c.inversion_mxn ?? c.subtotal ?? 0),
          pagado_mxn: Number(c.pagado_mxn ?? 0),
          pendiente_mxn: Number(c.pendiente_mxn ?? 0),
          id_proveedor: c.proveedor ? String(c.proveedor) : undefined,
        }));
        const gastos = (json.gastos ?? []).map((g: Record<string, unknown>) => ({
          fecha: String(g.fecha ?? '').slice(0, 10),
          categoria: String(g.categoria ?? 'operativo'),
          monto: Number(g.monto ?? 0),
          descripcion: g.descripcion ? String(g.descripcion) : undefined,
        }));
        const inventario = (json.inventario ?? []).map((p: Record<string, unknown>) => ({
          id_producto: String(p.id_producto ?? ''),
          nombre_producto: String(p.nombre_producto ?? ''),
          cantidad_disponible: Number(p.cantidad_disponible ?? 0),
          valor_unitario_promedio: Number(p.valor_unitario_promedio ?? 0),
          valor_total: Number(p.valor_total ?? 0),
        }));
        const cxC = (json.cuentasPorCobrar ?? []).map((c: Record<string, unknown>) => ({
          id_cliente: String(c.id_cliente ?? c.nombre_cliente ?? ''),
          monto_total: Number(c.monto_total ?? 0),
          monto_cobrado: Number(c.monto_cobrado ?? 0),
          monto_pendiente: Number(c.monto_pendiente ?? 0),
        }));
        const pedidos = (json.pedidos ?? []).map((p: Record<string, unknown>) => ({
          id_pedido: String(p.id_pedido ?? ''),
          id_venta: String(p.id_venta ?? ''),
          id_cliente: String(p.id_cliente ?? ''),
          fecha_pedido: String(p.fecha_pedido ?? '').slice(0, 10),
          total_pedido: Number(p.total_pedido ?? 0),
        }));
        const envios = (json.envios ?? []).map((e: Record<string, unknown>) => ({
          id_envio: String(e.id_envio ?? ''),
          producto: String(e.producto ?? ''),
          id_cliente: String(e.id_cliente ?? ''),
          id_compra: String(e.id_compra ?? ''),
        }));
        const pagos = (json.pagos ?? []).map((p: Record<string, unknown>) => ({
          id_compra: String(p.id_compra ?? ''),
          fecha_pago: String(p.fecha_pago ?? '').slice(0, 10),
          monto_pago: Number(p.monto_pago ?? 0),
        }));
        setDatosApi({ ventas, pedidos, envios, compras, gastos, pagos, cuentasPorCobrar: cxC, inventario });
        setLoading(false);
        updateTimestamp();
      })
      .catch(() => {
        if (!cancelled) {
          setDatosApi({
            ventas: [], pedidos: [], envios: [], compras: [], gastos: [], pagos: [],
            cuentasPorCobrar: [], inventario: [],
          });
          setLoading(false);
          updateTimestamp();
        }
      });
    return () => { cancelled = true; };
  }, [isEuromex, updateTimestamp]);

  const handleRefresh = useCallback(() => {
    if (isEuromex) {
      setLoading(true);
      setTimeout(() => { setLoading(false); updateTimestamp(); }, 500);
      return;
    }
    setLoading(true);
    fetch('/api/datos')
      .then((r) => r.ok ? r.json() : Promise.reject(new Error('Error')))
      .then((json) => {
        const ventas = (json.ventas ?? []).map((v: Record<string, unknown>) => ({
          id_venta: String(v.id_venta ?? ''),
          fecha_pago: String(v.fecha_pago ?? ''),
          monto_pagado: Number(v.monto_pagado ?? 0),
          id_producto: v.id_producto ? String(v.id_producto) : undefined,
        }));
        const compras = (json.compras ?? []).map((c: Record<string, unknown>) => ({
          id_compra: String(c.id_compra ?? ''),
          producto_nombre: String(c.producto_nombre ?? c.movimiento ?? ''),
          fecha_compra: c.fecha_compra ? String(c.fecha_compra).slice(0, 10) : undefined,
          subtotal: Number(c.inversion_mxn ?? c.subtotal ?? 0),
          pagado_mxn: Number(c.pagado_mxn ?? 0),
          pendiente_mxn: Number(c.pendiente_mxn ?? 0),
          id_proveedor: c.proveedor ? String(c.proveedor) : undefined,
        }));
        const gastos = (json.gastos ?? []).map((g: Record<string, unknown>) => ({
          fecha: String(g.fecha ?? '').slice(0, 10),
          categoria: String(g.categoria ?? 'operativo'),
          monto: Number(g.monto ?? 0),
          descripcion: g.descripcion ? String(g.descripcion) : undefined,
        }));
        const inventario = (json.inventario ?? []).map((p: Record<string, unknown>) => ({
          id_producto: String(p.id_producto ?? ''),
          nombre_producto: String(p.nombre_producto ?? ''),
          cantidad_disponible: Number(p.cantidad_disponible ?? 0),
          valor_unitario_promedio: Number(p.valor_unitario_promedio ?? 0),
          valor_total: Number(p.valor_total ?? 0),
        }));
        const cxC = (json.cuentasPorCobrar ?? []).map((c: Record<string, unknown>) => ({
          id_cliente: String(c.id_cliente ?? c.nombre_cliente ?? ''),
          monto_total: Number(c.monto_total ?? 0),
          monto_cobrado: Number(c.monto_cobrado ?? 0),
          monto_pendiente: Number(c.monto_pendiente ?? 0),
        }));
        const pedidos = (json.pedidos ?? []).map((p: Record<string, unknown>) => ({
          id_pedido: String(p.id_pedido ?? ''),
          id_venta: String(p.id_venta ?? ''),
          id_cliente: String(p.id_cliente ?? ''),
          fecha_pedido: String(p.fecha_pedido ?? '').slice(0, 10),
          total_pedido: Number(p.total_pedido ?? 0),
        }));
        const envios = (json.envios ?? []).map((e: Record<string, unknown>) => ({
          id_envio: String(e.id_envio ?? ''),
          producto: String(e.producto ?? ''),
          id_cliente: String(e.id_cliente ?? ''),
          id_compra: String(e.id_compra ?? ''),
        }));
        const pagos = (json.pagos ?? []).map((p: Record<string, unknown>) => ({
          id_compra: String(p.id_compra ?? ''),
          fecha_pago: String(p.fecha_pago ?? '').slice(0, 10),
          monto_pago: Number(p.monto_pago ?? 0),
        }));
        setDatosApi({ ventas, pedidos, envios, compras, gastos, pagos, cuentasPorCobrar: cxC, inventario });
        setLoading(false);
        updateTimestamp();
      })
      .catch(() => { setLoading(false); updateTimestamp(); });
  }, [isEuromex, updateTimestamp]);

  const ventasBase = isEuromex ? ventasData : (datosApi?.ventas ?? []);
  const gastosBase = isEuromex ? gastosDetallados : (datosApi?.gastos ?? []);
  const comprasBase = isEuromex ? comprasData : (datosApi?.compras ?? []);
  const inventarioBase = useMemo((): Inventario[] => {
    if (isEuromex) return inventarioData;
    const raw = datosApi?.inventario ?? [];
    return raw.map((p) => ({
      id_producto: p.id_producto,
      nombre_producto: p.nombre_producto,
      cantidad_disponible: p.cantidad_disponible,
      valor_unitario_promedio: p.valor_unitario_promedio,
      valor_total: p.valor_total,
      fecha_ultima_compra: '',
      rotacion_dias: 0
    }));
  }, [isEuromex, datosApi?.inventario]);
  const cxCBase = useMemo((): CuentaPorCobrar[] => {
    if (isEuromex) return cuentasPorCobrar;
    const raw = datosApi?.cuentasPorCobrar ?? [];
    return raw.map((c) => ({
      id_venta: '',
      id_cliente: c.id_cliente,
      nombre_cliente: '',
      monto_total: c.monto_total,
      monto_cobrado: c.monto_cobrado,
      monto_pendiente: c.monto_pendiente,
      fecha_venta: '',
      dias_vencido: 0,
      estado: 'vigente' as const
    }));
  }, [isEuromex, datosApi?.cuentasPorCobrar]);
  const pedidosBase = useMemo((): Pedido[] => {
    if (isEuromex) return pedidosData;
    const raw = datosApi?.pedidos ?? [];
    return raw.map((p) => ({
      id_pedido: p.id_pedido,
      id_venta: p.id_venta,
      id_cliente: p.id_cliente,
      fecha_pedido: p.fecha_pedido,
      total_pedido: p.total_pedido,
      canal_venta: '',
      estado_pedido: 'Pendiente' as const
    }));
  }, [isEuromex, datosApi?.pedidos]);
  const enviosBase = useMemo((): Envio[] => {
    if (isEuromex) return enviosData;
    const raw = datosApi?.envios ?? [];
    return raw.map((e) => ({
      id_envio: e.id_envio,
      producto: e.producto,
      id_cliente: e.id_cliente,
      id_compra: e.id_compra,
      tipo_envio: 'Compra' as const,
      fecha_envio: '',
      proveedor_logistico: '',
      guia_rastreo: '',
      costo_envio: 0,
      origen: '',
      destino: '',
      estado_envio: ''
    }));
  }, [isEuromex, datosApi?.envios]);
  const pagosBase = useMemo((): PagoProveedor[] => {
    if (isEuromex) return pagosProveedorData;
    const raw = datosApi?.pagos ?? [];
    return raw.map((p, i) => ({
      id_pago: `pago-${i}`,
      id_compra: p.id_compra,
      fecha_pago: '',
      monto_pago: p.monto_pago,
      metodo_pago: ''
    }));
  }, [isEuromex, datosApi?.pagos]);

  const ventasPorFecha = useMemo(() => filterByDateRange(ventasBase, (v) => (v as Venta).fecha_pago, filtroFecha), [filtroFecha, ventasBase]);
  const gastosFiltrados = useMemo(() => filterByDateRange(gastosBase, (g) => (g as GastoDetallado).fecha, filtroFecha), [filtroFecha, gastosBase]);
  const comprasPorFecha = useMemo(() => filterByDateRange(comprasBase, (c) => (c as Compra).fecha_compra, filtroFecha), [filtroFecha, comprasBase]);

  const ventasFiltradas = useMemo(() => {
    if (!filtroProducto) return ventasPorFecha;
    return ventasPorFecha.filter((v) => (v as Venta).id_producto === filtroProducto);
  }, [ventasPorFecha, filtroProducto]);
  const comprasFiltradas = useMemo(() => {
    if (!filtroProducto) return comprasPorFecha;
    return comprasPorFecha.filter((c) => {
      const compra = c as Compra;
      return compra.id_producto === filtroProducto || compra.producto_nombre === inventarioBase.find((p: { id_producto: string }) => p.id_producto === filtroProducto)?.nombre_producto;
    });
  }, [comprasPorFecha, filtroProducto, inventarioBase]);
  const inventarioFiltrado = useMemo(() => {
    if (!filtroProducto) return inventarioBase;
    return inventarioBase.filter((p: { id_producto: string }) => p.id_producto === filtroProducto);
  }, [filtroProducto, inventarioBase]);

  const analyzer = useMemo(() => new CashFlowAnalyzer(
    ventasFiltradas,
    gastosFiltrados,
    comprasFiltradas,
    inventarioFiltrado,
    cxCBase,
    enviosBase
  ), [ventasFiltradas, gastosFiltrados, comprasFiltradas, inventarioFiltrado, cxCBase, enviosBase]);

  const kpis = analyzer.generarCashPositionKPIs();

  const totalCobrado = ventasFiltradas.reduce((s, v) => s + (v as Venta).monto_pagado, 0);
  const datosAnalisis = useMemo(() => ({
    efectivo: kpis.efectivo_disponible.value,
    cuentasPorCobrar: kpis.cuentas_por_cobrar.value,
    inventarioValor: kpis.inventario_valor.value,
    cuentasPorPagar: kpis.cuentas_por_pagar.value,
    totalCobrado,
    totalVendido: totalCobrado + kpis.cuentas_por_cobrar.value,
    compras: comprasBase,
    inventario: inventarioBase,
    cuentas: cxCBase,
  }), [kpis.efectivo_disponible.value, kpis.cuentas_por_cobrar.value, kpis.inventario_valor.value, kpis.cuentas_por_pagar.value, totalCobrado, comprasBase, inventarioBase, cxCBase]);

  const alertas = useMemo(() => generarAlertasCriticas(datosAnalisis), [datosAnalisis]);
  const metricas = useMemo(() => generarMetricasOperativas(datosAnalisis), [datosAnalisis]);
  const recomendaciones = useMemo(() => generarRecomendaciones(alertas, metricas), [alertas, metricas]);

  if (loading) {
    return (
      <div className="min-h-screen page-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 spinner-theme rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen page-bg text-slate-50 p-4 md:p-8">
      <div className="max-w-[1800px] mx-auto space-y-8">
        <DateRangeFilter value={filtroFecha} onChange={setFiltroFecha} />
        <ProductFilter
          products={inventarioBase.map((p: { id_producto: string; nombre_producto: string }) => ({ id_producto: p.id_producto, nombre_producto: p.nombre_producto }))}
          value={filtroProducto}
          onChange={setFiltroProducto}
        />

        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold gradient-text">
              Financiero
            </h1>
            <p className="text-slate-400 mt-2">Efectivo, CxC, CxP, ventas, compras y análisis</p>
            {lastUpdate && <p className="text-sm text-slate-500 mt-1">Última actualización: {lastUpdate}</p>}
          </div>
          <div className="flex gap-2 items-center flex-wrap">
            <a href="/dinamico" className="btn-secondary flex items-center gap-2">📊 Datos en vivo</a>
            <button onClick={handleRefresh} className="btn-primary flex items-center gap-2 hover:scale-105 transition-transform">
              <ArrowPathIcon className="w-5 h-5" /> Actualizar
            </button>
          </div>
        </header>

        <section>
          <h2 className="text-xl font-bold text-slate-300 mb-4 flex items-center gap-2"><span>💰</span> Posición de Efectivo</h2>
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
          <h2 className="text-xl font-bold text-slate-300 mb-4 flex items-center gap-2"><span>📊</span> Compromisos y Flujo</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard kpi={kpis.cuentas_por_pagar} />
            <KPICard kpi={kpis.flujo_neto_mes} />
            <KPICard kpi={kpis.burn_rate} />
            <KPICard kpi={kpis.runway_meses} />
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-300 mb-4 flex items-center gap-2"><span>💰</span> Ventas · Cuentas por Cobrar</h2>
          <VentasCxCCliente cuentas={cxCBase} pedidos={pedidosBase} envios={enviosBase} gastos={gastosBase} />
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-300 mb-4 flex items-center gap-2"><span>🛒</span> Compras</h2>
          <ComprasSection compras={comprasFiltradas} />
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-300 mb-4 flex items-center gap-2"><span>💳</span> Pagos</h2>
          <PagosPanel pagos={pagosBase} compras={comprasBase} />
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-300 mb-4 flex items-center gap-2"><span>👥</span> Ventana de Clientes</h2>
          <ClientesWindow cuentas={cxCBase} pedidos={pedidosBase} />
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-300 mb-4 flex items-center gap-2"><span>🏭</span> Ventana de Proveedores</h2>
          <ProveedoresWindow gastos={gastosBase} compras={comprasBase} envios={enviosBase} />
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-300 mb-4 flex items-center gap-2"><span>📋</span> Análisis Estratégico</h2>
          <div className="space-y-6">
            <AlertasCriticas alertas={alertas} />
            <MetricasOperativas metricas={metricas} />
            <RecomendacionesEstrategicas recomendaciones={recomendaciones} />
          </div>
        </section>

        <footer className="text-center text-slate-500 text-sm pt-8 border-t border-zinc-800">
          <p>Dashboard {empresaContext?.empresaInfo?.name ?? 'Euro'} · Financiero © 2026</p>
        </footer>
      </div>
    </main>
  );
}
