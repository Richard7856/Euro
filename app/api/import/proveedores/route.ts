import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEmpresaIdFromRequest } from '@/lib/empresaApi';

const BATCH_SIZE = 50;

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const empresaId = getEmpresaIdFromRequest(req);
    const body = await req.json();
    const rows: Record<string, string>[] = body.rows ?? [];

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'No hay filas para importar' }, { status: 400 });
    }

    const str = (v: unknown) =>
      v != null && String(v).trim() !== '' ? String(v).trim() : null;

    const rowsToUpsert = rows
      .map((r) => {
        const row: Record<string, unknown> = {
          id_proveedor:     str(r.id_proveedor),
          nombre_proveedor: str(r.nombre_proveedor),
          contacto:         str(r.contacto),
          telefono:         str(r.telefono),
          email:            str(r.email),
          condiciones_pago: str(r.condiciones_pago),
          tipo_producto:    str(r.tipo_producto),
          canal:            str(r.canal),
          updated_at:       new Date().toISOString(),
        };
        if (empresaId) row.empresa_id = empresaId;
        return row;
      })
      .filter((r) => r.id_proveedor && r.nombre_proveedor);

    if (rowsToUpsert.length === 0) {
      return NextResponse.json(
        { error: 'Ninguna fila tiene ID_Proveedor y Nombre_Proveedor completos' },
        { status: 400 }
      );
    }

    const errors: string[] = [];
    let imported = 0;

    for (let i = 0; i < rowsToUpsert.length; i += BATCH_SIZE) {
      const batch = rowsToUpsert.slice(i, i + BATCH_SIZE);
      const { error } = await supabase
        .from('proveedores')
        .upsert(batch, { onConflict: 'id_proveedor' });

      if (error) {
        errors.push(`Lote ${Math.floor(i / BATCH_SIZE) + 1}: ${error.message}`);
      } else {
        imported += batch.length;
      }
    }

    return NextResponse.json({ ok: true, imported, errors });
  } catch (err) {
    console.error('API import/proveedores POST:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error al importar' },
      { status: 500 }
    );
  }
}
