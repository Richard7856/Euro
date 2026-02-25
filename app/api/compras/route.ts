import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEmpresaIdFromRequest } from '@/lib/empresaApi';

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const empresaId = getEmpresaIdFromRequest(req);
    let comprasQuery = supabase.from('compras').select('*');
    if (empresaId) comprasQuery = comprasQuery.eq('empresa_id', empresaId);
    const { data: compras, error } = await comprasQuery.order('fecha_compra', { ascending: false }).limit(500);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    let pagosQuery = supabase.from('pagos_compra').select('id_compra, monto_pago');
    if (empresaId) pagosQuery = pagosQuery.eq('empresa_id', empresaId);
    const { data: pagos } = await pagosQuery;
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
    };
    if (empresaId) insertData.empresa_id = empresaId;

    const { data: row, error } = await supabase
      .from('compras')
      .insert(insertData)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
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
    if (!id) return NextResponse.json({ error: 'Falta id (uuid)' }, { status: 400 });

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

    const { data: row, error } = await supabase.from('compras').update(updates).eq('id', id).select().single();
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
    if (!id) return NextResponse.json({ error: 'Falta id' }, { status: 400 });

    const { error } = await supabase.from('compras').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('API compras DELETE:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error al eliminar' }, { status: 500 });
  }
}
