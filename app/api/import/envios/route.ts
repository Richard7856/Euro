import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEmpresaIdFromRequest } from '@/lib/empresaApi';
import { parseMonetary, parseImportDate } from '@/lib/parseImport';

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
          id_envio:            str(r.id_envio),
          producto:            str(r.producto),
          id_cliente:          str(r.id_cliente),
          id_compra:           str(r.id_compra),
          tipo_envio:          str(r.tipo_envio) ?? 'Compra',
          fecha_envio:         parseImportDate(r.fecha_envio),
          proveedor_logistico: str(r.proveedor_logistico),
          guia_rastreo:        str(r.guia_rastreo ?? r.guia),
          costo_envio:         r.costo_envio ? parseMonetary(r.costo_envio) : null,
          origen:              str(r.origen),
          destino:             str(r.destino),
          estado_envio:        str(r.estado_envio) ?? 'Pendiente',
          fecha_entrega:       parseImportDate(r.fecha_entrega),
        };
        if (empresaId) row.empresa_id = empresaId;
        return row;
      })
      .filter((r) => r.id_envio);

    if (rowsToUpsert.length === 0) {
      return NextResponse.json(
        { error: 'Ninguna fila tiene ID_Envio completo' },
        { status: 400 }
      );
    }

    const errors: string[] = [];
    let imported = 0;

    for (let i = 0; i < rowsToUpsert.length; i += BATCH_SIZE) {
      const batch = rowsToUpsert.slice(i, i + BATCH_SIZE);
      const { error } = await supabase
        .from('envios')
        .upsert(batch, { onConflict: 'id_envio' });

      if (error) {
        errors.push(`Lote ${Math.floor(i / BATCH_SIZE) + 1}: ${error.message}`);
      } else {
        imported += batch.length;
      }
    }

    return NextResponse.json({ ok: true, imported, errors });
  } catch (err) {
    console.error('API import/envios POST:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error al importar' },
      { status: 500 }
    );
  }
}
