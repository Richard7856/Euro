/**
 * Utilidad para APIs: obtener empresa_id desde la petición (cookie empresa o header x-empresa = slug).
 * Los IDs están alineados con supabase/migrations/001_empresas_multi_tenant.sql
 */
const SLUG_TO_ID: Record<string, string> = {
  euromex: 'a0000000-0000-4000-8000-000000000001',
  garritas: 'a0000000-0000-4000-8000-000000000002',
  cigarros: 'a0000000-0000-4000-8000-000000000003',
};

function getSlugFromRequest(req: Request): string | null {
  const header = req.headers.get('x-empresa')?.toLowerCase().trim();
  if (header && SLUG_TO_ID[header]) return header;
  const cookie = req.headers.get('cookie');
  if (!cookie) return null;
  const match = cookie.match(/\bempresa=([a-z]+)/);
  const slug = match?.[1]?.toLowerCase();
  return slug && SLUG_TO_ID[slug] ? slug : null;
}

export function getEmpresaIdFromRequest(req: Request): string | null {
  const slug = getSlugFromRequest(req);
  return slug ? SLUG_TO_ID[slug] : null;
}

export function getEmpresaSlugFromRequest(req: Request): string | null {
  return getSlugFromRequest(req);
}

/** id_producto que corresponde a cada empresa (compras CGR/CRQ sin empresa_id se muestran por empresa) */
export const EMPRESA_TO_PRODUCT_ID: Record<string, string> = {
  cigarros: 'CGR',
  garritas: 'CRQ',
};
