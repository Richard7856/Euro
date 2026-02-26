import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isBotApiKeyValidAsync } from '@/lib/botAuth';

const EUROMEX_ID = 'a0000000-0000-4000-8000-000000000001';

function toDateStr(v: string | null | undefined): string {
  if (!v) return '';
  return String(v).trim().slice(0, 10);
}

export async function PATCH(req: Request) {
  if (!(await isBotApiKeyValidAsync(req))) {
    return NextResponse.json({ error: 'No autorizado. Incluye X-API-Key o Authorization: Bearer <key>.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const item = typeof body === 'object' && body !== null ? body : {};
    const sku = item.sku != null ? String(item.sku).trim() : (item.id_producto != null ? String(item.id_producto).trim() : '');
    const precio_venta = parseFloat(String(item.precio_venta).replace(/[^0-9.-]/g, ''));

    if (!sku || isNaN(precio_venta) || precio_venta < 0) {
      return NextResponse.json(
        { error: 'Se requieren sku (id_producto) y precio_venta (número >= 0)' },
        { status: 400 }
      );
    }

    const supabase = await createAdminClient();
    const { data: producto } = await supabase.from('productos').select('id_producto, nombre_producto').eq('id_producto', sku).single();
    if (!producto) {
      return NextResponse.json({ error: 'Producto no encontrado. Crea el producto desde el dashboard.' }, { status: 404 });
    }

    const hoy = toDateStr(new Date().toISOString()) || new Date().toISOString().slice(0, 10);
    const moneda = (item.moneda && String(item.moneda).trim()) || 'MXN';
    const unidad = (item.unidad && String(item.unidad).trim()) || 'kg';

    const { data: existente } = await supabase
      .from('precios_venta')
      .select('id, vigente_desde, vigente_hasta')
      .eq('id_producto', sku)
      .or(`empresa_id.eq.${EUROMEX_ID},empresa_id.is.null`)
      .lte('vigente_desde', hoy)
      .or('vigente_hasta.is.null,vigente_hasta.gte.' + hoy)
      .order('vigente_desde', { ascending: false })
      .limit(1)
      .single();

    if (existente) {
      const { data: updated, error: errUpdate } = await supabase
        .from('precios_venta')
        .update({
          precio_venta,
          moneda,
          unidad,
          updated_at: new Date().toISOString(),
        })
        .eq('id', (existente as { id: string }).id)
        .select('id_producto, precio_venta, moneda, vigente_desde')
        .single();

      if (errUpdate) return NextResponse.json({ error: errUpdate.message }, { status: 500 });
      return NextResponse.json({
        ok: true,
        precio_venta: {
          id_producto: (updated as { id_producto?: string })?.id_producto,
          precio_venta: (updated as { precio_venta?: number })?.precio_venta,
          moneda: (updated as { moneda?: string })?.moneda,
          vigente_desde: (updated as { vigente_desde?: string })?.vigente_desde?.slice(0, 10),
        },
      });
    }

    const { data: inserted, error: errInsert } = await supabase
      .from('precios_venta')
      .insert({
        id_producto: sku,
        nombre_producto: (producto as { nombre_producto?: string }).nombre_producto ?? null,
        precio_venta,
        moneda,
        unidad,
        vigente_desde: hoy,
        vigente_hasta: null,
        origen: 'api',
        empresa_id: EUROMEX_ID,
        updated_at: new Date().toISOString(),
      })
      .select('id_producto, precio_venta, moneda, vigente_desde')
      .single();

    if (errInsert) return NextResponse.json({ error: errInsert.message }, { status: 500 });
    return NextResponse.json({
      ok: true,
      precio_venta: {
        id_producto: (inserted as { id_producto?: string })?.id_producto,
        precio_venta: (inserted as { precio_venta?: number })?.precio_venta,
        moneda: (inserted as { moneda?: string })?.moneda,
        vigente_desde: (inserted as { vigente_desde?: string })?.vigente_desde?.slice(0, 10),
      },
    });
  } catch (err) {
    console.error('API bot/precios-venta PATCH:', err);
    return NextResponse.json({ error: 'Error al actualizar precio de venta' }, { status: 500 });
  }
}
