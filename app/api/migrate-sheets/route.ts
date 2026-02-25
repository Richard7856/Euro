import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { fetchAllSheetsData } from '@/lib/googleSheets';
import {
  mapVentas,
  mapPedidos,
  mapEnvios,
  mapCompras,
  mapGastos,
  mapPagos,
  mapInventario,
} from '@/lib/sheetsMappers';
import type { Envio, Compra } from '@/types/financial';

/**
 * POST /api/migrate-sheets
 * Migra datos desde Google Sheets a Supabase. Solo admin.
 * Ejecutar una vez para cargar histórico; luego el dashboard usa solo Supabase.
 */
export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('rol')
      .eq('id', user.id)
      .single();

    if (profile?.rol !== 'admin') {
      return NextResponse.json({ error: 'Solo administradores pueden ejecutar la migración' }, { status: 403 });
    }

    const raw = await fetchAllSheetsData();
    if ('error' in raw) {
      return NextResponse.json({ error: raw.error }, { status: 400 });
    }

    const ventas = mapVentas(raw.ventas || []);
    const pedidos = mapPedidos(raw.pedidos || []);
    const envios = mapEnvios(raw.envios || []);
    const compras = mapCompras(raw.compras || []);
    const gastos = mapGastos(raw.gastos || []);
    const pagos = mapPagos(raw.pagos || []);
    const inventario = mapInventario(raw.inventario || []);

    const counts = { cobros: 0, pedidos: 0, envios: 0, compras: 0, gastos: 0, pagos_compra: 0, productos: 0 };
    const errors: string[] = [];

    for (const v of ventas) {
      const { error } = await supabase.from('cobros').insert({
        id_venta: v.id_venta,
        id_producto: v.id_producto || null,
        canal_cobro: v.canal_cobro || 'DANTE',
        fecha_pago: v.fecha_pago || null,
        metodo_pago: v.metodo_pago || 'TRANSFERENCIA',
        monto_pagado: v.monto_pagado ?? 0,
      });
      if (error) errors.push(`cobros: ${error.message}`);
      else counts.cobros++;
    }

    for (const p of pedidos) {
      const { error } = await supabase.from('pedidos').upsert(
        {
          id_pedido: p.id_pedido,
          id_venta: p.id_venta,
          id_compra: p.id_compra || null,
          id_cliente: p.id_cliente,
          fecha_pedido: p.fecha_pedido || null,
          canal_venta: p.canal_venta || null,
          total_pedido: p.total_pedido ?? 0,
          estado_pedido: p.estado_pedido || 'Pendiente',
        },
        { onConflict: 'id_pedido' }
      );
      if (error) errors.push(`pedidos: ${error.message}`);
      else counts.pedidos++;
    }

    for (const e of envios as Envio[]) {
      const { error } = await supabase.from('envios').insert({
        id_envio: e.id_envio,
        producto: e.producto || null,
        id_cliente: e.id_cliente || null,
        id_compra: e.id_compra || null,
        tipo_envio: e.tipo_envio || null,
        fecha_envio: e.fecha_envio || null,
        proveedor_logistico: e.proveedor_logistico || null,
        guia_rastreo: e.guia_rastreo || null,
        costo_envio: e.costo_envio ?? 0,
        origen: e.origen || null,
        destino: e.destino || null,
        estado_envio: e.estado_envio || null,
        fecha_entrega: e.fecha_entrega || null,
      });
      if (error) errors.push(`envios: ${error.message}`);
      else counts.envios++;
    }

    for (const c of compras as Compra[]) {
      const { error } = await supabase.from('compras').upsert(
        {
          id_compra: c.id_compra,
          id_producto: c.id_producto || null,
          producto_nombre: c.producto_nombre || null,
          fecha_compra: c.fecha_compra || null,
          id_proveedor: c.proveedor || null,
          tipo_compra: c.tipo_pago || null,
          cantidad_compra: c.kg ?? null,
          subtotal: c.inversion_mxn ?? null,
          fecha_vencimiento: c.fecha_vencimiento || null,
          estado_pago: c.estado || 'Pendiente',
          observaciones: c.nota_clave || null,
        },
        { onConflict: 'id_compra' }
      );
      if (error) errors.push(`compras: ${error.message}`);
      else counts.compras++;
    }

    for (const g of gastos) {
      const { error } = await supabase.from('gastos').insert({
        categoria: g.categoria || 'operativo',
        monto: g.monto ?? 0,
        descripcion: g.descripcion || null,
        fecha: g.fecha || null,
        usuario_id: user.id,
      });
      if (error) errors.push(`gastos: ${error.message}`);
      else counts.gastos++;
    }

    for (const p of pagos) {
      const { error } = await supabase.from('pagos_compra').insert({
        id_pago: p.id_pago,
        id_compra: p.id_compra,
        fecha_pago: p.fecha_pago || null,
        monto_pago: p.monto_pago ?? 0,
        metodo_pago: p.metodo_pago || null,
      });
      if (error) errors.push(`pagos_compra: ${error.message}`);
      else counts.pagos_compra++;
    }

    for (const i of inventario) {
      const { error } = await supabase.from('productos').upsert(
        {
          id_producto: i.id_producto,
          nombre_producto: i.nombre_producto || '',
          cantidad_disponible: i.cantidad_disponible ?? 0,
          valor_unitario_promedio: i.valor_unitario_promedio ?? null,
          valor_total: i.valor_total ?? null,
          fecha_ultima_compra: i.fecha_ultima_compra || null,
          rotacion_dias: i.rotacion_dias ?? null,
        },
        { onConflict: 'id_producto' }
      );
      if (error) errors.push(`productos: ${error.message}`);
      else counts.productos++;
    }

    return NextResponse.json({
      ok: true,
      message: 'Migración completada',
      counts,
      errors: errors.length > 0 ? errors.slice(0, 20) : undefined,
    });
  } catch (err) {
    console.error('API migrate-sheets:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error en la migración' },
      { status: 500 }
    );
  }
}
