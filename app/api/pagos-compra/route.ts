import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEmpresaIdFromRequest } from '@/lib/empresaApi';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const body = await req.json();
    const { id_compra, monto_pago, fecha_pago, metodo_pago, referencia } = body;

    if (!id_compra) return NextResponse.json({ error: 'Se requiere id_compra' }, { status: 400 });
    if (!monto_pago || isNaN(parseFloat(monto_pago))) return NextResponse.json({ error: 'Se requiere monto_pago válido' }, { status: 400 });

    const empresaId = getEmpresaIdFromRequest(req);

    const insertData: Record<string, unknown> = {
      id_compra: String(id_compra).trim(),
      monto_pago: parseFloat(String(monto_pago)),
      fecha_pago: fecha_pago ? String(fecha_pago).slice(0, 10) : new Date().toISOString().slice(0, 10),
      metodo_pago: metodo_pago ? String(metodo_pago).trim() : 'transferencia',
      referencia: referencia ? String(referencia).trim() : null,
    };
    if (empresaId) insertData.empresa_id = empresaId;

    const { data: row, error } = await supabase
      .from('pagos_compra')
      .insert(insertData)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, pago: row });
  } catch (err) {
    console.error('API pagos-compra POST:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error al registrar pago' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Falta id del pago' }, { status: 400 });

    const { error } = await supabase.from('pagos_compra').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('API pagos-compra DELETE:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error al eliminar pago' }, { status: 500 });
  }
}
