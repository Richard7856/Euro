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

    const rowsToInsert = rows
      .map((r) => {
        const monto = parseMonetary(r.monto_pagado);
        const fecha = parseImportDate(r.fecha_pago) ?? new Date().toISOString().slice(0, 10);

        // Normalise método de pago
        const metodoRaw = String(r.metodo_pago ?? '').toUpperCase();
        const metodo = metodoRaw.includes('EFECTIVO') ? 'EFECTIVO' : 'TRANSFERENCIA';

        // Normalise canal
        const canalRaw = String(r.canal_cobro ?? r.canal ?? 'DANTE').trim();

        const row: Record<string, unknown> = {
          id_venta:    str(r.id_venta),
          id_producto: str(r.id_producto),
          canal_cobro: canalRaw || 'DANTE',
          fecha_pago:  fecha,
          metodo_pago: metodo,
          monto_pagado: monto,
          evidencia:   str(r.evidencia),
          notas:       str(r.notas),
        };
        if (empresaId) row.empresa_id = empresaId;
        return row;
      })
      // Require id_venta and a non-zero monto
      .filter((r) => r.id_venta && (r.monto_pagado as number) > 0);

    if (rowsToInsert.length === 0) {
      return NextResponse.json(
        { error: 'Ninguna fila tiene ID_Venta y Monto_Pagado válidos' },
        { status: 400 }
      );
    }

    const errors: string[] = [];
    let imported = 0;

    // Cobros uses INSERT (no unique id from CSV — each row is a distinct payment)
    for (let i = 0; i < rowsToInsert.length; i += BATCH_SIZE) {
      const batch = rowsToInsert.slice(i, i + BATCH_SIZE);
      const { error } = await supabase.from('cobros').insert(batch);

      if (error) {
        errors.push(`Lote ${Math.floor(i / BATCH_SIZE) + 1}: ${error.message}`);
      } else {
        imported += batch.length;
      }
    }

    return NextResponse.json({ ok: true, imported, errors });
  } catch (err) {
    console.error('API import/cobros POST:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error al importar' },
      { status: 500 }
    );
  }
}
