import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { randomBytes } from 'crypto';

const APP_CONFIG_KEY = 'cotizaciones_bot_api_key';

function maskKey(key: string): string {
  if (key.length <= 8) return '••••••••';
  return key.slice(0, 4) + '••••••••' + key.slice(-4);
}

/** GET: ¿está configurada la API key? Solo admin. No devuelve la key, solo masked o configured. */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const { data: profile } = await supabase.from('profiles').select('rol').eq('id', user.id).single();
    if (profile?.rol !== 'admin') return NextResponse.json({ error: 'Solo administradores' }, { status: 403 });

    const envKey = process.env.COTIZACIONES_BOT_API_KEY;
    if (envKey && envKey.length >= 8) {
      return NextResponse.json({ configured: true, source: 'env', masked: maskKey(envKey) });
    }

    const { data: row } = await supabase.from('app_config').select('value').eq('key', APP_CONFIG_KEY).single();
    const dbKey = row?.value?.trim();
    if (dbKey && dbKey.length >= 8) {
      return NextResponse.json({ configured: true, source: 'db', masked: maskKey(dbKey) });
    }

    return NextResponse.json({ configured: false });
  } catch (err) {
    console.error('API config/bot-api-key GET:', err);
    return NextResponse.json({ error: 'Error al consultar' }, { status: 500 });
  }
}

/** POST: generar nueva API key y guardarla en app_config. Solo admin. Devuelve la key una sola vez. */
export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const { data: profile } = await supabase.from('profiles').select('rol').eq('id', user.id).single();
    if (profile?.rol !== 'admin') return NextResponse.json({ error: 'Solo administradores pueden generar la API key' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    if (body?.action !== 'generate') {
      return NextResponse.json({ error: 'Envía { "action": "generate" }' }, { status: 400 });
    }

    const apiKey = 'cot_' + randomBytes(32).toString('hex');

    const { error } = await supabase
      .from('app_config')
      .upsert(
        { key: APP_CONFIG_KEY, value: apiKey, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      );

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ api_key: apiKey, message: 'Guarda esta key; no se volverá a mostrar.' });
  } catch (err) {
    console.error('API config/bot-api-key POST:', err);
    return NextResponse.json({ error: 'Error al generar' }, { status: 500 });
  }
}
