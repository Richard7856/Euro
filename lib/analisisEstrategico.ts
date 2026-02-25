import type { Compra, Inventario, CuentaPorCobrar } from '@/types/financial';

export interface AlertaCritica {
  prioridad: 'CRÍTICO' | 'ALTA' | 'MEDIA' | 'BAJA';
  alerta: string;
  monto: number;
  fechaLimite: string;
  accionRequerida: string;
}

export interface MetricaOperativa {
  kpi: string;
  valor: string;
  meta: string;
  estado: 'bueno' | 'regular' | 'bajo' | 'critico';
  interpretacion: string;
}

export interface RecomendacionEstrategica {
  area: string;
  recomendacion: string;
  impacto: 'Alto' | 'Muy Alto' | 'Medio';
  prioridad: string;
}

interface DatosAnalisis {
  efectivo: number;
  cuentasPorCobrar: number;
  inventarioValor: number;
  cuentasPorPagar: number;
  totalCobrado: number;
  totalVendido: number; // cobrado + pendiente
  compras: Compra[];
  inventario: Inventario[];
  cuentas: CuentaPorCobrar[];
}

export function generarAlertasCriticas(datos: DatosAnalisis): AlertaCritica[] {
  const alertas: AlertaCritica[] = [];

  // Crédito Almendra DVD_BRS
  const creditoAlmendra = datos.compras.find(
    c => c.proveedor?.includes('DVD_BRS') || (c.producto_nombre?.toLowerCase().includes('almendra') && c.estado === 'CRÉDITO')
  );
  if (creditoAlmendra && creditoAlmendra.pendiente_mxn > 0) {
    alertas.push({
      prioridad: 'CRÍTICO',
      alerta: `Crédito ${creditoAlmendra.producto_nombre} ${creditoAlmendra.proveedor}`,
      monto: creditoAlmendra.pendiente_mxn,
      fechaLimite: creditoAlmendra.fecha_vencimiento || creditoAlmendra.nota_clave?.replace('Vence ', '') || '30/01/2026',
      accionRequerida: 'Pagar o renegociar INMEDIATO',
    });
  }

  // Déficit de caja
  if (datos.efectivo < 0) {
    alertas.push({
      prioridad: 'CRÍTICO',
      alerta: 'Déficit de caja',
      monto: datos.efectivo,
      fechaLimite: 'HOY',
      accionRequerida: 'Acelerar cobranza urgente',
    });
  }

  // Cobranza pendiente
  if (datos.cuentasPorCobrar > 0) {
    alertas.push({
      prioridad: 'ALTA',
      alerta: 'Cobranza pendiente',
      monto: datos.cuentasPorCobrar,
      fechaLimite: 'Esta semana',
      accionRequerida: 'Gestionar cobros',
    });
  }

  // Pistache sin vender (inventario pistache)
  const pistacheInv = datos.inventario
    .filter(i => i.nombre_producto?.toLowerCase().includes('pistache'))
    .reduce((s, i) => s + i.valor_total, 0);
  const pistacheCompras = datos.compras
    .filter(c => c.producto_nombre?.toLowerCase().includes('pistache') && c.estado !== 'PAGADO')
    .reduce((s, c) => s + c.pendiente_mxn + (c.inversion_mxn - c.pagado_mxn), 0);
  const pistacheTotal = pistacheInv + pistacheCompras;
  if (pistacheTotal > 100000) {
    alertas.push({
      prioridad: 'ALTA',
      alerta: 'Pistache sin vender / comprometido',
      monto: pistacheTotal,
      fechaLimite: '1 mes',
      accionRequerida: 'Estrategia comercial',
    });
  }

  // Limón perdido
  const limonPerdido = datos.compras.find(c => c.estado === 'PERDIDO' && c.producto_nombre?.toLowerCase().includes('limón'));
  if (limonPerdido) {
    alertas.push({
      prioridad: 'MEDIA',
      alerta: 'Limón perdido',
      monto: limonPerdido.pendiente_mxn || limonPerdido.inversion_mxn,
      fechaLimite: 'En proceso',
      accionRequerida: 'Seguimiento demanda',
    });
  }

  // Óptica no recibida
  const opticaNoRecibida = datos.compras.find(c => c.estado === 'NO RECIBIDA');
  if (opticaNoRecibida) {
    alertas.push({
      prioridad: 'MEDIA',
      alerta: 'Óptica no recibida',
      monto: opticaNoRecibida.inversion_mxn,
      fechaLimite: 'Pendiente',
      accionRequerida: 'Reclamo proveedor',
    });
  }

  // Dátil vendido a pérdida (inversión alta vs recuperación baja - margen negativo estimado)
  const datilCompras = datos.compras.filter(c =>
    c.producto_nombre?.toLowerCase().includes('dátil') || c.producto_nombre?.toLowerCase().includes('datil')
  );
  const datilInversion = datilCompras.reduce((s, c) => s + c.inversion_mxn, 0);
  const datilRecuperado = datilCompras.reduce((s, c) => s + c.pagado_mxn, 0);
  const datilEnInventario = datos.inventario
    .filter(i => i.nombre_producto?.toLowerCase().includes('dátil'))
    .reduce((s, i) => s + i.valor_total, 0);
  const perdidaDatil = datilInversion - datilRecuperado - datilEnInventario;
  if (perdidaDatil > 100000) {
    alertas.push({
      prioridad: 'BAJA',
      alerta: 'Dátil vendido a pérdida',
      monto: -perdidaDatil,
      fechaLimite: 'N/A',
      accionRequerida: 'Análisis post-mortem',
    });
  }

  return alertas.sort((a, b) => {
    const orden = { CRÍTICO: 0, ALTA: 1, MEDIA: 2, BAJA: 3 };
    return orden[a.prioridad] - orden[b.prioridad];
  });
}

