import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEmpresaIdFromRequest, getEmpresaSlugFromRequest } from '@/lib/empresaApi';

/**
 * GET: inventario por bodega.
 * Query: bodega_id (uuid) opcional; si no se envía, devuelve inventario de todas las bodegas.
 */
export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const bodegaId = searchParams.get('bodega_id');

    let query = supabase
      .from('inventario_bodega')
      .select('id, bodega_id, id_producto, cantidad, valor_unitario_promedio, updated_at');

    if (bodegaId) query = query.eq('bodega_id', bodegaId);

    const { data: rows, error } = await query.order('id_producto', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const bodegaIds = [...new Set((rows ?? []).map((r: { bodega_id: string }) => r.bodega_id))];
    const productosIds = [...new Set((rows ?? []).map((r: { id_producto: string }) => r.id_producto))];

    const [bodegasRes, productosRes] = await Promise.all([
      bodegaIds.length > 0 ? supabase.from('bodegas').select('id, nombre').in('id', bodegaIds) : { data: [] },
      productosIds.length > 0 ? supabase.from('productos').select('id_producto, nombre_producto').in('id_producto', productosIds) : { data: [] },
    ]);
    const nombresBodega = new Map((bodegasRes.data ?? []).map((b: { id: string; nombre: string }) => [b.id, b.nombre]));
    const nombresProducto = new Map((productosRes.data ?? []).map((p: { id_producto: string; nombre_producto: string }) => [p.id_producto, p.nombre_producto]));

    const inventario = (rows ?? []).map((r: Record<string, unknown>) => ({
      id: r.id,
      bodega_id: r.bodega_id,
      id_producto: r.id_producto,
      cantidad: Number(r.cantidad ?? 0),
      valor_unitario_promedio: Number(r.valor_unitario_promedio ?? 0),
      updated_at: r.updated_at,
      nombre_bodega: nombresBodega.get(String(r.bodega_id)) ?? null,
      nombre_producto: nombresProducto.get(String(r.id_producto)) ?? null,
    }));

    return NextResponse.json({ inventario });
  } catch (err) {
    console.error('API inventario-bodega GET:', err);
    return NextResponse.json({ error: 'Error al obtener inventario por bodega' }, { status: 500 });
  }
}
