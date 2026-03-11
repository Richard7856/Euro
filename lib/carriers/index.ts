/**
 * Central carrier dispatcher.
 * Auto-detects carrier from guía format and calls the appropriate adapter.
 *
 * Detection rules (Mexican/international common formats):
 *  - 7 digits              → Estafeta
 *  - Starts with JD or 1Z → DHL / UPS  (route to DHL)
 *  - 12-15 digits          → FedEx
 *  - Else                  → Manual (no real tracking)
 */
import type { TrackingResult } from './types';
import { trackEstafeta } from './estafeta';
import { trackDHL } from './dhl';
import { trackFedEx } from './fedex';
import { trackManual } from './manual';

export function detectCarrier(guia: string, hint?: string): string {
  if (hint && ['estafeta', 'dhl', 'fedex', 'manual'].includes(hint.toLowerCase())) {
    return hint.toLowerCase();
  }
  const g = guia.replace(/\s/g, '');
  if (/^\d{7}$/.test(g)) return 'estafeta';
  if (/^(JD|1Z)/i.test(g)) return 'dhl';
  if (/^\d{12,15}$/.test(g)) return 'fedex';
  return 'manual';
}

export async function trackShipment(guia: string, carrier?: string): Promise<TrackingResult> {
  const resolved = detectCarrier(guia, carrier);
  try {
    switch (resolved) {
      case 'estafeta': return await trackEstafeta(guia);
      case 'dhl':      return await trackDHL(guia);
      case 'fedex':    return await trackFedEx(guia);
      default:         return trackManual(guia);
    }
  } catch (err) {
    // If API call fails, return manual stub with error info
    return {
      carrier: resolved,
      status: `Error de rastreo: ${err instanceof Error ? err.message : 'desconocido'}`,
      eventos: [],
      ultimaActualizacion: new Date().toISOString(),
    };
  }
}

export type { TrackingResult, TrackingEvento } from './types';
