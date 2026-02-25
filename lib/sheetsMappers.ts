/**
 * Mapea filas crudas de Google Sheets a los tipos del dashboard
 * Ajusta índices de columnas según el orden real de tus hojas
 */

import { toISODate } from './dateUtils';

const num = (v: unknown): number => (typeof v === 'number' && !Number.isNaN(v)) ? v : parseFloat(String(v).replace(/[^0-9.-]/g, '')) || 0;
const str = (v: unknown): string => String(v ?? '').trim();

/** Cobros: ID_Venta, ID_Producto, CANAL DE COBRO, Fecha de pago, Método de pago, Monto Pagado, Evidencia, NOTAS */
export function mapVentas(rows: string[][]): Array<{ id_venta: string; id_producto: string; canal_cobro: string; fecha_pago: string; metodo_pago: string; monto_pagado: number }> {
  return rows.filter(r => r.some(c => c)).map(r => ({
    id_venta: str(r[0]),
    id_producto: str(r[1]),
    canal_cobro: (str(r[2]) || 'DANTE').toUpperCase().replace(/\s/g, ''),
    fecha_pago: toISODate(str(r[3])),
    metodo_pago: (str(r[4]) || 'TRANSFERENCIA').toUpperCase().includes('EFECTIVO') ? 'EFECTIVO' : 'TRANSFERENCIA',
    monto_pagado: num(r[5]),
  }));
}

/** Ventas: ID_Pedido, ID_Venta, ID_Compra, ID_Producto, ID_Cliente, ID_Logistica, Fecha_Pedido, Canal_Venta, Cantidad, Precio_Unitario, Logistica, Subtotal */
export function mapPedidos(rows: string[][]): Array<{ id_pedido: string; id_venta: string; id_compra?: string; fecha_pedido: string; canal_venta: string; id_cliente: string; total_pedido: number; estado_pedido: string }> {
  const byPedido = new Map<string, { id_venta: string; id_compra: string; fecha: string; canal: string; cliente: string; total: number }>();
  for (const r of rows.filter(r => r.some(c => c))) {
    const pid = str(r[0]);
    if (!pid) continue;
    const curr = byPedido.get(pid);
    const subtotal = num(r[11]);
    if (!curr) {
      byPedido.set(pid, { id_venta: str(r[1]), id_compra: str(r[2]), fecha: toISODate(str(r[6])), canal: str(r[7]), cliente: str(r[4]), total: subtotal });
    } else {
      curr.total += subtotal;
    }
  }
  return [...byPedido.entries()].map(([id_pedido, v]) => ({
    id_pedido,
    id_venta: v.id_venta,
    id_compra: v.id_compra || undefined,
    fecha_pedido: v.fecha,
    canal_venta: v.canal,
    id_cliente: v.cliente,
    total_pedido: v.total,
    estado_pedido: '',
  }));
}

/** Envios: ID_Envio, Producto, ID_Cliente, ID_Compra, Tipo_Envio, Fecha_Envio, Proveedor, Guía, Costo_Envio, Origen, Destino, Estado, Fecha_Entrega */
export function mapEnvios(rows: string[][]): Array<{ id_envio: string; producto: string; id_cliente: string; id_compra: string; tipo_envio: 'Compra' | 'Resguardo'; costo_envio: number; origen: string; destino: string }> {
  return rows.filter(r => r.some(c => c)).map(r => ({
    id_envio: str(r[0]),
    producto: str(r[1]),
    id_cliente: str(r[2]),
    id_compra: str(r[3]),
    tipo_envio: (str(r[4]).toLowerCase().includes('resguardo') ? 'Resguardo' : 'Compra') as 'Compra' | 'Resguardo',
    fecha_envio: str(r[5]),
    proveedor_logistico: str(r[6]),
    guia_rastreo: str(r[7]),
    costo_envio: num(r[8]),
    origen: str(r[9]),
    destino: str(r[10]),
    estado_envio: str(r[11]),
    fecha_entrega: str(r[12]),
  }));
}

