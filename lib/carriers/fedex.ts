/**
 * FedEx carrier adapter.
 * Uses FedEx Track v1 API (requires FEDEX_API_KEY + FEDEX_API_SECRET env vars).
 * Docs: https://developer.fedex.com/api/en-us/catalog/tracking/v1/docs.html
 */
import type { TrackingResult } from './types';

async function getFedExToken(): Promise<string> {
  const key = process.env.FEDEX_API_KEY;
  const secret = process.env.FEDEX_API_SECRET;
  if (!key || !secret) throw new Error('FedEx API credentials not configured (FEDEX_API_KEY / FEDEX_API_SECRET)');

  const res = await fetch('https://apis.fedex.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'client_credentials', client_id: key, client_secret: secret }),
  });
  if (!res.ok) throw new Error(`FedEx auth failed: ${res.status}`);
  const { access_token } = await res.json() as { access_token: string };
  return access_token;
}

export async function trackFedEx(guia: string): Promise<TrackingResult> {
  const token = await getFedExToken();

  const res = await fetch('https://apis.fedex.com/track/v1/trackingnumbers', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'x-locale': 'es_MX' },
    body: JSON.stringify({ trackingInfo: [{ trackingNumberInfo: { trackingNumber: guia } }], includeDetailedScans: true }),
  });
  if (!res.ok) throw new Error(`FedEx tracking failed: ${res.status}`);
  const data = await res.json() as { output?: { completeTrackResults?: Record<string, unknown>[] } };

  const result = data.output?.completeTrackResults?.[0] as Record<string, unknown> | undefined;
  const trackResult = (result?.trackResults as Record<string, unknown>[] | undefined)?.[0] as Record<string, unknown> | undefined;
  if (!trackResult) throw new Error('No se encontró el envío en FedEx');

  const latestStatus = trackResult.latestStatusDetail as Record<string, unknown> | undefined;
  const status = (latestStatus?.description as string) ?? 'Desconocido';
  const scans = (trackResult.scanEvents as Record<string, unknown>[] | undefined) ?? [];

  return {
    carrier: 'fedex',
    status,
    eventos: scans.map((s) => ({
      fecha: String(s.date ?? ''),
      descripcion: String(s.eventDescription ?? ''),
      ubicacion: s.scanLocation
        ? String((s.scanLocation as Record<string, unknown>).city ?? '')
        : undefined,
    })),
    ultimaActualizacion: new Date().toISOString(),
  };
}
