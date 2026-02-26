/**
 * Autenticación para API del bot de cotizaciones.
 * Header: X-API-Key o Authorization: Bearer <key>
 * Origen: variable de entorno COTIZACIONES_BOT_API_KEY o app_config (cotizaciones_bot_api_key) desde el dashboard.
 */
export function getBotApiKeyFromRequest(req: Request): string | null {
  const header = req.headers.get('x-api-key') ?? req.headers.get('X-API-Key');
  if (header?.trim()) return header.trim();
  const auth = req.headers.get('authorization');
  if (auth?.startsWith('Bearer ')) return auth.slice(7).trim();
  return null;
}

/** Devuelve la key válida: primero env, luego app_config (para key generada desde Perfiles). */
export async function getValidBotApiKey(): Promise<string | null> {
  const envKey = process.env.COTIZACIONES_BOT_API_KEY?.trim();
  if (envKey && envKey.length >= 8) return envKey;
  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: row } = await supabase.from('app_config').select('value').eq('key', 'cotizaciones_bot_api_key').single();
    const dbKey = row?.value?.trim();
    if (dbKey && dbKey.length >= 8) return dbKey;
  } catch {
    // ignore
  }
  return null;
}

export async function isBotApiKeyValidAsync(req: Request): Promise<boolean> {
  const requestKey = getBotApiKeyFromRequest(req);
  const validKey = await getValidBotApiKey();
  if (!validKey || !requestKey) return false;
  return requestKey === validKey;
}
