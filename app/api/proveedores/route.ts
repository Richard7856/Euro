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
    let query = supabase.from('proveedores').select('*');
    if (empresaId) {
      if (empresaSlug === 'euromex') {
        // Euromex: incluir también filas con empresa_id NULL (datos legacy)
        query = query.or(`empresa_id.eq.${empresaId},empresa_id.is.null`);
      } else {
        query = query.eq('empresa_id', empresaId);
      }
    }
    const { data, error } = await query.order('nombre_proveedor', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ proveedores: data ?? [] });
  } catch (err) {
    console.error('API proveedores GET:', err);
    return NextResponse.json({ error: 'Error al obtener proveedores' }, { status: 500 });
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
    const {
      id_proveedor,
      nombre_proveedor,
      contacto,
      telefono,
      email,
      condiciones_pago,
      tipo_producto,
      canal,
    } = body;

    if (!id_proveedor || !nombre_proveedor) {
      return NextResponse.json(
        { error: 'Se requieren id_proveedor y nombre_proveedor' },
        { status: 400 }
      );
    }

    const empresaId = getEmpresaIdFromRequest(req);
    const rowData: Record<string, unknown> = {
      id_proveedor: String(id_proveedor).trim(),
      nombre_proveedor: String(nombre_proveedor).trim(),
      contacto: contacto ? String(contacto).trim() : null,
      telefono: telefono ? String(telefono).trim() : null,
      email: email ? String(email).trim() : null,
      condiciones_pago: condiciones_pago ? String(condiciones_pago).trim() : null,
      tipo_producto: tipo_producto ? String(tipo_producto).trim() : null,
      canal: canal ? String(canal).trim() : null,
      updated_at: new Date().toISOString(),
    };
    if (empresaId) rowData.empresa_id = empresaId;

    const { data: row, error } = await supabase
      .from('proveedores')
      .upsert(rowData, { onConflict: 'id_proveedor' })
      .select()
      .single();

    if (error) {
      console.error('Error insertando proveedor:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, proveedor: row });
  } catch (err) {
    console.error('API proveedores POST:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error al registrar proveedor' },
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

    const { error } = await supabase.from('proveedores').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('API proveedores DELETE:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error al eliminar' }, { status: 500 });
  }
}
