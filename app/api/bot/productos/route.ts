import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isBotApiKeyValidAsync } from '@/lib/botAuth';

const EUROMEX_ID = 'a0000000-0000-4000-8000-000000000001';

export async function GET(req: Request) {
  if (!(await isBotApiKeyValidAsync(req))) {
    return NextResponse.json({ error: 'No autorizado. Incluye X-API-Key o Authorization: Bearer <key>.' }, { status: 401 });
  }

  try {
    const supabase = await createAdminClient();
    const { searchParams } = new URL(req.url);
    const sku = searchParams.get('sku')?.trim() || null;

    const hoy = new Date().toISOString().slice(0, 10);

    const { data: productosRows, error: errProd } = await supabase
      .from('productos')
      .select('id_producto, nombre_producto')
      .order('id_producto', { ascending: true });

    if (errProd) return NextResponse.json({ error: errProd.message }, { status: 500 });

    let productos = (productosRows ?? []) as { id_producto: string; nombre_producto: string }[];
    if (sku) productos = productos.filter((p) => p.id_producto === sku);

    const { data: preciosVentaRows } = await supabase
      .from('precios_venta')
      .select('id_producto, precio_venta, moneda, unidad, vigente_desde')
      .or(`empresa_id.eq.${EUROMEX_ID},empresa_id.is.null`)
      .lte('vigente_desde', hoy)
      .or(`vigente_hasta.is.null,vigente_hasta.gte.${hoy}`)
      .order('vigente_desde', { ascending: false });

    const precioVentaByProducto = new Map<string, { precio_venta: number; moneda: string; unidad: string; vigente_desde: string }>();
    for (const r of preciosVentaRows ?? []) {
      const id = (r as { id_producto: string }).id_producto;
      if (!precioVentaByProducto.has(id)) {
        precioVentaByProducto.set(id, {
          precio_venta: Number((r as { precio_venta: number }).precio_venta ?? 0),
          moneda: String((r as { moneda?: string }).moneda ?? 'MXN'),
          unidad: String((r as { unidad?: string }).unidad ?? 'kg'),
          vigente_desde: String((r as { vigente_desde?: string }).vigente_desde ?? '').slice(0, 10),
        });
      }
    }

    const { data: preciosProvRows } = await supabase
      .from('precios_proveedor')
      .select('id_producto, id_proveedor, nombre_proveedor, precio, moneda, unidad, fecha, fuente')
      .or(`empresa_id.eq.${EUROMEX_ID},empresa_id.is.null`)
      .order('fecha', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(500);

    const ultimosPorProducto = new Map<string, { id_proveedor: string; nombre_proveedor: string | null; precio: number; moneda: string; unidad: string; fecha: string; fuente: string }[]>();
    const seen = new Set<string>();
    for (const r of preciosProvRows ?? []) {
      const idProd = (r as { id_producto?: string }).id_producto ?? '';
      const idProv = (r as { id_proveedor: string }).id_proveedor ?? '';
      const key = `${idProd}|${idProv}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const list = ultimosPorProducto.get(idProd) ?? [];
      list.push({
        id_proveedor: idProv,
        nombre_proveedor: (r as { nombre_proveedor?: string }).nombre_proveedor ?? null,
        precio: Number((r as { precio: number }).precio ?? 0),
        moneda: String((r as { moneda?: string }).moneda ?? 'MXN'),
        unidad: String((r as { unidad?: string }).unidad ?? 'kg'),
        fecha: String((r as { fecha?: string }).fecha ?? '').slice(0, 10),
        fuente: String((r as { fuente?: string }).fuente ?? 'api'),
      });
      ultimosPorProducto.set(idProd, list);
    }

    const productosPayload = productos.map((p) => {
      const pv = precioVentaByProducto.get(p.id_producto);
      const ultimos = ultimosPorProducto.get(p.id_producto) ?? [];
      return {
        sku: p.id_producto,
        nombre: p.nombre_producto ?? p.id_producto,
        precio_venta: pv?.precio_venta ?? null,
        moneda_venta: pv?.moneda ?? 'MXN',
        unidad: pv?.unidad ?? 'kg',
        ultimos_precios_proveedor: ultimos,
      };
    });

    if (sku && productosPayload.length === 0) {
      return NextResponse.json({ error: 'Producto no encontrado', productos: [] }, { status: 404 });
    }

    return NextResponse.json({ productos: productosPayload });
  } catch (err) {
    console.error('API bot/productos GET:', err);
    return NextResponse.json({ error: 'Error al obtener productos' }, { status: 500 });
  }
}