export function generarMetricasOperativas(datos: DatosAnalisis): MetricaOperativa[] {
  const ventasAnualizadas = datos.totalCobrado * 12; // simplificado
  const rotacion = datos.inventarioValor > 0
    ? (datos.totalCobrado / datos.inventarioValor) * 100
    : 0;
  const eficienciaCobranza = datos.totalVendido > 0
    ? (datos.totalCobrado / datos.totalVendido) * 100
    : 0;

  const capitalTrabajo = datos.cuentasPorCobrar + datos.inventarioValor - datos.cuentasPorPagar;
  const ventasDiarias = datos.totalCobrado > 0 ? datos.totalCobrado / 365 : 1;
  const diasInventario = ventasDiarias > 0 ? Math.round(datos.inventarioValor / ventasDiarias) : 0;

  // Margen aproximado (ingresos - costos compras pagadas - gastos) / ingresos
  const costosAprox = datos.compras.reduce((s, c) => s + c.pagado_mxn, 0);
  const margen = datos.totalCobrado > 0
    ? ((datos.totalCobrado - costosAprox) / datos.totalCobrado) * 100
    : 0;

  const metricas: MetricaOperativa[] = [
    {
      kpi: 'Rotación de Inventario',
      valor: `${rotacion.toFixed(1)}%`,
      meta: '>50%',
      estado: rotacion >= 50 ? 'bueno' : rotacion >= 25 ? 'regular' : rotacion >= 10 ? 'bajo' : 'critico',
      interpretacion: rotacion < 15 ? 'Mucho stock sin mover' : rotacion < 50 ? 'Rotación por debajo de meta' : 'Rotación saludable',
    },
    {
      kpi: 'Eficiencia de Cobranza',
      valor: `${eficienciaCobranza.toFixed(1)}%`,
      meta: '>80%',
      estado: eficienciaCobranza >= 80 ? 'bueno' : eficienciaCobranza >= 50 ? 'regular' : eficienciaCobranza >= 20 ? 'bajo' : 'critico',
      interpretacion: eficienciaCobranza < 50 ? `Solo ${Math.round(eficienciaCobranza)}% cobrado del vendido` : 'Cobranza en rango',
    },
    {
      kpi: 'Margen Promedio',
      valor: `${margen.toFixed(1)}%`,
      meta: '>30%',
      estado: margen >= 30 ? 'bueno' : margen >= 20 ? 'regular' : margen >= 10 ? 'bajo' : 'critico',
      interpretacion: margen < 30 ? 'Mejorar márgenes' : 'Margen saludable',
    },
    {
      kpi: 'Días Inventario',
      valor: `${diasInventario.toLocaleString('es-MX')} días`,
      meta: '<90 días',
      estado: diasInventario <= 90 ? 'bueno' : diasInventario <= 180 ? 'regular' : diasInventario <= 365 ? 'bajo' : 'critico',
      interpretacion: diasInventario > 365
        ? 'Inventario tardaría años en venderse al ritmo actual'
        : diasInventario > 90
          ? 'Reducir inventario o acelerar ventas'
          : 'Inventario en rango',
    },
    {
      kpi: 'Capital de Trabajo',
      valor: new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(capitalTrabajo),
      meta: 'Positivo',
      estado: capitalTrabajo > 0 ? 'bueno' : 'critico',
      interpretacion: capitalTrabajo > 0 ? 'Cuentas por cobrar + inventario > por pagar' : 'Capital de trabajo negativo',
    },
  ];

  return metricas;
}

