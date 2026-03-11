/**
 * Manual carrier adapter — used when no API key is configured or carrier is unknown.
 * Returns a stub result so the UI doesn't crash; coordinates must be updated manually.
 */
import type { TrackingResult } from './types';

export function trackManual(guia: string): TrackingResult {
  return {
    carrier: 'manual',
    status: 'Sin datos de rastreo',
    eventos: [
      {
        fecha: new Date().toISOString(),
        descripcion: `Guía ${guia} — actualización manual requerida`,
      },
    ],
    ultimaActualizacion: new Date().toISOString(),
  };
}
