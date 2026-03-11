/**
 * Estafeta carrier adapter.
 * Uses Estafeta's tracking API (requires ESTAFETA_API_USER + ESTAFETA_API_PASS env vars).
 * Docs: https://developer.estafeta.com/api-rastreo
 */
import type { TrackingResult } from './types';

export async function trackEstafeta(guia: string): Promise<TrackingResult> {
  const user = process.env.ESTAFETA_API_USER;
  const pass = process.env.ESTAFETA_API_PASS;

  if (!user || !pass) {
    throw new Error('Estafeta API credentials not configured (ESTAFETA_API_USER / ESTAFETA_API_PASS)');
  }

  // Estafeta OAuth token endpoint
  const tokenRes = await fetch('https://tracking.estafeta.com/tracking/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'password', username: user, password: pass }),
  });
  if (!tokenRes.ok) throw new Error(`Estafeta auth failed: ${tokenRes.status}`);
  const { access_token } = await tokenRes.json() as { access_token: string };

  // Tracking query
  const trackRes = await fetch(
    `https://tracking.estafeta.com/tracking/api/tracking?waybill=${encodeURIComponent(guia)}`,
    { headers: { Authorization: `Bearer ${access_token}` } }
  );
  if (!trackRes.ok) throw new Error(`Estafeta tracking failed: ${trackRes.status}`);
  const data = await trackRes.json() as Record<string, unknown>;

  // Map Estafeta response to TrackingResult
  const events = (data.events as Record<string, unknown>[] | undefined) ?? [];
  const last = events[0] as Record<string, unknown> | undefined;
  const status = (last?.status as string) ?? (data.statusDescription as string) ?? 'Desconocido';

  return {
    carrier: 'estafeta',
    status,
    eventos: events.map((e) => ({
      fecha: String(e.eventDate ?? e.date ?? ''),
      descripcion: String(e.description ?? e.status ?? ''),
      ubicacion: e.city ? String(e.city) : undefined,
    })),
    ultimaActualizacion: new Date().toISOString(),
  };
}
