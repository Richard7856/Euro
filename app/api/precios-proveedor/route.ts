import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEmpresaIdFromRequest, getEmpresaSlugFromRequest } from '@/lib/empresaApi';

const FUENTES = ['manual', 'importacion', 'api', 'email', 'whatsapp'] as const;

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
    const id_proveedor = searchParams.get('id_proveedor');
    const id_producto = searchParams.get('id_producto');
    const fecha_desde = searchParams.get('fecha_desde');
    const fecha_hasta = searchParams.get('fecha_hasta');
    const ultimos = searchParams.get('ultimos') === 'true';
    const limit = Math.min(Number(searchParams.get('limit')) || 200, 500);

    const empresaId = getEmpresaIdFromRequest(req);
    const empresaSlug = getEmpresaSlugFromRequest(req);
    let query = supabase
      .from('precios_proveedor')
      .select('*')
      .order('fecha', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(ultimos ? 500 : limit);

    if (empresaId) {
      if (empresaSlug === 'euromex') {
        query = query.or(`empresa_id.eq.${empresaId},empresa_id.is.null`);
      } else {
        query = query.eq('empresa_id', empresaId);
      }
    }
    if (id_proveedor) query = query.eq('id_proveedor', id_proveedor);
    if (id_producto) query = query.eq('id_producto', id_producto);
    if (fecha_desde) query = query.gte('fecha', fecha_desde);
    if (fecha_hasta) query = query.lte('fecha', fecha_hasta);

    const { data: rows, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    let precios = (rows ?? []) as Record<string, unknown>[];
    if (ultimos && precios.length > 0) {
      const key = (r: Record<string, unknown>) => `${r.id_proveedor ?? ''}|${r.id_producto ?? ''}|${r.concepto ?? ''}`;
      const seen = new Set<string>();
      precios = precios.filter((r) => {
        const k = key(r);
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
    }

    return NextResponse.json({ precios });
  } catch (err) {
    console.error('API precios-proveedor GET:', err);
    return NextResponse.json({ error: 'Error al listar precios' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await req.json();
    const empresaId = getEmpresaIdFromRequest(req);
    const items = Array.isArray(body) ? body : [body];

    const inserted: Record<string, unknown>[] = [];
    for (const item of items) {
      const id_proveedor = item.id_proveedor != null ? String(item.id_proveedor).trim() : '';
      const precio = parseFloat(String(item.precio).replace(/[^0-9.-]/g, ''));
      if (!id_proveedor || isNaN(precio) || precio < 0) {
        continue;
      }
      const row: Record<string, unknown> = {
        id_proveedor,
        nombre_proveedor: item.nombre_proveedor != null ? String(item.nombre_proveedor).trim() : null,
        id_producto: item.id_producto != null && String(item.id_producto).trim() ? String(item.id_producto).trim() : null,
        concepto: item.concepto != null && String(item.concepto).trim() ? String(item.concepto).trim() : null,
        precio,
        moneda: (item.moneda && String(item.moneda).trim()) || 'MXN',
        unidad: (item.unidad && String(item.unidad).trim()) || 'kg',
        fecha: toDateStr(item.fecha) || new Date().toISOString().slice(0, 10),
        vigente_desde: toDateStr(item.vigente_desde) || null,
        vigente_hasta: toDateStr(item.vigente_hasta) || null,
        fuente: FUENTES.includes(item.fuente) ? item.fuente : 'manual',
        referencia: item.referencia != null ? String(item.referencia).trim() : null,
        observaciones: item.observaciones != null ? String(item.observaciones).trim() : null,
      };
      if (empresaId) row.empresa_id = empresaId;

      const { data: one, error } = await supabase
        .from('precios_proveedor')
        .insert(row)
        .select()
        .single();
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      inserted.push(one as Record<string, unknown>);
    }

    return NextResponse.json({ ok: true, precios: inserted, count: inserted.length });
  } catch (err) {
    console.error('API precios-proveedor POST:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error al guardar precios' }, { status: 500 });
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
    if (body.id_proveedor !== undefined) updates.id_proveedor = String(body.id_proveedor).trim();
    if (body.nombre_proveedor !== undefined) updates.nombre_proveedor = body.nombre_proveedor ? String(body.nombre_proveedor).trim() : null;
    if (body.id_producto !== undefined) updates.id_producto = body.id_producto ? String(body.id_producto).trim() : null;
    if (body.concepto !== undefined) updates.concepto = body.concepto ? String(body.concepto).trim() : null;
    if (body.precio !== undefined) updates.precio = parseFloat(String(body.precio).replace(/[^0-9.-]/g, '')) || 0;
    if (body.moneda !== undefined) updates.moneda = String(body.moneda).trim() || 'MXN';
    if (body.unidad !== undefined) updates.unidad = body.unidad ? String(body.unidad).trim() : null;
    if (body.fecha !== undefined) updates.fecha = toDateStr(body.fecha) || null;
    if (body.fuente !== undefined) updates.fuente = FUENTES.includes(body.fuente) ? body.fuente : undefined;
    if (body.referencia !== undefined) updates.referencia = body.referencia ? String(body.referencia).trim() : null;
    if (body.observaciones !== undefined) updates.observaciones = body.observaciones ? String(body.observaciones).trim() : null;

    const { data, error } = await supabase
      .from('precios_proveedor')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, precio: data });
  } catch (err) {
    console.error('API precios-proveedor PATCH:', err);
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

    const { error } = await supabase.from('precios_proveedor').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('API precios-proveedor DELETE:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error al eliminar' }, { status: 500 });
  }
}
