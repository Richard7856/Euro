import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEmpresaIdFromRequest } from '@/lib/empresaApi';

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const empresaId = getEmpresaIdFromRequest(req);
    let query = supabase.from('envios').select('*');
    if (empresaId) query = query.eq('empresa_id', empresaId);
    const { data, error } = await query.order('fecha_envio', { ascending: false }).limit(500);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ envios: data ?? [] });
  } catch (err) {
    console.error('API envios GET:', err);
    return NextResponse.json({ error: 'Error al obtener envíos' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const body = await req.json();
    const { id_envio, producto, id_cliente, id_compra, tipo_envio, fecha_envio, proveedor_logistico, guia_rastreo, costo_envio, origen, destino, estado_envio, fecha_entrega } = body;

    if (!id_envio) return NextResponse.json({ error: 'Se requiere id_envio' }, { status: 400 });

    const empresaId = getEmpresaIdFromRequest(req);
    const str = (v: unknown) => (v != null && String(v).trim() !== '' ? String(v).trim() : null);

    const insertData: Record<string, unknown> = {
      id_envio: str(id_envio),
      producto: str(producto),
      id_cliente: str(id_cliente),
      id_compra: str(id_compra),
      tipo_envio: str(tipo_envio) ?? 'Compra',
      fecha_envio: fecha_envio ? String(fecha_envio).slice(0, 10) : null,
      proveedor_logistico: str(proveedor_logistico),
      guia_rastreo: str(guia_rastreo),
      costo_envio: costo_envio != null ? parseFloat(String(costo_envio)) : null,
      origen: str(origen),
      destino: str(destino),
      estado_envio: str(estado_envio) ?? 'Pendiente',
      fecha_entrega: fecha_entrega ? String(fecha_entrega).slice(0, 10) : null,
    };
    if (empresaId) insertData.empresa_id = empresaId;

    const { data: row, error } = await supabase.from('envios').insert(insertData).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, envio: row });
  } catch (err) {
    console.error('API envios POST:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error al registrar envío' }, { status: 500 });
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
    const str = (v: unknown) => (v != null && String(v).trim() !== '' ? String(v).trim() : null);
    const updates: Record<string, unknown> = {};
    const strFields = ['producto', 'id_cliente', 'id_compra', 'tipo_envio', 'proveedor_logistico', 'guia_rastreo', 'origen', 'destino', 'estado_envio'];
    for (const f of strFields) { if (body[f] !== undefined) updates[f] = str(body[f]); }
    if (body.fecha_envio !== undefined) updates.fecha_envio = body.fecha_envio ? String(body.fecha_envio).slice(0, 10) : null;
    if (body.fecha_entrega !== undefined) updates.fecha_entrega = body.fecha_entrega ? String(body.fecha_entrega).slice(0, 10) : null;
    if (body.costo_envio !== undefined) updates.costo_envio = body.costo_envio != null ? parseFloat(String(body.costo_envio)) : null;

    const { data: row, error } = await supabase.from('envios').update(updates).eq('id_envio', id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, envio: row });
  } catch (err) {
    console.error('API envios PATCH:', err);
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

    const { error } = await supabase.from('envios').delete().eq('id_envio', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('API envios DELETE:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error al eliminar' }, { status: 500 });
  }
}
