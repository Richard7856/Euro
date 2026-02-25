import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const KEY_USD_TO_MXN = 'usd_to_mxn';
const DEFAULT_USD_TO_MXN = 18;

/** GET: devuelve la configuración (tipo de cambio). Usuarios autenticados. */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const { data: row } = await supabase
      .from('app_config')
      .select('value')
      .eq('key', KEY_USD_TO_MXN)
      .single();

    const raw = row?.value;
    const usd_to_mxn = raw != null ? parseFloat(String(raw)) : DEFAULT_USD_TO_MXN;
    const rate = Number.isFinite(usd_to_mxn) && usd_to_mxn > 0 ? usd_to_mxn : DEFAULT_USD_TO_MXN;

    return NextResponse.json({ usd_to_mxn: rate });
  } catch (err) {
    console.error('API config GET:', err);
    return NextResponse.json({ usd_to_mxn: DEFAULT_USD_TO_MXN });
  }
}

/** PATCH: actualiza tipo de cambio USD/MXN. Solo admin. */
export async function PATCH(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const { data: profile } = await supabase.from('profiles').select('rol').eq('id', user.id).single();
    if (profile?.rol !== 'admin') {
      return NextResponse.json({ error: 'Solo administradores pueden cambiar el tipo de cambio' }, { status: 403 });
    }

    const body = await req.json();
    const usd_to_mxn = body?.usd_to_mxn != null ? parseFloat(String(body.usd_to_mxn)) : NaN;
    if (!Number.isFinite(usd_to_mxn) || usd_to_mxn <= 0) {
      return NextResponse.json({ error: 'usd_to_mxn debe ser un número positivo' }, { status: 400 });
    }

    const { error } = await supabase
      .from('app_config')
      .upsert({ key: KEY_USD_TO_MXN, value: String(usd_to_mxn), updated_at: new Date().toISOString() }, { onConflict: 'key' });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ usd_to_mxn });
  } catch (err) {
    console.error('API config PATCH:', err);
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 });
  }
}