export function generarRecomendaciones(alertas: AlertaCritica[], metricas: MetricaOperativa[]): RecomendacionEstrategica[] {
  const recs: RecomendacionEstrategica[] = [];
  const agregadas = new Set<string>();

  const add = (area: string, rec: string, impacto: RecomendacionEstrategica['impacto'], prioridad: string) => {
    const key = `${area}-${rec.slice(0, 30)}`;
    if (!agregadas.has(key)) {
      agregadas.add(key);
      recs.push({ area, recomendacion: rec, impacto, prioridad });
    }
  };

  if (alertas.some(a => a.alerta.includes('Crédito') && a.prioridad === 'CRÍTICO')) {
    add('Tesorería', 'Renegociar plazo almendra o conseguir financiamiento', 'Alto', 'Inmediato');
  }
  if (alertas.some(a => a.alerta.includes('Déficit'))) {
    add('Tesorería', 'Reducir gastos y acelerar cobranza', 'Alto', 'Inmediato');
  }
  if (alertas.some(a => a.alerta.includes('Cobranza pendiente'))) {
    add('Cobranza', 'Implementar proceso agresivo de cobranza', 'Alto', 'Inmediato');
  }
  if (alertas.some(a => a.alerta.includes('Pistache'))) {
    add('Comercial', 'Campaña pistache: descuentos por volumen o promociones', 'Muy Alto', '1 semana');
  }
  if (alertas.some(a => a.alerta.includes('Limón') || a.alerta.includes('demanda'))) {
    add('Legal', 'Seguimiento demanda limón + reclamos', 'Medio', '2 semanas');
  }
  if (alertas.some(a => a.alerta.includes('Óptica'))) {
    add('Compras', 'Reclamar equipo óptica no entregado al proveedor', 'Medio', '2 semanas');
  }
  if (alertas.some(a => a.alerta.includes('Dátil') && a.alerta.includes('pérdida'))) {
    add('Producto', 'Discontinuar dátil (pérdida significativa)', 'Medio', '1 mes');
  }

  const rotacion = metricas.find(m => m.kpi.includes('Rotación'));
  if (rotacion && (rotacion.estado === 'bajo' || rotacion.estado === 'critico')) {
    add('Financiero', 'Controlar compras hasta mejorar rotación de inventario', 'Alto', 'Continuo');
  }

  return recs;
}
