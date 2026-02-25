import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEmpresaIdFromRequest, getEmpresaSlugFromRequest } from '@/lib/empresaApi';

const TIPOS_VALIDOS = ['entrada', 'salida', 'ajuste', 'traslado'] as const;
const REF_VALIDOS = ['compra', 'venta', 'ajuste', 'traslado', 'inicial', 'manual'] as const;

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const bodega_id = searchParams.get('bodega_id');
    const id_producto = searchParams.get('id_producto');
    const limit = Math.min(Number(searchParams.get('limit')) || 100, 500);

    let query = supabase
      .from('movimientos_inventario')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    const empresaId = getEmpresaIdFromRequest(req);
    const empresaSlug = getEmpresaSlugFromRequest(req);
    if (empresaId) {
      if (empresaSlug === 'euromex') {
        query = query.or(`empresa_id.eq.${empresaId},empresa_id.is.null`);
      } else {
        query = query.eq('empresa_id', empresaId);
      }
    }
    if (bodega_id) query = query.eq('bodega_id', bodega_id);
    if (id_producto) query = query.eq('id_producto', id_producto);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ movimientos: data ?? [] });
  } catch (err) {
    console.error('API movimientos-inventario GET:', err);
    return NextResponse.json({ error: 'Error al listar movimientos' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await req.json();
    const {
      bodega_id,
      id_producto,
      tipo,
      cantidad,
      unidad,
      referencia_tipo,
      referencia_id,
      observaciones,
    } = body;

    if (!bodega_id || !id_producto || !tipo || cantidad == null) {
      return NextResponse.json(
        { error: 'Faltan bodega_id, id_producto, tipo o cantidad' },
        { status: 400 }
      );
    }
    const cantidadNum = parseFloat(String(cantidad).replace(/[^0-9.-]/g, '')) || 0;
    if (cantidadNum <= 0) {
      return NextResponse.json({ error: 'Cantidad debe ser mayor a 0' }, { status: 400 });
    }
    if (!TIPOS_VALIDOS.includes(tipo)) {
      return NextResponse.json({ error: 'Tipo debe ser entrada, salida, ajuste o traslado' }, { status: 400 });
    }

    const empresaId = getEmpresaIdFromRequest(req);
    const insertMov: Record<string, unknown> = {
      bodega_id,
      id_producto: String(id_producto).trim(),
      tipo,
      cantidad: cantidadNum,
      unidad: unidad && String(unidad).trim() ? String(unidad).trim() : 'kg',
      referencia_tipo: referencia_tipo && REF_VALIDOS.includes(referencia_tipo) ? referencia_tipo : null,
      referencia_id: referencia_id != null ? String(referencia_id) : null,
      observaciones: observaciones != null && String(observaciones).trim() ? String(observaciones).trim() : null,
      usuario_id: user.id,
    };
    if (empresaId) insertMov.empresa_id = empresaId;

    const { data: movimiento, error: errInsert } = await supabase
      .from('movimientos_inventario')
      .insert(insertMov)
      .select()
      .single();

    if (errInsert) {
      return NextResponse.json({ error: errInsert.message }, { status: 500 });
    }

    const esEntrada = tipo === 'entrada' || tipo === 'ajuste';
    const esSalida = tipo === 'salida';

    if (esEntrada) {
      const { data: existente } = await supabase
        .from('inventario_bodega')
        .select('id, cantidad, valor_unitario_promedio')
        .eq('bodega_id', bodega_id)
        .eq('id_producto', String(id_producto).trim())
        .single();

      if (existente) {
        const nuevaCantidad = Number(existente.cantidad) + cantidadNum;
        await supabase
          .from('inventario_bodega')
          .update({ cantidad: nuevaCantidad, updated_at: new Date().toISOString() })
          .eq('id', existente.id);
      } else {
        await supabase.from('inventario_bodega').insert({
          bodega_id,
          id_producto: String(id_producto).trim(),
          cantidad: cantidadNum,
          valor_unitario_promedio: 0,
        });
      }
    } else if (esSalida) {
      const { data: existente, error: errSel } = await supabase
        .from('inventario_bodega')
        .select('id, cantidad')
        .eq('bodega_id', bodega_id)
        .eq('id_producto', String(id_producto).trim())
        .single();

      if (errSel || !existente) {
        return NextResponse.json(
          { error: 'No hay suficiente inventario en esta bodega para este producto' },
          { status: 400 }
        );
      }
      const actual = Number(existente.cantidad);
      if (actual < cantidadNum) {
        return NextResponse.json(
          { error: `Inventario insuficiente. Disponible: ${actual}` },
          { status: 400 }
        );
      }
      const nuevaCantidad = actual - cantidadNum;
      await supabase
        .from('inventario_bodega')
        .update({ cantidad: nuevaCantidad, updated_at: new Date().toISOString() })
        .eq('id', existente.id);
    }
    return NextResponse.json({ ok: true, movimiento });
  } catch (err) {
    console.error('API movimientos-inventario POST:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error al registrar movimiento' },
      { status: 500 }
    );
  }
}
