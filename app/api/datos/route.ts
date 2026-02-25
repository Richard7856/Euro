import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEmpresaIdFromRequest, getEmpresaSlugFromRequest, EMPRESA_TO_PRODUCT_ID } from '@/lib/empresaApi';
import { convertToMxn } from '@/lib/currency';

/** Formato fecha para el front (yyyy-MM-dd) */
function toDateStr(d: string | null | undefined): string {
  if (!d) return '';
  const s = String(d).split('T')[0];
  return s || '';
}

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const empresaId = getEmpresaIdFromRequest(req);
    const empresaSlug = getEmpresaSlugFromRequest(req);
    const isEuromex = empresaSlug === 'euromex';
    const productIdForEmpresa = empresaSlug ? EMPRESA_TO_PRODUCT_ID[empresaSlug] : null;

    const qCobros = supabase.from('cobros').select('id_venta, id_producto, canal_cobro, fecha_pago, metodo_pago, monto_pagado, evidencia, notas');
    const qPedidos = supabase.from('pedidos').select('id_pedido, id_venta, id_compra, id_producto, id_cliente, fecha_pedido, canal_venta, total_pedido, estado_pedido');
    const qEnvios = supabase.from('envios').select('id_envio, producto, id_cliente, id_compra, tipo_envio, fecha_envio, proveedor_logistico, guia_rastreo, costo_envio, origen, destino, estado_envio, fecha_entrega');
    const qCompras = supabase.from('compras').select('id_compra, id_producto, movimiento, producto_nombre, fecha_compra, id_proveedor, tipo_compra, cantidad_compra, costo_unitario, subtotal, moneda, fecha_vencimiento, estado_pago, observaciones, tipo_cambio_usd');
    const qPagos = supabase.from('pagos_compra').select('id_pago, id_compra, fecha_pago, monto_pago, metodo_pago, referencia');
    const qGastos = supabase.from('gastos').select('id, categoria, monto, descripcion, fecha, tipo_cambio_usd');
    const qProductos = supabase.from('productos').select('id_producto, nombre_producto, categoria, cantidad_disponible, valor_unitario_promedio, valor_total, fecha_ultima_compra, rotacion_dias');

    const cobrosQ = empresaId ? (isEuromex ? qCobros.or(`empresa_id.eq.${empresaId},empresa_id.is.null`) : qCobros.eq('empresa_id', empresaId)) : qCobros;
    const pedidosQ = empresaId ? (isEuromex ? qPedidos.or(`empresa_id.eq.${empresaId},empresa_id.is.null`) : qPedidos.eq('empresa_id', empresaId)) : qPedidos;
    const enviosQ = empresaId ? (isEuromex ? qEnvios.or(`empresa_id.eq.${empresaId},empresa_id.is.null`) : qEnvios.eq('empresa_id', empresaId)) : qEnvios;
    const comprasQ = empresaId
      ? (isEuromex
        ? qCompras.or(`empresa_id.eq.${empresaId},empresa_id.is.null`)
        : productIdForEmpresa
          ? qCompras.or(`empresa_id.eq.${empresaId},and(empresa_id.is.null,id_producto.eq.${productIdForEmpresa})`)
          : qCompras.eq('empresa_id', empresaId))
      : qCompras;
    const pagosQ = empresaId
      ? (isEuromex ? qPagos.or(`empresa_id.eq.${empresaId},empresa_id.is.null`) : productIdForEmpresa ? qPagos.or(`empresa_id.eq.${empresaId},empresa_id.is.null`) : qPagos.eq('empresa_id', empresaId))
      : qPagos;
    const gastosQ = empresaId ? (isEuromex ? qGastos.or(`empresa_id.eq.${empresaId},empresa_id.is.null`) : qGastos.eq('empresa_id', empresaId)) : qGastos;
    const productosQ = empresaId ? (isEuromex ? qProductos.or(`empresa_id.eq.${empresaId},empresa_id.is.null`) : qProductos.eq('empresa_id', empresaId)) : qProductos;

    const [
      { data: cobrosRows },
      { data: pedidosRows },
      { data: enviosRows },
      { data: comprasRows },
      { data: pagosRows },
      { data: gastosRows },
      { data: productosRows },
    ] = await Promise.all([
      cobrosQ.order('fecha_pago', { ascending: false }),
      pedidosQ.order('fecha_pedido', { ascending: false }),
      enviosQ,
      comprasQ,
      pagosQ,
      gastosQ,
      productosQ,
    ]);

    const ventas = (cobrosRows ?? []).map((r: Record<string, unknown>) => ({
      id_venta: String(r.id_venta ?? ''),
      id_producto: String(r.id_producto ?? ''),
      canal_cobro: (String(r.canal_cobro ?? 'DANTE').toUpperCase().replace(/\s/g, '')) as 'DANTE' | 'EFECTIVO' | 'TRANSFERENCIA',
      fecha_pago: toDateStr(r.fecha_pago as string),
      metodo_pago: String(r.metodo_pago ?? 'TRANSFERENCIA').toUpperCase().includes('EFECTIVO') ? 'EFECTIVO' : 'TRANSFERENCIA',
      monto_pagado: Number(r.monto_pagado ?? 0),
      evidencia: r.evidencia ? String(r.evidencia) : undefined,
      notas: r.notas ? String(r.notas) : undefined,
    }));

    const pedidos = (pedidosRows ?? []).map((r: Record<string, unknown>) => ({
      id_pedido: String(r.id_pedido ?? ''),
      id_venta: String(r.id_venta ?? ''),
      id_compra: r.id_compra ? String(r.id_compra) : undefined,
      fecha_pedido: toDateStr(r.fecha_pedido as string),
      canal_venta: String(r.canal_venta ?? ''),
      id_cliente: String(r.id_cliente ?? ''),
      total_pedido: Number(r.total_pedido ?? 0),
      estado_pedido: String(r.estado_pedido ?? 'Pendiente'),
    }));

    const envios = (enviosRows ?? []).map((r: Record<string, unknown>) => ({
      id_envio: String(r.id_envio ?? ''),
      producto: String(r.producto ?? ''),
      id_cliente: String(r.id_cliente ?? ''),
      id_compra: String(r.id_compra ?? ''),
      tipo_envio: (String(r.tipo_envio ?? '').toLowerCase().includes('resguardo') ? 'Resguardo' : 'Compra') as 'Compra' | 'Resguardo',
      fecha_envio: toDateStr(r.fecha_envio as string),
      proveedor_logistico: String(r.proveedor_logistico ?? ''),
      guia_rastreo: String(r.guia_rastreo ?? ''),
      costo_envio: Number(r.costo_envio ?? 0),
      origen: String(r.origen ?? ''),
      destino: String(r.destino ?? ''),
      estado_envio: String(r.estado_envio ?? ''),
      fecha_entrega: r.fecha_entrega ? toDateStr(r.fecha_entrega as string) : undefined,
    }));

    const pagadoPorCompra = new Map<string, number>();
    for (const p of pagosRows ?? []) {
      const id = String((p as Record<string, unknown>).id_compra ?? '');
      const monto = Number((p as Record<string, unknown>).monto_pago ?? 0);
      pagadoPorCompra.set(id, (pagadoPorCompra.get(id) ?? 0) + monto);
    }

    const compras = (comprasRows ?? []).map((r: Record<string, unknown>) => {
      const id_compra = String(r.id_compra ?? '');
      const inv = Number(r.subtotal ?? 0);
      const moneda = r.moneda ? String(r.moneda).trim() : undefined;
      const invMxn = convertToMxn(inv, moneda);
      const pagado = pagadoPorCompra.get(id_compra) ?? 0;
      const tipo = String(r.tipo_compra ?? '');
      const esCredito = tipo.toLowerCase().includes('crédito') || tipo.toLowerCase().includes('credito');
      return {
        id_compra,
        producto_nombre: String(r.producto_nombre ?? r.movimiento ?? ''),
        kg: Number(r.cantidad_compra ?? 0),
        tipo_pago: (esCredito ? 'Crédito' : 'Contado') as 'Crédito' | 'Contado',
        proveedor: String(r.id_proveedor ?? ''),
        inversion_mxn: invMxn,
        pagado_mxn: pagado,
        pendiente_mxn: Math.max(0, invMxn - pagado),
        estado: String(r.estado_pago ?? 'Pendiente'),
        nota_clave: r.observaciones ? String(r.observaciones) : undefined,
        fecha_compra: toDateStr(r.fecha_compra as string) || undefined,
        fecha_vencimiento: toDateStr(r.fecha_vencimiento as string) || undefined,
        id_producto: r.id_producto ? String(r.id_producto) : undefined,
        tipo_cambio_usd: r.tipo_cambio_usd != null ? Number(r.tipo_cambio_usd) : undefined,
      };
    });

    const pagos = (pagosRows ?? []).map((r: Record<string, unknown>) => ({
      id_pago: String(r.id_pago ?? ''),
      id_compra: String(r.id_compra ?? ''),
      fecha_pago: toDateStr(r.fecha_pago as string),
      monto_pago: Number(r.monto_pago ?? 0),
      metodo_pago: String(r.metodo_pago ?? ''),
      referencia_bancaria: r.referencia ? String(r.referencia) : undefined,
    }));

    const gastos = (gastosRows ?? []).map((r: Record<string, unknown>) => ({
      id: String((r as { id?: string }).id ?? ''),
      fecha: toDateStr(r.fecha as string),
      categoria: (String(r.categoria ?? 'operativo').toLowerCase()) as 'fumigacion' | 'empaque' | 'logistica' | 'almacenaje' | 'compras' | 'operativo',
      descripcion: String(r.descripcion ?? ''),
      monto: Number(r.monto ?? 0),
      tipo_cambio_usd: r.tipo_cambio_usd != null ? Number(r.tipo_cambio_usd) : undefined,
    }));

    const ventaToCliente = new Map<string, string>();
    for (const p of pedidos) {
      if (p.id_venta && p.id_cliente) ventaToCliente.set(p.id_venta, p.id_cliente);
    }
    const cobradoPorCliente = new Map<string, number>();
    for (const v of ventas) {
      const cid = ventaToCliente.get(v.id_venta);
      if (cid) cobradoPorCliente.set(cid, (cobradoPorCliente.get(cid) ?? 0) + v.monto_pagado);
    }
    const byCliente = new Map<string, { id_venta: string; total: number; fecha: string }>();
    for (const p of pedidos) {
      if (!p.id_cliente) continue;
      const curr = byCliente.get(p.id_cliente);
      if (!curr) {
        byCliente.set(p.id_cliente, { id_venta: p.id_venta, total: p.total_pedido, fecha: p.fecha_pedido });
      } else {
        curr.total += p.total_pedido;
      }
    }
    const cuentasPorCobrar = [...byCliente.entries()].map(([id_cliente, v]) => {
      const cobrado = cobradoPorCliente.get(id_cliente) ?? 0;
      const total = v.total;
      return {
        id_venta: v.id_venta,
        id_cliente,
        nombre_cliente: id_cliente,
        monto_total: total,
        monto_cobrado: cobrado,
        monto_pendiente: Math.max(0, total - cobrado),
        fecha_venta: v.fecha,
        fecha_vencimiento: undefined as string | undefined,
        dias_vencido: 0,
        estado: 'vigente' as const,
      };
    });

    const inventario = (productosRows ?? []).map((r: Record<string, unknown>) => ({
      id_producto: String(r.id_producto ?? ''),
      nombre_producto: String(r.nombre_producto ?? ''),
      cantidad_disponible: Number(r.cantidad_disponible ?? 0),
      valor_unitario_promedio: Number(r.valor_unitario_promedio ?? 0),
      valor_total: Number(r.valor_total ?? 0),
      fecha_ultima_compra: toDateStr(r.fecha_ultima_compra as string),
      rotacion_dias: Number(r.rotacion_dias ?? 0) || 0,
    }));

    return NextResponse.json({
      ventas,
      pedidos,
      envios,
      compras,
      gastos,
      pagos,
      cuentasPorCobrar,
      inventario,
      _meta: {
        counts: {
          ventas: ventas.length,
          pedidos: pedidos.length,
          envios: envios.length,
          compras: compras.length,
          gastos: gastos.length,
          pagos: pagos.length,
          cuentasPorCobrar: cuentasPorCobrar.length,
          inventario: inventario.length,
        },
      },
    });
  } catch (err) {
    console.error('API /api/datos error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error al obtener datos' },
      { status: 500 }
    );
  }
}
