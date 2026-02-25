import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEmpresaIdFromRequest, getEmpresaSlugFromRequest } from '@/lib/empresaApi';

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const empresaId = getEmpresaIdFromRequest(req);
    const empresaSlug = getEmpresaSlugFromRequest(req);
    let query = supabase.from('gastos').select('*');
    if (empresaId) {
      if (empresaSlug === 'euromex') {
        query = query.or(`empresa_id.eq.${empresaId},empresa_id.is.null`);
      } else {
        query = query.eq('empresa_id', empresaId);
      }
    }
    const { data, error } = await query
      .order('fecha', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ gastos: data ?? [] });
  } catch (err) {
    console.error('API gastos GET:', err);
    return NextResponse.json({ error: 'Error al obtener gastos' }, { status: 500 });
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
    const { categoria, monto, descripcion, fecha } = body;

    if (!categoria || monto == null) {
      return NextResponse.json(
        { error: 'Se requieren categoria y monto' },
        { status: 400 }
      );
    }

    const montoNum = parseFloat(String(monto).replace(/[^0-9.-]/g, '')) || 0;
    const empresaId = getEmpresaIdFromRequest(req);
    const { data: cfg } = await supabase.from('app_config').select('value').eq('key', 'usd_to_mxn').single();
    const rate = cfg?.value ? parseFloat(String(cfg.value)) : 18;
    const tipoCambioUsd = Number.isFinite(rate) && rate > 0 ? rate : 18;

    const insertData: Record<string, unknown> = {
      categoria: String(categoria).trim(),
      monto: montoNum,
      descripcion: descripcion ? String(descripcion).trim() : null,
      fecha: fecha || new Date().toISOString().slice(0, 10),
      usuario_id: user.id,
      tipo_cambio_usd: tipoCambioUsd,
    };
    if (empresaId) insertData.empresa_id = empresaId;

    const { data: row, error } = await supabase
      .from('gastos')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error insertando gasto:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, gasto: row });
  } catch (err) {
    console.error('API gastos POST:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error al registrar gasto' },
      { status: 500 }
    );
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
    const { categoria, monto, descripcion, fecha } = body;
    const updates: Record<string, unknown> = {};
    if (categoria !== undefined) updates.categoria = String(categoria).trim();
    if (monto !== undefined) updates.monto = parseFloat(String(monto).replace(/[^0-9.-]/g, '')) || 0;
    if (descripcion !== undefined) updates.descripcion = descripcion ? String(descripcion).trim() : null;
    if (fecha !== undefined) updates.fecha = String(fecha).slice(0, 10) || null;
    const { data: cfg } = await supabase.from('app_config').select('value').eq('key', 'usd_to_mxn').single();
    const rate = cfg?.value ? parseFloat(String(cfg.value)) : 18;
    updates.tipo_cambio_usd = Number.isFinite(rate) && rate > 0 ? rate : 18;

    const { data: row, error } = await supabase
      .from('gastos')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, gasto: row });
  } catch (err) {
    console.error('API gastos PATCH:', err);
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

    const { error } = await supabase.from('gastos').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('API gastos DELETE:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error al eliminar' }, { status: 500 });
  }
}
