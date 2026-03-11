import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { trackShipment } from '@/lib/carriers';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const { id } = await params;

    const { data: envio, error: errFetch } = await supabase
      .from('envios')
      .select('id_envio, guia_rastreo, carrier')
      .eq('id_envio', id)
      .single();

    if (errFetch || !envio) {
      return NextResponse.json({ error: 'Envío no encontrado' }, { status: 404 });
    }
    if (!envio.guia_rastreo) {
      return NextResponse.json({ error: 'El envío no tiene número de guía' }, { status: 400 });
    }

    const body = await req.json().catch(() => ({})) as { carrier?: string };
    const carrier = body.carrier ?? envio.carrier ?? undefined;

    const result = await trackShipment(envio.guia_rastreo, carrier);

    // Persist tracking data back to envios
    await supabase.from('envios').update({
      carrier: result.carrier,
      lat_actual: result.lat ?? null,
      lng_actual: result.lng ?? null,
      temperatura_actual: result.temperatura ?? null,
      ultima_actualizacion: result.ultimaActualizacion,
      tracking_eventos: result.eventos,
      estado_envio: result.status !== 'Sin datos de rastreo' ? result.status : undefined,
    }).eq('id_envio', id);

    return NextResponse.json({ ok: true, tracking: result });
  } catch (err) {
    console.error('API envios/[id]/track POST:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error al rastrear' },
      { status: 500 }
    );
  }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const { id } = await params;

    const { data: envio, error } = await supabase
      .from('envios')
      .select('id_envio, carrier, lat_actual, lng_actual, temperatura_actual, ultima_actualizacion, tracking_eventos, estado_envio')
      .eq('id_envio', id)
      .single();

    if (error || !envio) return NextResponse.json({ error: 'Envío no encontrado' }, { status: 404 });

    return NextResponse.json({ ok: true, tracking: envio });
  } catch (err) {
    console.error('API envios/[id]/track GET:', err);
    return NextResponse.json({ error: 'Error al obtener tracking' }, { status: 500 });
  }
}
