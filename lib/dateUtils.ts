/**
 * Utilidad para parsear fechas de Google Sheets (ISO, DD/MM/YY, Excel serial)
 */

/**
 * Convierte una fecha en formato string o número (Excel serial) a ISO (yyyy-MM-dd).
 * Retorna el string original si ya es ISO o no se puede parsear.
 */
export function toISODate(value: string | number | undefined): string {
  if (value === undefined || value === null) return '';
  const s = String(value).trim();
  if (!s) return '';
  // Ya es ISO
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.split('T')[0];
  // DD/MM/YYYY o DD/MM/YY
  const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (m) {
    const year = m[3].length === 2 ? 2000 + parseInt(m[3], 10) : parseInt(m[3], 10);
    const month = String(parseInt(m[2], 10)).padStart(2, '0');
    const day = String(parseInt(m[1], 10)).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  // Excel serial
  const num = parseFloat(s);
  if (!isNaN(num) && num > 0) {
    const d = new Date((num - 25569) * 86400 * 1000);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split('T')[0];
    }
  }
  return s;
}

/**
 * Parsea fecha para filtrado; retorna Date o null
 */
export function parseDateForFilter(value: string | undefined): Date | null {
  const iso = toISODate(value);
  if (!iso) return null;
  const d = new Date(iso + 'T12:00:00Z');
  return isNaN(d.getTime()) ? null : d;
}
