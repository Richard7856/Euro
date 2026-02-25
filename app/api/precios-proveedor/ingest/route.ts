import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Ingesta ligera desde fuera: el sistema externo (email/WhatsApp processor) procesa
 * el mensaje del proveedor y solo envía aquí el precio para no saturar el dashboard.
 *
 * Uso: POST con header X-Precios-Api-Key: <valor de PRECIOS_INGEST_API_KEY en .env.local>
 * Body (mínimo): { "id_proveedor": "...", "precio": 123.45 }
 * Opcional: concepto, id_producto, moneda, unidad, fecha, fuente, referencia, observaciones
 *
 * Si PRECIOS_INGEST_API_KEY no está definido, el endpoint responde 503 (deshabilitado).
 */

function toDateStr(v: string | null | undefined): string {
  if (!v) return '';
  return String(v).trim().slice(0, 10);
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.PRECIOS_INGEST_API_KEY;
    if (!apiKey || apiKey.length < 8) {
      return NextResponse.json(
        { error: 'Ingest de precios no configurado (PRECIOS_INGEST_API_KEY)' },
        { status: 503 }
      );
    }
    const headerKey = req.headers.get('x-precios-api-key') || req.headers.get('X-Precios-Api-Key');
    if (headerKey !== apiKey) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const item = typeof body === 'object' && body !== null ? body : {};
    const id_proveedor = item.id_proveedor != null ? String(item.id_proveedor).trim() : '';
    const precio = parseFloat(String(item.precio).replace(/[^0-9.-]/g, ''));
    if (!id_proveedor || isNaN(precio) || precio < 0) {
      return NextResponse.json(
        { error: 'Se requieren id_proveedor y precio (número >= 0)' },
        { status: 400 }
      );
    }

    const supabase = await createAdminClient();
    const row = {
      id_proveedor,
      nombre_proveedor: item.nombre_proveedor != null ? String(item.nombre_proveedor).trim() : null,
      id_producto: item.id_producto != null && String(item.id_producto).trim() ? String(item.id_producto).trim() : null,
      concepto: item.concepto != null && String(item.concepto).trim() ? String(item.concepto).trim() : null,
      precio,
      moneda: (item.moneda && String(item.moneda).trim()) || 'MXN',
      unidad: (item.unidad && String(item.unidad).trim()) || 'kg',
      fecha: toDateStr(item.fecha) || new Date().toISOString().slice(0, 10),
      fuente: ['manual', 'importacion', 'api', 'email', 'whatsapp'].includes(item.fuente) ? item.fuente : 'api',
      referencia: item.referencia != null ? String(item.referencia).trim() : null,
      observaciones: item.observaciones != null ? String(item.observaciones).trim() : null,
      empresa_id: item.empresa_id || null,
    };

    const { data, error } = await supabase
      .from('precios_proveedor')
      .insert(row)
      .select('id, id_proveedor, precio, fecha, created_at')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, id: data?.id, id_proveedor, precio, fecha: row.fecha });
  } catch (err) {
    console.error('API precios-proveedor ingest:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error al ingestar precio' },
      { status: 500 }
    );
  }
}
