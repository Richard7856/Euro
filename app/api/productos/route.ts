import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const { data, error } = await supabase
      .from('productos')
      .select('id_producto, nombre_producto, cantidad_disponible, valor_unitario_promedio, valor_total')
      .order('id_producto', { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ productos: data ?? [] });
  } catch (err) {
    console.error('API productos GET:', err);
    return NextResponse.json({ error: 'Error al listar productos' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const body = await req.json();
    const id_producto = body.id_producto != null ? String(body.id_producto).trim() : '';
    const nombre_producto = body.nombre_producto != null ? String(body.nombre_producto).trim() : null;
    if (!id_producto) return NextResponse.json({ error: 'Falta id_producto (SKU)' }, { status: 400 });

    const num = (v: unknown) => (v != null && v !== '' ? parseFloat(String(v).replace(/[^0-9.-]/g, '')) : null);
    const row: Record<string, unknown> = {
      id_producto,
      nombre_producto: nombre_producto || id_producto,
      cantidad_disponible: num(body.cantidad_disponible) ?? 0,
      valor_unitario_promedio: num(body.valor_unitario_promedio) ?? null,
      valor_total: num(body.valor_total) ?? null,
    };

    const { data: inserted, error } = await supabase
      .from('productos')
      .insert(row)
      .select('id_producto, nombre_producto, cantidad_disponible, valor_unitario_promedio, valor_total')
      .single();

    if (error) {
      if (error.code === '23505') return NextResponse.json({ error: 'Ya existe un producto con ese SKU (id_producto)' }, { status: 409 });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, producto: inserted });
  } catch (err) {
    console.error('API productos POST:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error al crear producto' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id_producto = searchParams.get('id_producto')?.trim() || searchParams.get('sku')?.trim();
    if (!id_producto) return NextResponse.json({ error: 'Falta id_producto (SKU)' }, { status: 400 });

    const body = await req.json();
    const updates: Record<string, unknown> = {};
    if (body.nombre_producto !== undefined) updates.nombre_producto = String(body.nombre_producto).trim() || null;
    const num = (v: unknown) => (v != null && v !== '' ? parseFloat(String(v).replace(/[^0-9.-]/g, '')) : null);
    if (body.cantidad_disponible !== undefined) updates.cantidad_disponible = num(body.cantidad_disponible) ?? 0;
    if (body.valor_unitario_promedio !== undefined) updates.valor_unitario_promedio = num(body.valor_unitario_promedio);
    if (body.valor_total !== undefined) updates.valor_total = num(body.valor_total);

    if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 });

    const { data, error } = await supabase
      .from('productos')
      .update(updates)
      .eq('id_producto', id_producto)
      .select('id_producto, nombre_producto, cantidad_disponible, valor_unitario_promedio, valor_total')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, producto: data });
  } catch (err) {
    console.error('API productos PATCH:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error al actualizar producto' }, { status: 500 });
  }
}
