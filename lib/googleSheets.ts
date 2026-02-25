import { google } from 'googleapis';
import { SHEETS_CONFIG } from './sheetsConfig';

/**
 * Cliente autenticado para Google Sheets (Service Account)
 * Requiere: GOOGLE_SHEETS_CLIENT_EMAIL, GOOGLE_SHEETS_PRIVATE_KEY
 */
function getSheetsClient() {
  const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!clientEmail || !privateKey) {
    throw new Error('Faltan credenciales: GOOGLE_SHEETS_CLIENT_EMAIL y GOOGLE_SHEETS_PRIVATE_KEY');
  }

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  return google.sheets({ version: 'v4', auth });
}

/**
 * Obtiene los valores de una hoja/rango
 */
export async function getSheetRange(range: string): Promise<string[][]> {
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID || process.env.NEXT_PUBLIC_GOOGLE_SHEETS_ID;
  if (!spreadsheetId) {
    throw new Error('Falta GOOGLE_SHEETS_ID en .env.local');
  }

  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });

  return (res.data.values || []) as string[][];
}

/**
 * Obtiene todas las hojas configuradas en un solo objeto
 */
export async function fetchAllSheetsData() {
  const ranges = SHEETS_CONFIG.ranges;
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID || process.env.NEXT_PUBLIC_GOOGLE_SHEETS_ID;

  if (!spreadsheetId) {
    return { error: 'No está configurado GOOGLE_SHEETS_ID en .env.local' };
  }

  try {
    const sheets = getSheetsClient();

    const batchRes = await sheets.spreadsheets.values.batchGet({
      spreadsheetId,
      ranges: Object.values(ranges),
    });

    const data = batchRes.data.valueRanges || [];
    const keys = Object.keys(ranges) as (keyof typeof ranges)[];

    const result: Record<string, string[][]> = {};
    keys.forEach((key, i) => {
      result[key] = (data[i]?.values || []) as string[][];
    });

    return result;
  } catch (err) {
    console.error('Error fetching Sheets:', err);
    return { error: String(err) };
  }
}
