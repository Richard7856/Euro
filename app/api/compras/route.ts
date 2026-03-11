import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEmpresaIdFromRequest, getEmpresaSlugFromRequest, EMPRESA_TO_PRODUCT_ID } from '@/lib/empresaApi';

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const empresaId = getEmpresaIdFromRequest(req);
    const empresaSlug = getEmpresaSlugFromRequest(req);
    const productIdForEmpresa = empresaSlug ? EMPRESA_TO_PRODUCT_ID[empresaSlug] : null;

    let comprasQuery = supabase.from('compras').select('*');
    if (empresaId && productIdForEmpresa) {
      // Incluir compras con empresa_id = X O (empresa_id nulo y id_producto = CGR/CRQ) para que se vean Cigarros/Garritas
      comprasQuery = comprasQuery.or(`empresa_id.eq.${empresaId},and(empresa_id.is.null,id_producto.eq.${productIdForEmpresa})`);
    } else if (empresaId) {
      comprasQuery = comprasQuery.eq('empresa_id', empresaId);
    }
    const { data: compras, error } = await comprasQuery.order('fecha_compra', { ascending: false }).limit(500);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    let pagos: { id_compra: string; monto_pago: number }[] | null;
    if (empresaId && (compras?.length ?? 0) > 0 && productIdForEmpresa) {
      // Pagos por id_compra para no depender de empresa_id en pagos_compra
      const ids = (compras ?? []).map((c: { id_compra?: string }) => c.id_compra).filter(Boolean) as string[];
      const { data } = await supabase.from('pagos_compra').select('id_compra, monto_pago').in('id_compra', ids);
      pagos = data ?? null;
    } else {
      let pagosQuery = supabase.from('pagos_compra').select('id_compra, monto_pago');
      if (empresaId) pagosQuery = pagosQuery.eq('empresa_id', empresaId);
      const { data } = await pagosQuery;
      pagos = data ?? null;
    }
    const pagadoPorCompra = new Map<string, number>();
    for (const p of pagos ?? []) {
      const id = (p as { id_compra: string }).id_compra;
      const monto = Number((p as { monto_pago: number }).monto_pago ?? 0);
      pagadoPorCompra.set(id, (pagadoPorCompra.get(id) ?? 0) + monto);
    }

    const rows = (compras ?? []).map((c: Record<string, unknown>) => {
      const id = String(c.id_compra ?? '');
      const sub = Number(c.subtotal ?? 0);
      const pagado = pagadoPorCompra.get(id) ?? 0;
      return { ...c, pagado_mxn: pagado, pendiente_mxn: Math.max(0, sub - pagado) };
    });

    return NextResponse.json({ compras: rows });
  } catch (err) {
    console.error('API compras GET:', err);
    return NextResponse.json({ error: 'Error al obtener compras' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const body = await req.json();
    const {
      id_compra, id_producto, movimiento, producto_nombre, fecha_compra, id_proveedor, tipo_compra,
      cantidad_compra, costo_unitario, subtotal, moneda, fecha_vencimiento, estado_pago, observaciones,
    } = body;

    if (!id_compra) return NextResponse.json({ error: 'Se requiere id_compra' }, { status: 400 });

    const { data: cfg } = await supabase.from('app_config').select('value').eq('key', 'usd_to_mxn').single();
    const rate = cfg?.value ? parseFloat(String(cfg.value)) : 18;
    const tipoCambioUsd = Number.isFinite(rate) && rate > 0 ? rate : 18;

    const empresaId = getEmpresaIdFromRequest(req);
    const sub = subtotal != null ? parseFloat(String(subtotal).replace(/[^0-9.-]/g, '')) : (parseFloat(String(cantidad_compra || 0)) * parseFloat(String(costo_unitario || 0)));

    const insertData: Record<string, unknown> = {
      id_compra: String(id_compra).trim(),
      id_producto: id_producto ? String(id_producto).trim() : null,
      movimiento: movimiento ? String(movimiento).trim() : null,
      producto_nombre: producto_nombre ? String(producto_nombre).trim() : null,
      fecha_compra: fecha_compra ? String(fecha_compra).slice(0, 10) : null,
      id_proveedor: id_proveedor ? String(id_proveedor).trim() : null,
      tipo_compra: tipo_compra ? String(tipo_compra).trim() : null,
      cantidad_compra: cantidad_compra != null ? parseFloat(String(cantidad_compra)) : null,
      costo_unitario: costo_unitario != null ? parseFloat(String(costo_unitario)) : null,
      subtotal: sub ?? null,
      moneda: moneda ? String(moneda).trim() : null,
      fecha_vencimiento: fecha_vencimiento ? String(fecha_vencimiento).slice(0, 10) : null,
      estado_pago: estado_pago ? String(estado_pago).trim() : 'Pendiente',
      observaciones: observaciones ? String(observaciones).trim() : null,
      tipo_cambio_usd: tipoCambioUsd,
    };
    if (empresaId) insertData.empresa_id = empresaId;

    const { data: row, error } = await supabase
      .from('compras')
      .insert(insertData)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Auto-create inventory entry in default bodega if producto + cantidad present
    const cantidadCompra = row.cantidad_compra ? Number(row.cantidad_compra) : 0;
    if (row.id_producto && cantidadCompra > 0) {
      let bodegaQuery = supabase.from('bodegas').select('id').eq('activo', true);
      if (empresaId) bodegaQuery = bodegaQuery.eq('empresa_id', empresaId);
      const { data: bodegas } = await bodegaQuery.order('nombre', { ascending: true }).limit(1);
      if (bodegas && bodegas.length > 0) {
        const bodegaId = bodegas[0].id;
        const vu = row.costo_unitario ? Number(row.costo_unitario) : 0;
        const { data: existente } = await supabase
          .from('inventario_bodega')
          .select('id, cantidad, valor_unitario_promedio')
          .eq('bodega_id', bodegaId)
          .eq('id_producto', String(row.id_producto))
          .single();
        if (existente) {
          const nuevaCantidad = Number(existente.cantidad) + cantidadCompra;
          const updFields: Record<string, unknown> = { cantidad: nuevaCantidad, updated_at: new Date().toISOString() };
          if (vu > 0) {
            const vap = (Number(existente.cantidad) * Number(existente.valor_unitario_promedio) + cantidadCompra * vu) / nuevaCantidad;
            updFields.valor_unitario_promedio = Math.round(vap * 100) / 100;
          }
          await supabase.from('inventario_bodega').update(updFields).eq('id', existente.id);
        } else {
          await supabase.from('inventario_bodega').insert({
            bodega_id: bodegaId, id_producto: String(row.id_producto),
            cantidad: cantidadCompra, valor_unitario_promedio: vu,
            ...(empresaId ? { empresa_id: empresaId } : {}),
          });
        }
        await supabase.from('movimientos_inventario').insert({
          bodega_id: bodegaId, id_producto: String(row.id_producto),
          tipo: 'entrada', cantidad: cantidadCompra, unidad: 'kg',
          referencia_tipo: 'compra', referencia_id: String(row.id_compra),
          observaciones: `Entrada automática por compra ${row.id_compra}`,
          usuario_id: user.id, ...(empresaId ? { empresa_id: empresaId } : {}),
        });
      }
    }

    return NextResponse.json({ ok: true, compra: { ...row, pagado_mxn: 0, pendiente_mxn: sub ?? 0 } });
  } catch (err) {
    console.error('API compras POST:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error al registrar compra' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const id_compra = searchParams.get('id_compra');
    if (!id && !id_compra) return NextResponse.json({ error: 'Falta id (uuid) o id_compra' }, { status: 400 });

    const body = await req.json();
    const updates: Record<string, unknown> = {};
    const str = (v: unknown) => (v != null ? String(v).trim() : null);
    const num = (v: unknown) => (v != null ? parseFloat(String(v).replace(/[^0-9.-]/g, '')) : null);
    if (body.id_compra !== undefined) updates.id_compra = str(body.id_compra);
    if (body.id_producto !== undefined) updates.id_producto = str(body.id_producto);
    if (body.producto_nombre !== undefined) updates.producto_nombre = str(body.producto_nombre);
    if (body.movimiento !== undefined) updates.movimiento = str(body.movimiento);
    if (body.fecha_compra !== undefined) updates.fecha_compra = body.fecha_compra ? String(body.fecha_compra).slice(0, 10) : null;
    if (body.id_proveedor !== undefined) updates.id_proveedor = str(body.id_proveedor);
    if (body.tipo_compra !== undefined) updates.tipo_compra = str(body.tipo_compra);
    if (body.cantidad_compra !== undefined) updates.cantidad_compra = num(body.cantidad_compra);
    if (body.costo_unitario !== undefined) updates.costo_unitario = num(body.costo_unitario);
    if (body.subtotal !== undefined) updates.subtotal = num(body.subtotal);
    if (body.moneda !== undefined) updates.moneda = str(body.moneda);
    if (body.fecha_vencimiento !== undefined) updates.fecha_vencimiento = body.fecha_vencimiento ? String(body.fecha_vencimiento).slice(0, 10) : null;
    if (body.estado_pago !== undefined) updates.estado_pago = str(body.estado_pago) || 'Pendiente';
    if (body.observaciones !== undefined) updates.observaciones = str(body.observaciones);
    updates.updated_at = new Date().toISOString();
    const { data: cfg } = await supabase.from('app_config').select('value').eq('key', 'usd_to_mxn').single();
    const rate = cfg?.value ? parseFloat(String(cfg.value)) : 18;
    updates.tipo_cambio_usd = Number.isFinite(rate) && rate > 0 ? rate : 18;

    let query = supabase.from('compras').update(updates);
    if (id) query = query.eq('id', id);
    else query = query.eq('id_compra', id_compra!);
    const { data: row, error } = await query.select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, compra: row });
  } catch (err) {
    console.error('API compras PATCH:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error al actualizar' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const id_compra = searchParams.get('id_compra');
    if (!id && !id_compra) return NextResponse.json({ error: 'Falta id o id_compra' }, { status: 400 });

    let query = supabase.from('compras').delete();
    if (id) query = query.eq('id', id);
    else query = query.eq('id_compra', id_compra!);
    const { error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('API compras DELETE:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error al eliminar' }, { status: 500 });
  }
}
