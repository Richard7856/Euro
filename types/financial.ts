// Tipos basados en la estructura de Google Sheets

export interface Asignacion {
  id_asignacion: string;
  id_detalle_compra: string;
  id_detalle_pedido: string;
  cantidad_asignada: number;
}

export interface Venta {
  id_venta: string;
  id_producto: string;
  canal_cobro: 'DANTE' | 'EFECTIVO' | 'TRANSFERENCIA';
  fecha_pago: string;
  metodo_pago: 'EFECTIVO' | 'TRANSFERENCIA';
  monto_pagado: number;
  evidencia?: string;
  notas?: string;
}

export interface Pedido {
  id_pedido: string;
  id_venta: string;
  id_compra?: string;
  fecha_pedido: string;
  canal_venta: 'Dante/Arabe' | 'Dante' | string;
  id_cliente: string;
  total_pedido: number;
  estado_pedido: 'Entregado' | 'Pendiente' | string;
  salida_bodega?: string;
}

export interface DetallePedido {
  id_detalle_pedido: string;
  id_venta: string;
  id_pedido: string;
  id_producto: string;
  id_cliente: string;
  cantidad_vendida: number;
  precio_unitario: number;
  subtotal: number;
  id_envio_venta?: string;
}

export interface Envio {
  id_envio: string;
  producto: string;
  id_cliente: string;
  id_compra: string;
  tipo_envio: 'Compra' | 'Resguardo';
  fecha_envio: string;
  proveedor_logistico: string;
  guia_rastreo: string;
  costo_envio: number;
  origen: string;
  destino: string;
  estado_envio: string;
  fecha_entrega?: string;
}

// KPIs y Métricas
export interface KPI {
  label: string;
  value: number;
  change?: number; // Porcentaje de cambio
  trend?: 'up' | 'down' | 'neutral';
  format: 'currency' | 'percentage' | 'number';
}

export interface ProductoAnalisis {
  id_producto: string;
  nombre_producto: string;
  total_vendido: number;
  cantidad_vendida: number;
  margen_promedio: number;
  ingresos: number;
}

export interface ClienteAnalisis {
  id_cliente: string;
  total_compras: number;
  total_pedidos: number;
  credito_pendiente: number;
  ultimo_pedido: string;
}

export interface CanalAnalisis {
  canal: string;
  ingresos: number;
  porcentaje: number;
  num_ventas: number;
}

export interface DashboardData {
  kpis: {
    ingresos_totales: KPI;
    gastos_totales: KPI;
    margen_bruto: KPI;
    creditos_pendientes: KPI;
  };
  ventas_por_mes: { mes: string; ingresos: number; gastos: number; margen: number }[];
  productos_top: ProductoAnalisis[];
  clientes_top: ClienteAnalisis[];
  canales: CanalAnalisis[];
  gastos_logistica: { mes: string; costo: number }[];
}

// Filtros
export interface FiltroFecha {
  desde: string;
  hasta: string;
}

export interface Filtros {
  fecha?: FiltroFecha;
  cliente?: string;
  producto?: string;
  canal?: string;
}

// Nuevos tipos para control de efectivo

export type CategoriaGasto = 'fumigacion' | 'empaque' | 'logistica' | 'almacenaje' | 'compras' | 'operativo';

export interface GastoDetallado {
  id: string;
  fecha: string;
  categoria: CategoriaGasto;
  descripcion: string;
  monto: number;
  proveedor?: string;
  id_producto?: string;
  id_compra?: string;
}

// Estados extendidos según screenshot
export type EstadoCompra = 'CRÉDITO' | 'PENDIENTE' | 'PAGADO' | 'PERDIDO' | 'NO RECIBIDA';

export interface Compra {
  id_compra: string;
  producto_nombre: string; // Nombre directo del producto
  kg: number;
  tipo_pago: 'Crédito' | 'Contado';
  proveedor: string;
  inversion_mxn: number;
  pagado_mxn: number;
  pendiente_mxn: number;
  estado: EstadoCompra;
  nota_clave?: string;
  fecha_compra?: string; // Mantener opcional para compatibilidad
  fecha_vencimiento?: string; // Para timer de cobros
  id_producto?: string; // Mantener opcional
}

export interface PagoProveedor {
  id_pago: string;
  id_compra: string;
  fecha_pago: string;
  monto_pago: number;
  metodo_pago: string;
  referencia_bancaria?: string;
}

export interface Inventario {
  id_producto: string;
  nombre_producto: string;
  cantidad_disponible: number;
  valor_unitario_promedio: number;
  valor_total: number;
  fecha_ultima_compra: string;
  rotacion_dias: number;
}

export interface CuentaPorCobrar {
  id_venta: string;
  id_cliente: string;
  nombre_cliente: string;
  monto_total: number;
  monto_cobrado: number;
  monto_pendiente: number;
  fecha_venta: string;
  fecha_vencimiento?: string;
  dias_vencido: number;
  estado: 'vigente' | 'por_vencer' | 'vencido';
}

export interface GastosPorCategoria {
  categoria: CategoriaGasto;
  total: number;
  porcentaje: number;
  count: number;
}

export interface CashFlowData {
  efectivo_inicial: number;
  cobros: number;
  gastos_fumigacion: number;
  gastos_empaque: number;
  gastos_logistica: number;
  gastos_almacenaje: number;
  compras: number;
  otros_gastos: number;
  efectivo_final: number;
}

export interface CashPositionKPIs {
  efectivo_disponible: KPI;
  cuentas_por_cobrar: KPI;
  inventario_valor: KPI;
  gastos_almacenaje_logistica_fumigacion: KPI;
  cuentas_por_pagar: KPI;
  flujo_neto_mes: KPI;
  burn_rate: KPI;
  runway_meses: KPI;
}

