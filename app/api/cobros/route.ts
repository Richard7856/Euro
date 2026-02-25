import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEmpresaIdFromRequest, getEmpresaSlugFromRequest } from '@/lib/empresaApi';

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const empresaId = getEmpresaIdFromRequest(req);
    const empresaSlug = getEmpresaSlugFromRequest(req);
    let query = supabase.from('cobros').select('*');
    if (empresaId) {
      if (empresaSlug === 'euromex') {
        query = query.or(`empresa_id.eq.${empresaId},empresa_id.is.null`);
      } else {
        query = query.eq('empresa_id', empresaId);
      }
    }
    const { data, error } = await query.order('fecha_pago', { ascending: false }).limit(500);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ cobros: data ?? [] });
  } catch (err) {
    console.error('API cobros GET:', err);
    return NextResponse.json({ error: 'Error al obtener cobros' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const body = await req.json();
    const { id_venta, id_producto, canal_cobro, fecha_pago, metodo_pago, monto_pagado, evidencia, notas } = body;

    if (!id_venta || monto_pagado == null) {
      return NextResponse.json({ error: 'Se requieren id_venta y monto_pagado' }, { status: 400 });
    }

    const monto = parseFloat(String(monto_pagado).replace(/[^0-9.-]/g, '')) || 0;
    const fecha = fecha_pago ? String(fecha_pago).slice(0, 10) : new Date().toISOString().slice(0, 10);
    const empresaId = getEmpresaIdFromRequest(req);

    const insertData: Record<string, unknown> = {
      id_venta: String(id_venta).trim(),
      id_producto: id_producto ? String(id_producto).trim() : null,
      canal_cobro: canal_cobro ? String(canal_cobro).trim() : 'DANTE',
      fecha_pago: fecha,
      metodo_pago: metodo_pago === 'EFECTIVO' ? 'EFECTIVO' : 'TRANSFERENCIA',
      monto_pagado: monto,
      evidencia: evidencia ? String(evidencia).trim() : null,
      notas: notas ? String(notas).trim() : null,
    };
    if (empresaId) insertData.empresa_id = empresaId;

    const { data: row, error } = await supabase
      .from('cobros')
      .insert(insertData)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, cobro: row });
  } catch (err) {
    console.error('API cobros POST:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error al registrar cobro' }, { status: 500 });
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
    if (body.id_venta !== undefined) updates.id_venta = String(body.id_venta).trim();
    if (body.id_producto !== undefined) updates.id_producto = body.id_producto ? String(body.id_producto).trim() : null;
    if (body.canal_cobro !== undefined) updates.canal_cobro = String(body.canal_cobro).trim() || 'DANTE';
    if (body.fecha_pago !== undefined) updates.fecha_pago = String(body.fecha_pago).slice(0, 10);
    if (body.metodo_pago !== undefined) updates.metodo_pago = body.metodo_pago === 'EFECTIVO' ? 'EFECTIVO' : 'TRANSFERENCIA';
    if (body.monto_pagado !== undefined) updates.monto_pagado = parseFloat(String(body.monto_pagado).replace(/[^0-9.-]/g, '')) || 0;
    if (body.evidencia !== undefined) updates.evidencia = body.evidencia ? String(body.evidencia).trim() : null;
    if (body.notas !== undefined) updates.notas = body.notas ? String(body.notas).trim() : null;

    const { data: row, error } = await supabase.from('cobros').update(updates).eq('id', id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, cobro: row });
  } catch (err) {
    console.error('API cobros PATCH:', err);
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

    const { error } = await supabase.from('cobros').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('API cobros DELETE:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error al eliminar' }, { status: 500 });
  }
}
