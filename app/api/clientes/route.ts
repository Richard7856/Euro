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
    let query = supabase.from('clientes').select('*');
    if (empresaId) {
      if (empresaSlug === 'euromex') {
        // Euromex: incluir también filas con empresa_id NULL (datos legacy)
        query = query.or(`empresa_id.eq.${empresaId},empresa_id.is.null`);
      } else {
        query = query.eq('empresa_id', empresaId);
      }
    }
    const { data, error } = await query.order('nombre_cliente', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ clientes: data ?? [] });
  } catch (err) {
    console.error('API clientes GET:', err);
    return NextResponse.json({ error: 'Error al obtener clientes' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const empresaId = getEmpresaIdFromRequest(req);
    const body = await req.json();
    const {
      id_cliente,
      nombre_cliente,
      rfc_taxid,
      contacto,
      telefono,
      email,
      direccion,
      ciudad,
      estado,
      pais,
      canal_principal,
    } = body;

    if (!id_cliente || !nombre_cliente) {
      return NextResponse.json(
        { error: 'Se requieren id_cliente y nombre_cliente' },
        { status: 400 }
      );
    }

    const rowData: Record<string, unknown> = {
      id_cliente: String(id_cliente).trim(),
      nombre_cliente: String(nombre_cliente).trim(),
      rfc_taxid: rfc_taxid ? String(rfc_taxid).trim() : null,
      contacto: contacto ? String(contacto).trim() : null,
      telefono: telefono ? String(telefono).trim() : null,
      email: email ? String(email).trim() : null,
      direccion: direccion ? String(direccion).trim() : null,
      ciudad: ciudad ? String(ciudad).trim() : null,
      estado: estado ? String(estado).trim() : null,
      pais: pais ? String(pais).trim() : null,
      canal_principal: canal_principal ? String(canal_principal).trim() : null,
      updated_at: new Date().toISOString(),
    };
    if (empresaId) rowData.empresa_id = empresaId;

    const { data: row, error } = await supabase
      .from('clientes')
      .upsert(rowData, { onConflict: 'id_cliente' })
      .select()
      .single();

    if (error) {
      console.error('Error insertando cliente:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, cliente: row });
  } catch (err) {
    console.error('API clientes POST:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error al registrar cliente' },
      { status: 500 }
    );
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

    const { error } = await supabase.from('clientes').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('API clientes DELETE:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error al eliminar' }, { status: 500 });
  }
}
