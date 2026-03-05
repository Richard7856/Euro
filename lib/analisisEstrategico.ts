import type { Compra, Inventario, CuentaPorCobrar } from '@/types/financial';
import { differenceInDays, parseISO } from 'date-fns';

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

function safeParseDate(s: string | undefined): Date | null {
  if (!s) return null;
  try {
    const d = parseISO(s);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

export function generarAlertasCriticas(datos: DatosAnalisis): AlertaCritica[] {
  const alertas: AlertaCritica[] = [];
  const hoy = new Date();

  // Compras a crédito vencidas o por vencer
  const comprasCredito = datos.compras.filter((c) => {
    const esCredito = c.tipo_pago === 'Crédito' || (c as unknown as Record<string, unknown>).tipo_compra === 'Crédito';
    return esCredito && (c.pendiente_mxn ?? 0) > 0;
  });
  for (const c of comprasCredito) {
    const venc = safeParseDate(c.fecha_vencimiento);
    if (!venc) continue;
    const dias = differenceInDays(venc, hoy);
    const nombre = c.producto_nombre ? ` — ${c.producto_nombre}` : '';
    if (dias < 0) {
      alertas.push({
        prioridad: 'CRÍTICO',
        alerta: `Pago vencido${nombre} (hace ${Math.abs(dias)} días)`,
        monto: c.pendiente_mxn ?? 0,
        fechaLimite: c.fecha_vencimiento!,
        accionRequerida: 'Pagar o renegociar de inmediato',
      });
    } else if (dias <= 7) {
      alertas.push({
        prioridad: 'CRÍTICO',
        alerta: `Crédito por vencer${nombre} en ${dias} día${dias === 1 ? '' : 's'}`,
        monto: c.pendiente_mxn ?? 0,
        fechaLimite: c.fecha_vencimiento!,
        accionRequerida: 'Programar pago esta semana',
      });
    } else if (dias <= 30) {
      alertas.push({
        prioridad: 'ALTA',
        alerta: `Crédito próximo a vencer${nombre} en ${dias} días`,
        monto: c.pendiente_mxn ?? 0,
        fechaLimite: c.fecha_vencimiento!,
        accionRequerida: 'Planificar pago',
      });
    }
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

  // CxC vencidas más de 60 días
  const cxcVencidas60 = datos.cuentas.filter((c) => c.dias_vencido > 60 && (c.monto_pendiente ?? 0) > 0);
  if (cxcVencidas60.length > 0) {
    const total = cxcVencidas60.reduce((s, c) => s + (c.monto_pendiente ?? 0), 0);
    alertas.push({
      prioridad: 'ALTA',
      alerta: `${cxcVencidas60.length} cuenta${cxcVencidas60.length > 1 ? 's' : ''} por cobrar con +60 días vencida${cxcVencidas60.length > 1 ? 's' : ''}`,
      monto: total,
      fechaLimite: 'Urgente',
      accionRequerida: 'Gestionar cobranza con clientes',
    });
  } else if (datos.cuentasPorCobrar > 0) {
    alertas.push({
      prioridad: 'ALTA',
      alerta: 'Cobranza pendiente',
      monto: datos.cuentasPorCobrar,
      fechaLimite: 'Esta semana',
      accionRequerida: 'Gestionar cobros',
    });
  }

  // Inventario con valor alto y baja rotación
  const inventarioParado = datos.inventario.filter(
    (i) => i.valor_total > 500000 && (i.rotacion_dias > 90 || !i.rotacion_dias)
  );
  for (const inv of inventarioParado) {
    alertas.push({
      prioridad: 'MEDIA',
      alerta: `Inventario parado — ${inv.nombre_producto ?? inv.id_producto}`,
      monto: inv.valor_total,
      fechaLimite: '1 mes',
      accionRequerida: 'Estrategia comercial para liquidar',
    });
  }

  return alertas.sort((a, b) => {
    const orden = { CRÍTICO: 0, ALTA: 1, MEDIA: 2, BAJA: 3 };
    return orden[a.prioridad] - orden[b.prioridad];
  });
}

export function generarMetricasOperativas(datos: DatosAnalisis): MetricaOperativa[] {
  const rotacion = datos.inventarioValor > 0
    ? (datos.totalCobrado / datos.inventarioValor) * 100
    : 0;
  const eficienciaCobranza = datos.totalVendido > 0
    ? (datos.totalCobrado / datos.totalVendido) * 100
    : 0;

  const capitalTrabajo = datos.cuentasPorCobrar + datos.inventarioValor - datos.cuentasPorPagar;
  const ventasDiarias = datos.totalCobrado > 0 ? datos.totalCobrado / 365 : 1;
  const diasInventario = ventasDiarias > 0 ? Math.round(datos.inventarioValor / ventasDiarias) : 0;

  const costosAprox = datos.compras.reduce((s, c) => s + (c.pagado_mxn ?? 0), 0);
  const margen = datos.totalCobrado > 0
    ? ((datos.totalCobrado - costosAprox) / datos.totalCobrado) * 100
    : 0;

  return [
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
      interpretacion: capitalTrabajo > 0 ? 'CxC + inventario > CxP' : 'Capital de trabajo negativo',
    },
  ];
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

  if (alertas.some(a => (a.alerta.includes('vencido') || a.alerta.includes('por vencer')) && a.prioridad === 'CRÍTICO')) {
    add('Tesorería', 'Renegociar plazos o conseguir financiamiento para créditos críticos', 'Alto', 'Inmediato');
  }
  if (alertas.some(a => a.alerta.includes('Déficit'))) {
    add('Tesorería', 'Reducir gastos y acelerar cobranza', 'Alto', 'Inmediato');
  }
  if (alertas.some(a => a.alerta.includes('60 días') || a.alerta.includes('Cobranza pendiente'))) {
    add('Cobranza', 'Implementar proceso activo de cobranza para cuentas vencidas', 'Alto', 'Inmediato');
  }
  if (alertas.some(a => a.alerta.includes('Inventario parado'))) {
    add('Comercial', 'Estrategia de liquidación para inventario parado (descuentos por volumen)', 'Muy Alto', '2 semanas');
  }
  if (alertas.some(a => a.alerta.includes('próximo a vencer'))) {
    add('Tesorería', 'Planificar flujo de caja para cubrir créditos próximos', 'Medio', 'Este mes');
  }

  const rotacion = metricas.find(m => m.kpi.includes('Rotación'));
  if (rotacion && (rotacion.estado === 'bajo' || rotacion.estado === 'critico')) {
    add('Financiero', 'Controlar compras hasta mejorar rotación de inventario', 'Alto', 'Continuo');
  }

  const eficiencia = metricas.find(m => m.kpi.includes('Eficiencia'));
  if (eficiencia && (eficiencia.estado === 'bajo' || eficiencia.estado === 'critico')) {
    add('Cobranza', 'Revisar términos de crédito con clientes y acortar plazos', 'Medio', 'Este mes');
  }

  return recs;
}
