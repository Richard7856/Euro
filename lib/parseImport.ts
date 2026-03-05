/**
 * Utility functions for parsing data during CSV/XLSX bulk import.
 * Handles Spanish/US monetary formats and DD/MM/YYYY date strings.
 */

/**
 * Parse a monetary value from mixed number formats:
 *   - US:      "$80,000"  →  80000
 *   - US:      "80,000.50" → 80000.50
 *   - Spanish: "$50.000,00" → 50000
 *   - Spanish: "195,00"    → 195
 *   - Plain:   "504000"    → 504000
 */
export function parseMonetary(value: unknown): number {
  if (value == null) return 0;
  // Remove currency symbols and whitespace
  let s = String(value).replace(/[$€£\s]/g, '').trim();
  if (!s) return 0;

  const hasDot = s.includes('.');
  const hasComma = s.includes(',');

  if (hasDot && hasComma) {
    // Both separators — find which one is decimal (the last one)
    const lastDot = s.lastIndexOf('.');
    const lastComma = s.lastIndexOf(',');
    if (lastComma > lastDot) {
      // Spanish: 50.000,00 → remove dots, replace comma with dot
      s = s.replace(/\./g, '').replace(',', '.');
    } else {
      // US: 80,000.00 → remove commas
      s = s.replace(/,/g, '');
    }
  } else if (hasComma) {
    // Only comma — determine if decimal or thousands
    const parts = s.split(',');
    if (parts.length === 2 && parts[1].length <= 2) {
      // Decimal comma: 195,00 or 50,5
      s = s.replace(',', '.');
    } else {
      // Thousands comma: 80,000 or 1,000,000
      s = s.replace(/,/g, '');
    }
  } else if (hasDot) {
    // Only dot — check if it could be a Spanish thousands separator
    const parts = s.split('.');
    if (parts.length === 2 && parts[1].length === 3 && !parts[1].includes(',')) {
      // e.g. 50.000 → 50000
      s = s.replace(/\./g, '');
    }
    // Otherwise keep as standard decimal: 50.5
  }

  return parseFloat(s) || 0;
}

/**
 * Parse a date into ISO YYYY-MM-DD format.
 * Handles:
 *   - DD/MM/YYYY (e.g. "1/08/2025")
 *   - D/M/YY    (e.g. "01/08/25" → assumes 2000s)
 *   - DD-MM-YYYY
 *   - YYYY-MM-DD (already ISO)
 * Returns null if unparseable.
 */
export function parseImportDate(value: unknown): string | null {
  if (value == null) return null;
  const s = String(value).trim();
  if (!s) return null;

  // DD/MM/YYYY or D/M/YYYY
  const dmyFull = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmyFull) {
    const [, d, m, y] = dmyFull;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // DD/MM/YY or D/M/YY (2-digit year)
  const dmyShort = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/);
  if (dmyShort) {
    const [, d, m, y] = dmyShort;
    const fullYear = parseInt(y) >= 0 ? `20${y}` : `19${y}`;
    return `${fullYear}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // DD-MM-YYYY
  const dmyDash = s.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (dmyDash) {
    const [, d, m, y] = dmyDash;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // Already ISO YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);

  return null;
}
