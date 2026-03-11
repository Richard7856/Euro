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

    // Fetch current USD rate for tipo_cambio_usd
    const { data: cfg } = await supabase
      .from('app_config')
      .select('value')
      .eq('key', 'usd_to_mxn')
      .single();
    const rate = cfg?.value ? parseFloat(String(cfg.value)) : 18;
    const tipoCambioUsd = Number.isFinite(rate) && rate > 0 ? rate : 18;

    const str = (v: unknown) =>
      v != null && String(v).trim() !== '' ? String(v).trim() : null;

    const rowsToUpsert = rows
      .map((r) => {
        // Quantity and price may use Spanish format
        const cantidadRaw = r.cantidad_comprada ?? r.cantidad_compra ?? '';
        const costoRaw = r.costo_unitario ?? '';
        const subtotalRaw = r.subtotal ?? '';

        const cantidad = cantidadRaw ? parseMonetary(cantidadRaw) : null;
        const costo = costoRaw ? parseMonetary(costoRaw) : null;
        const subtotal = subtotalRaw
          ? parseMonetary(subtotalRaw)
          : (cantidad ?? 0) * (costo ?? 0) || null;

        const row: Record<string, unknown> = {
          id_compra:        str(r.id_compra),
          id_producto:      str(r.id_producto),
          // "Movimineto" column in the CSV — store as movimiento
          movimiento:       str(r.movimiento ?? r.movimineto ?? r.descripcion),
          producto_nombre:  str(r.producto_nombre ?? r.movimiento ?? r.movimineto),
          fecha_compra:     parseImportDate(r.fecha_compra),
          id_proveedor:     str(r.id_proveedor),
          tipo_compra:      str(r.tipo_compra) ?? 'Contado',
          cantidad_compra:  cantidad,
          costo_unitario:   costo,
          subtotal:         subtotal,
          moneda:           str(r.moneda) ?? 'Peso mexicano',
          fecha_vencimiento: parseImportDate(r.fecha_vencimiento),
          estado_pago:      str(r.estado_pago) ?? 'Pendiente',
          observaciones:    str(r.observaciones ?? r.observaciones_pago),
          tipo_cambio_usd:  tipoCambioUsd,
          updated_at:       new Date().toISOString(),
        };
        if (empresaId) row.empresa_id = empresaId;
        return row;
      })
      .filter((r) => r.id_compra);

    if (rowsToUpsert.length === 0) {
      return NextResponse.json(
        { error: 'Ninguna fila tiene ID_Compra completo' },
        { status: 400 }
      );
    }

    const errors: string[] = [];
    let imported = 0;

    for (let i = 0; i < rowsToUpsert.length; i += BATCH_SIZE) {
      const batch = rowsToUpsert.slice(i, i + BATCH_SIZE);
      const { error } = await supabase
        .from('compras')
        .upsert(batch, { onConflict: 'id_compra' });

      if (error) {
        errors.push(`Lote ${Math.floor(i / BATCH_SIZE) + 1}: ${error.message}`);
      } else {
        imported += batch.length;
      }
    }

    // Auto-create inventory entries for imported compras with id_producto + cantidad
    if (imported > 0) {
      const comprasConProducto = rowsToUpsert.filter(
        (r) => r.id_producto && r.cantidad_compra && Number(r.cantidad_compra) > 0
      );
      if (comprasConProducto.length > 0) {
        let bodegaQuery = supabase.from('bodegas').select('id').eq('activo', true);
        if (empresaId) bodegaQuery = bodegaQuery.eq('empresa_id', empresaId);
        const { data: bodegas } = await bodegaQuery.order('nombre', { ascending: true }).limit(1);
        if (bodegas && bodegas.length > 0) {
          const bodegaId = bodegas[0].id;
          for (const c of comprasConProducto) {
            const idProducto = String(c.id_producto);
            const cantidadC = Number(c.cantidad_compra);
            const vu = c.costo_unitario ? Number(c.costo_unitario) : 0;
            const { data: existente } = await supabase
              .from('inventario_bodega')
              .select('id, cantidad, valor_unitario_promedio')
              .eq('bodega_id', bodegaId)
              .eq('id_producto', idProducto)
              .single();
            if (existente) {
              const nuevaCantidad = Number(existente.cantidad) + cantidadC;
              const updFields: Record<string, unknown> = { cantidad: nuevaCantidad, updated_at: new Date().toISOString() };
              if (vu > 0) {
                const vap = (Number(existente.cantidad) * Number(existente.valor_unitario_promedio) + cantidadC * vu) / nuevaCantidad;
                updFields.valor_unitario_promedio = Math.round(vap * 100) / 100;
              }
              await supabase.from('inventario_bodega').update(updFields).eq('id', existente.id);
            } else {
              await supabase.from('inventario_bodega').insert({
                bodega_id: bodegaId, id_producto: idProducto,
                cantidad: cantidadC, valor_unitario_promedio: vu,
                ...(empresaId ? { empresa_id: empresaId } : {}),
              });
            }
          }
          // Bulk insert movimientos
          const movs = comprasConProducto.map((c) => ({
            bodega_id: bodegaId,
            id_producto: String(c.id_producto),
            tipo: 'entrada',
            cantidad: Number(c.cantidad_compra),
            unidad: 'kg',
            referencia_tipo: 'compra',
            referencia_id: String(c.id_compra),
            observaciones: `Importación masiva compra ${c.id_compra}`,
            ...(empresaId ? { empresa_id: empresaId } : {}),
          }));
          await supabase.from('movimientos_inventario').insert(movs);
        }
      }
    }

    return NextResponse.json({ ok: true, imported, errors });
  } catch (err) {
    console.error('API import/compras POST:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error al importar' },
      { status: 500 }
    );
  }
}
