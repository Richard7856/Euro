/**
 * Tipos de cambio para unificar a MXN.
 * 1 USD = 18 MXN | 1 EUR = 20 MXN
 */
export const USD_TO_MXN = 18;
export const EUR_TO_MXN = 20;

export type MonedaCodigo = 'USD' | 'EUR' | 'MXN' | string;

/**
 * Convierte un monto a MXN según la moneda.
 * Si la moneda no es USD ni EUR, se asume MXN (sin conversión).
 */
export function convertToMxn(amount: number, moneda: MonedaCodigo | null | undefined): number {
  if (amount == null || Number.isNaN(amount)) return 0;
  const m = (moneda || 'MXN').toString().toUpperCase().trim();
  if (m === 'USD' || m === 'DOLAR' || m === 'DÓLAR') return amount * USD_TO_MXN;
  if (m === 'EUR' || m === 'EURO' || m === 'EUROS') return amount * EUR_TO_MXN;
  return amount; // MXN o desconocido
}
