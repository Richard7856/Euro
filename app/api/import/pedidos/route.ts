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
        const subtotalRaw = r.subtotal ?? r.total_pedido ?? '';
        const totalPedido = subtotalRaw ? parseMonetary(subtotalRaw) : null;

        // Canal comes from Canal_Venta or Logistica column in CSV
        const canal = str(r.canal_venta ?? r.logistica ?? r.canal);

        const row: Record<string, unknown> = {
          id_pedido:    str(r.id_pedido),
          id_venta:     str(r.id_venta),
          id_compra:    str(r.id_compra),
          id_producto:  str(r.id_producto),
          id_cliente:   str(r.id_cliente),
          fecha_pedido: parseImportDate(r.fecha_pedido),
          canal_venta:  canal,
          total_pedido: totalPedido,
          notas:        str(r.notas),
          evidencia:    str(r.evidencia),
        };
        if (empresaId) row.empresa_id = empresaId;
        return row;
      })
      // Keep only rows with a valid id_pedido (last rows in Ventas.csv are notes)
      .filter((r) => r.id_pedido);

    if (rowsToUpsert.length === 0) {
      return NextResponse.json(
        { error: 'Ninguna fila tiene ID_Pedido completo' },
        { status: 400 }
      );
    }

    const errors: string[] = [];
    let imported = 0;

    for (let i = 0; i < rowsToUpsert.length; i += BATCH_SIZE) {
      const batch = rowsToUpsert.slice(i, i + BATCH_SIZE);
      const { error } = await supabase
        .from('pedidos')
        .upsert(batch, { onConflict: 'id_pedido' });

      if (error) {
        errors.push(`Lote ${Math.floor(i / BATCH_SIZE) + 1}: ${error.message}`);
      } else {
        imported += batch.length;
      }
    }

    return NextResponse.json({ ok: true, imported, errors });
  } catch (err) {
    console.error('API import/pedidos POST:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error al importar' },
      { status: 500 }
    );
  }
}
