import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEmpresaIdFromRequest, getEmpresaSlugFromRequest } from '@/lib/empresaApi';

const EUROMEX_ID = 'a0000000-0000-4000-8000-000000000001';

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const slug = getEmpresaSlugFromRequest(req);
    if (slug !== 'euromex') {
      return NextResponse.json({ error: 'El cotizador solo está disponible para Euromex', cotizaciones: [] }, { status: 200 });
    }

    const { data: rows, error } = await supabase
      .from('cotizaciones')
      .select('*')
      .eq('empresa_id', EUROMEX_ID)
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ cotizaciones: rows ?? [] });
  } catch (err) {
    console.error('API cotizaciones GET:', err);
    return NextResponse.json({ error: 'Error al obtener cotizaciones' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const empresaId = getEmpresaIdFromRequest(req);
    if (empresaId !== EUROMEX_ID) {
      return NextResponse.json({ error: 'El cotizador solo está disponible para Euromex' }, { status: 403 });
    }

    const body = await req.json();
    const {
      producto_concepto,
      cantidad,
      unidad,
      costo_compra_total_usd,
      gastos_extra,
      tipo_cambio_mxn,
      moneda_venta,
      inversion_final_usd,
      costo_unitario_final_usd,
      modo_margen,
      margen_porcentaje_deseado,
      precio_venta_unitario,
      margen_real_porcentaje,
    } = body;

    if (!producto_concepto || cantidad == null) {
      return NextResponse.json({ error: 'Faltan producto/concepto o cantidad' }, { status: 400 });
    }

    const insertData = {
      empresa_id: EUROMEX_ID,
      producto_concepto: String(producto_concepto).trim(),
      cantidad: Number(cantidad) || 0,
      unidad: String(unidad || 'kg').trim(),
      costo_compra_total_usd: Number(costo_compra_total_usd) || 0,
      gastos_extra: Array.isArray(gastos_extra) ? gastos_extra : [],
      tipo_cambio_mxn: Number(tipo_cambio_mxn) || 20,
      moneda_venta: moneda_venta === 'MXN' ? 'MXN' : 'USD',
      inversion_final_usd: Number(inversion_final_usd) ?? 0,
      costo_unitario_final_usd: Number(costo_unitario_final_usd) ?? 0,
      modo_margen: modo_margen === 'precio_fijo' ? 'precio_fijo' : 'porcentaje',
      margen_porcentaje_deseado: margen_porcentaje_deseado != null ? Number(margen_porcentaje_deseado) : null,
      precio_venta_unitario: precio_venta_unitario != null ? Number(precio_venta_unitario) : null,
      margen_real_porcentaje: margen_real_porcentaje != null ? Number(margen_real_porcentaje) : null,
      updated_at: new Date().toISOString(),
    };

    const { data: row, error } = await supabase
      .from('cotizaciones')
      .insert(insertData)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ cotizacion: row });
  } catch (err) {
    console.error('API cotizaciones POST:', err);
    return NextResponse.json({ error: 'Error al guardar cotización' }, { status: 500 });
  }
}
