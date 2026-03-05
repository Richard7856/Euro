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
    let query = supabase.from('bodegas').select('*').eq('activo', true);
    if (empresaId) {
      if (empresaSlug === 'euromex') {
        query = query.or(`empresa_id.eq.${empresaId},empresa_id.is.null`);
      } else {
        query = query.eq('empresa_id', empresaId);
      }
    }
    const { data, error } = await query.order('nombre', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ bodegas: data ?? [] });
  } catch (err) {
    console.error('API bodegas GET:', err);
    return NextResponse.json({ error: 'Error al obtener bodegas' }, { status: 500 });
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
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.nombre !== undefined) updates.nombre = String(body.nombre).trim();
    if (body.codigo !== undefined) updates.codigo = body.codigo ? String(body.codigo).trim() : null;
    if (body.direccion !== undefined) updates.direccion = body.direccion ? String(body.direccion).trim() : null;
    if (body.activo !== undefined) updates.activo = Boolean(body.activo);

    const { data: row, error } = await supabase.from('bodegas').update(updates).eq('id', id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, bodega: row });
  } catch (err) {
    console.error('API bodegas PATCH:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error al actualizar' }, { status: 500 });
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
    const { nombre, codigo, direccion, activo } = body;
    if (!nombre || typeof nombre !== 'string' || !nombre.trim()) {
      return NextResponse.json({ error: 'Nombre es requerido' }, { status: 400 });
    }

    const empresaId = getEmpresaIdFromRequest(req);
    const insertData: Record<string, unknown> = {
      nombre: String(nombre).trim(),
      codigo: codigo != null && String(codigo).trim() !== '' ? String(codigo).trim() : null,
      direccion: direccion != null && String(direccion).trim() !== '' ? String(direccion).trim() : null,
      activo: activo !== false,
    };
    if (empresaId) insertData.empresa_id = empresaId;

    const { data: row, error } = await supabase
      .from('bodegas')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, bodega: row });
  } catch (err) {
    console.error('API bodegas POST:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error al crear bodega' }, { status: 500 });
  }
}
