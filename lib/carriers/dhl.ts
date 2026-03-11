/**
 * DHL carrier adapter.
 * Uses DHL Shipment Tracking API v2 (requires DHL_API_KEY env var).
 * Docs: https://developer.dhl.com/api-reference/shipment-tracking
 */
import type { TrackingResult } from './types';

export async function trackDHL(guia: string): Promise<TrackingResult> {
  const apiKey = process.env.DHL_API_KEY;
  if (!apiKey) throw new Error('DHL API key not configured (DHL_API_KEY)');

  const res = await fetch(
    `https://api-eu.dhl.com/track/shipments?trackingNumber=${encodeURIComponent(guia)}`,
    { headers: { 'DHL-API-Key': apiKey } }
  );
  if (!res.ok) throw new Error(`DHL tracking failed: ${res.status}`);
  const data = await res.json() as { shipments?: Record<string, unknown>[] };

  const shipment = data.shipments?.[0] as Record<string, unknown> | undefined;
  if (!shipment) throw new Error('No se encontró el envío en DHL');

  const events = (shipment.events as Record<string, unknown>[] | undefined) ?? [];
  const status = (shipment.status as Record<string, unknown>)?.description as string ?? 'Desconocido';

  // DHL sometimes returns location coordinates in events
  const lastWithCoords = events.find(
    (e) => (e.location as Record<string, unknown>)?.address
  ) as Record<string, unknown> | undefined;
  const loc = lastWithCoords?.location as Record<string, unknown> | undefined;
  const coords = loc?.geoLocation as { latitude?: number; longitude?: number } | undefined;

  return {
    carrier: 'dhl',
    status,
    lat: coords?.latitude,
    lng: coords?.longitude,
    eventos: events.map((e) => ({
      fecha: String(e.timestamp ?? ''),
      descripcion: String(e.description ?? ''),
      ubicacion: (e.location as Record<string, unknown>)?.address
        ? String(((e.location as Record<string, unknown>).address as Record<string, unknown>).addressLocality ?? '')
        : undefined,
    })),
    ultimaActualizacion: new Date().toISOString(),
  };
}
