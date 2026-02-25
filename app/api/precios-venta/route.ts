import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEmpresaIdFromRequest, getEmpresaSlugFromRequest } from '@/lib/empresaApi';

function toDateStr(v: string | null | undefined): string {
  if (!v) return '';
  return String(v).trim().slice(0, 10);
}

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const vigente_en = searchParams.get('vigente_en') || new Date().toISOString().slice(0, 10);
    const id_producto = searchParams.get('id_producto');

    const empresaId = getEmpresaIdFromRequest(req);
    const empresaSlug = getEmpresaSlugFromRequest(req);
    let query = supabase
      .from('precios_venta')
      .select('*')
      .lte('vigente_desde', vigente_en)
      .or(`vigente_hasta.is.null,vigente_hasta.gte.${vigente_en}`)
      .order('id_producto', { ascending: true });

    if (empresaId) {
      if (empresaSlug === 'euromex') {
        query = query.or(`empresa_id.eq.${empresaId},empresa_id.is.null`);
      } else {
        query = query.eq('empresa_id', empresaId);
      }
    }
    if (id_producto) query = query.eq('id_producto', id_producto);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const precios = (data ?? []).map((r: Record<string, unknown>) => ({
      ...r,
      precio_venta: Number(r.precio_venta ?? 0),
    }));
    return NextResponse.json({ precios });
  } catch (err) {
    console.error('API precios-venta GET:', err);
    return NextResponse.json({ error: 'Error al listar precios de venta' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const body = await req.json();
    const { id_producto, nombre_producto, precio_venta, moneda, unidad, vigente_desde, vigente_hasta, origen } = body;
    if (!id_producto || precio_venta == null) {
      return NextResponse.json({ error: 'Faltan id_producto o precio_venta' }, { status: 400 });
    }
    const precio = parseFloat(String(precio_venta).replace(/[^0-9.-]/g, '')) || 0;
    if (precio < 0) return NextResponse.json({ error: 'precio_venta debe ser >= 0' }, { status: 400 });

    const empresaId = getEmpresaIdFromRequest(req);
    const row: Record<string, unknown> = {
      id_producto: String(id_producto).trim(),
      nombre_producto: nombre_producto ? String(nombre_producto).trim() : null,
      precio_venta: precio,
      moneda: (moneda && String(moneda).trim()) || 'MXN',
      unidad: (unidad && String(unidad).trim()) || 'kg',
      vigente_desde: toDateStr(vigente_desde) || new Date().toISOString().slice(0, 10),
      vigente_hasta: toDateStr(vigente_hasta) || null,
      origen: (origen && String(origen).trim()) || 'manual',
    };
    if (empresaId) row.empresa_id = empresaId;

    const { data, error } = await supabase.from('precios_venta').insert(row).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, precio: data });
  } catch (err) {
    console.error('API precios-venta POST:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error al crear precio' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Falta id' }, { status: 400 });

    const body = await req.json();
    const updates: Record<string, unknown> = {};
    if (body.id_producto !== undefined) updates.id_producto = String(body.id_producto).trim();
    if (body.nombre_producto !== undefined) updates.nombre_producto = body.nombre_producto ? String(body.nombre_producto).trim() : null;
    if (body.precio_venta !== undefined) updates.precio_venta = parseFloat(String(body.precio_venta).replace(/[^0-9.-]/g, '')) || 0;
    if (body.moneda !== undefined) updates.moneda = String(body.moneda).trim() || 'MXN';
    if (body.unidad !== undefined) updates.unidad = body.unidad ? String(body.unidad).trim() : null;
    if (body.vigente_desde !== undefined) updates.vigente_desde = toDateStr(body.vigente_desde) || null;
    if (body.vigente_hasta !== undefined) updates.vigente_hasta = body.vigente_hasta ? toDateStr(body.vigente_hasta) : null;
    if (body.origen !== undefined) updates.origen = String(body.origen).trim() || 'manual';

    const { data, error } = await supabase.from('precios_venta').update(updates).eq('id', id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, precio: data });
  } catch (err) {
    console.error('API precios-venta PATCH:', err);
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

    const { error } = await supabase.from('precios_venta').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('API precios-venta DELETE:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error al eliminar' }, { status: 500 });
  }
}