/** Compras: ID_Compra, ID_Producto, Movimiento, Fecha_Compra, ID_Proveedor, Tipo_Compra, Cantidad_Compra, Costo_Unitario, Subtotal, Moneda, Fecha_Vencimi, Estado_Pago, Observaciones */
export function mapCompras(rows: string[][]): Array<{ id_compra: string; producto_nombre: string; kg: number; tipo_pago: 'Crédito' | 'Contado'; proveedor: string; inversion_mxn: number; pagado_mxn: number; pendiente_mxn: number; estado: string; nota_clave?: string; fecha_compra?: string; fecha_vencimiento?: string }> {
  return rows.filter(r => r.some(c => c)).map(r => {
    const tipo = str(r[5]);
    const esCredito = tipo.toLowerCase().includes('crédito') || tipo.toLowerCase().includes('credito');
    const sub = num(r[8]);
    return {
      id_compra: str(r[0]),
      producto_nombre: str(r[2]) || str(r[1]),
      id_producto: str(r[1]) || undefined,
      kg: num(r[6]),
      tipo_pago: esCredito ? 'Crédito' : 'Contado',
      proveedor: str(r[4]),
      inversion_mxn: sub,
      pagado_mxn: 0,
      pendiente_mxn: sub,
      estado: str(r[11]) || 'Pendiente',
      nota_clave: str(r[12]) || undefined,
      fecha_compra: toISODate(str(r[3])) || undefined,
      fecha_vencimiento: toISODate(str(r[10])) || undefined,
    };
  });
}

/** Fumigación: ID_Fumigación, Sede, Dirección, Proveedor, Frecuencia, Fecha_Fumigaci, Próxima_Fumiga, Costo, Responsable */
export function mapGastos(rows: string[][]): Array<{ id: string; fecha: string; categoria: string; descripcion: string; monto: number; proveedor?: string }> {
  return rows.filter(r => r.some(c => c)).map(r => ({
    id: str(r[0]),
    fecha: toISODate(str(r[5]) || str(r[6])),
    categoria: 'fumigacion' as const,
    descripcion: `${str(r[1])} ${str(r[2])}`.trim() || 'Fumigación',
    monto: num(r[7]),
    proveedor: str(r[3]) || undefined,
  }));
}

/** Pagos proveedores: ID_Pago, ID_Compra, Fecha_Pago, Monto_Pago, Método_Pago */
export function mapPagos(rows: string[][]): Array<{ id_pago: string; id_compra: string; fecha_pago: string; monto_pago: number; metodo_pago: string }> {
  return rows.filter(r => r.some(c => c)).map(r => ({
    id_pago: str(r[0]),
    id_compra: str(r[1]),
    fecha_pago: toISODate(str(r[2])),
    monto_pago: num(r[3]),
    metodo_pago: str(r[4]),
  }));
}

/** Ventas agregadas por cliente: ID_Pedido, ID_Venta, ID_Compra, ID_Producto, ID_Cliente, ..., Subtotal */
export function mapCuentasPorCobrar(rows: string[][]): Array<{ id_venta: string; id_cliente: string; nombre_cliente: string; monto_total: number; monto_cobrado: number; monto_pendiente: number; fecha_venta: string; fecha_vencimiento?: string; dias_vencido: number; estado: 'vigente' | 'por_vencer' | 'vencido' }> {
  const byCliente = new Map<string, { id_venta: string; total: number; fecha: string }>();
  for (const r of rows.filter(r => r.some(c => c))) {
    const cid = str(r[4]);
    if (!cid) continue;
    const curr = byCliente.get(cid);
    const sub = num(r[11]);
    const idv = str(r[1]);
    const fecha = toISODate(str(r[6]));
    if (!curr) {
      byCliente.set(cid, { id_venta: idv, total: sub, fecha });
    } else {
      curr.total += sub;
    }
  }
  return [...byCliente.entries()].map(([id_cliente, v]) => ({
    id_venta: v.id_venta,
    id_cliente,
    nombre_cliente: id_cliente,
    monto_total: v.total,
    monto_cobrado: 0,
    monto_pendiente: v.total,
    fecha_venta: v.fecha,
    fecha_vencimiento: undefined,
    dias_vencido: 0,
    estado: 'vigente' as const,
  }));
}

/** Productos: ID_Producto, Nombre_Producto, Categoría, Unidad(kg), Costo_Referencia, Moneda_Costo, Precio_Venta_Referencia, Moneda_Venta, Costo_Total_Producto, Estado, Venta_total */
export function mapInventario(rows: string[][]): Array<{ id_producto: string; nombre_producto: string; cantidad_disponible: number; valor_unitario_promedio: number; valor_total: number; fecha_ultima_compra: string; rotacion_dias: number }> {
  return rows.filter(r => r.some(c => c)).map(r => ({
    id_producto: str(r[0]),
    nombre_producto: str(r[1]),
    cantidad_disponible: num(r[3]),
    valor_unitario_promedio: num(r[4]),
    valor_total: num(r[8]),
    fecha_ultima_compra: '',
    rotacion_dias: 0,
  }));
}
