import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isBotApiKeyValidAsync } from '@/lib/botAuth';

const EUROMEX_ID = 'a0000000-0000-4000-8000-000000000001';
const FUENTES = ['manual', 'importacion', 'api', 'email', 'whatsapp'] as const;

function toDateStr(v: string | null | undefined): string {
  if (!v) return '';
  return String(v).trim().slice(0, 10);
}

export async function POST(req: Request) {
  if (!(await isBotApiKeyValidAsync(req))) {
    return NextResponse.json({ error: 'No autorizado. Incluye X-API-Key o Authorization: Bearer <key>.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const item = typeof body === 'object' && body !== null ? body : {};
    const sku = item.sku != null ? String(item.sku).trim() : (item.id_producto != null ? String(item.id_producto).trim() : '');
    const id_proveedor = item.id_proveedor != null ? String(item.id_proveedor).trim() : '';
    const precio = parseFloat(String(item.precio).replace(/[^0-9.-]/g, ''));

    if (!sku || !id_proveedor || isNaN(precio) || precio < 0) {
      return NextResponse.json(
        { error: 'Se requieren sku (id_producto), id_proveedor y precio (número >= 0)' },
        { status: 400 }
      );
    }

    const supabase = await createAdminClient();
    const { data: exist } = await supabase.from('productos').select('id_producto').eq('id_producto', sku).single();
    if (!exist) {
      return NextResponse.json({ error: 'Producto no encontrado. Crea el producto desde el dashboard.' }, { status: 404 });
    }

    const fuente = FUENTES.includes(item.fuente) ? item.fuente : 'api';
    const row = {
      id_proveedor,
      nombre_proveedor: item.nombre_proveedor != null ? String(item.nombre_proveedor).trim() : null,
      id_producto: sku,
      concepto: item.concepto != null ? String(item.concepto).trim() : null,
      precio,
      moneda: (item.moneda && String(item.moneda).trim()) || 'MXN',
      unidad: (item.unidad && String(item.unidad).trim()) || 'kg',
      fecha: toDateStr(item.fecha) || new Date().toISOString().slice(0, 10),
      fuente,
      referencia: item.referencia != null ? String(item.referencia).trim() : null,
      observaciones: item.observaciones != null ? String(item.observaciones).trim() : null,
      empresa_id: EUROMEX_ID,
    };

    const { data: inserted, error } = await supabase
      .from('precios_proveedor')
      .insert(row)
      .select('id, id_producto, id_proveedor, precio, fecha, created_at')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({
      ok: true,
      precio: {
        id: inserted?.id,
        id_producto: inserted?.id_producto,
        id_proveedor: inserted?.id_proveedor,
        precio: inserted?.precio,
        fecha: (inserted as { fecha?: string })?.fecha,
        created_at: (inserted as { created_at?: string })?.created_at,
      },
    });
  } catch (err) {
    console.error('API bot/precios-proveedor POST:', err);
    return NextResponse.json({ error: 'Error al registrar precio' }, { status: 500 });
  }
}
