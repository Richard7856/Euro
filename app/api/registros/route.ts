import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEmpresaIdFromRequest } from '@/lib/empresaApi';

/**
 * Parsea mensaje simple para extraer tipo y datos.
 * Ejemplos: "cliente Christ-CDMX Christian e Irving", "proveedor DVD-BRS DAVIDSS BROSS", "gasto flete 5000 transporte"
 */
function parseMensaje(texto: string): { tipo: string; datos: Record<string, unknown> } {
  const t = texto.trim();
  const partes = t.split(/\s+/);
  const cmd = partes[0]?.toLowerCase();

  if (partes.length < 2) {
    return { tipo: 'nota', datos: { texto } };
  }

  // cliente ID_Cliente Nombre_Cliente [telefono] [email]
  if (cmd === 'cliente' && partes.length >= 3) {
    const id_cliente = partes[1];
    const resto = partes.slice(2);
    const nombre_cliente = resto.join(' ').split(/\s+(?=\d{10,})|\s+(?=[\w.-]+@)/)[0] || resto.join(' ');
    return {
      tipo: 'cliente',
      datos: { id_cliente, nombre_cliente: nombre_cliente.trim(), mensaje_original: texto },
    };
  }

  // proveedor ID_Proveedor Nombre_Proveedor [telefono] [tipo_producto]
  if (cmd === 'proveedor' && partes.length >= 3) {
    const id_proveedor = partes[1];
    const nombre_proveedor = partes.slice(2).join(' ');
    return {
      tipo: 'proveedor',
      datos: { id_proveedor, nombre_proveedor, mensaje_original: texto },
    };
  }

  // gasto categoria monto [descripcion...]
  if (cmd === 'gasto' && partes.length >= 3) {
    const categoria = partes[1];
    const montoStr = partes[2]?.replace(/[^0-9.]/g, '') || '0';
    const monto = parseFloat(montoStr) || 0;
    const descripcion = partes.slice(3).join(' ') || null;
    return {
      tipo: 'gasto',
      datos: { categoria, monto, descripcion, mensaje_original: texto },
    };
  }

  if (cmd === 'compra' && partes.length >= 4) {
    const [_, producto, montoStr, proveedor] = partes;
    const monto = parseFloat(montoStr?.replace(/[^0-9.]/g, '') || '0');
    return {
      tipo: 'compra',
      datos: { producto, monto, proveedor: partes.slice(3).join(' ') || proveedor, mensaje_original: texto },
    };
  }

  if ((cmd === 'venta' || cmd === 'cobro') && partes.length >= 4) {
    const [_, cliente, montoStr] = partes;
    const monto = parseFloat(montoStr?.replace(/[^0-9.]/g, '') || '0');
    return {
      tipo: 'venta',
      datos: { cliente: partes.slice(1, -1).join(' '), monto, mensaje_original: texto },
    };
  }

  if (cmd === 'promesa' && partes.length >= 5) {
    const tipoPromesa = partes[1] === 'cliente' ? 'promesa_cliente' : 'promesa_proveedor';
    const entidad = partes[2];
    const monto = parseFloat(partes[3]?.replace(/[^0-9.]/g, '') || '0');
    const fecha = partes[4];
    return {
      tipo: tipoPromesa,
      datos: { entidad, monto, fecha_prometida: fecha, mensaje_original: texto },
    };
  }

  if (cmd === 'contenedor' && partes.length >= 4) {
    const numero = partes[1];
    const destino = partes[2];
    const eta = partes[3];
    return {
      tipo: 'contenedor',
      datos: { numero, destino, eta, mensaje_original: texto },
    };
  }

  return { tipo: 'nota', datos: { texto } };
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await req.json();
    const mensaje = String(body.mensaje ?? body.text ?? '').trim();
    if (!mensaje) {
      return NextResponse.json({ error: 'Mensaje vacío' }, { status: 400 });
    }

    const empresaId = getEmpresaIdFromRequest(req);
    const { tipo, datos } = parseMensaje(mensaje);

    // Insertar en tablas específicas cuando aplique
    if (tipo === 'cliente' && datos.id_cliente && datos.nombre_cliente) {
      const clientePayload: Record<string, unknown> = {
        id_cliente: String(datos.id_cliente).trim(),
        nombre_cliente: String(datos.nombre_cliente).trim(),
        updated_at: new Date().toISOString(),
      };
      if (empresaId) clientePayload.empresa_id = empresaId;
      const { data: cliente, error: errCliente } = await supabase
        .from('clientes')
        .upsert(clientePayload, { onConflict: 'id_cliente' })
        .select()
        .single();
      if (errCliente) {
        return NextResponse.json({ error: errCliente.message }, { status: 500 });
      }
      const regPayload: Record<string, unknown> = { tipo: 'cliente', mensaje_original: mensaje, datos: { ...datos, parsed: true, cliente_id: cliente?.id }, usuario_id: user.id };
      if (empresaId) regPayload.empresa_id = empresaId;
      const { data: reg } = await supabase.from('registros').insert(regPayload).select('id, tipo, mensaje_original, datos, created_at').single();
      return NextResponse.json({ ok: true, registro: reg, cliente });
    }

    if (tipo === 'proveedor' && datos.id_proveedor && datos.nombre_proveedor) {
      const provPayload: Record<string, unknown> = {
        id_proveedor: String(datos.id_proveedor).trim(),
        nombre_proveedor: String(datos.nombre_proveedor).trim(),
        updated_at: new Date().toISOString(),
      };
      if (empresaId) provPayload.empresa_id = empresaId;
      const { data: proveedor, error: errProv } = await supabase
        .from('proveedores')
        .upsert(provPayload, { onConflict: 'id_proveedor' })
        .select()
        .single();
      if (errProv) {
        return NextResponse.json({ error: errProv.message }, { status: 500 });
      }
      const regPayloadProv: Record<string, unknown> = { tipo: 'proveedor', mensaje_original: mensaje, datos: { ...datos, parsed: true, proveedor_id: proveedor?.id }, usuario_id: user.id };
      if (empresaId) regPayloadProv.empresa_id = empresaId;
      const { data: reg } = await supabase.from('registros').insert(regPayloadProv).select('id, tipo, mensaje_original, datos, created_at').single();
      return NextResponse.json({ ok: true, registro: reg, proveedor });
    }

    if (tipo === 'gasto' && datos.categoria != null && datos.monto != null) {
      const gastoPayload: Record<string, unknown> = {
        categoria: String(datos.categoria).trim(),
        monto: Number(datos.monto) || 0,
        descripcion: datos.descripcion ? String(datos.descripcion).trim() : null,
        usuario_id: user.id,
      };
      if (empresaId) gastoPayload.empresa_id = empresaId;
      const { data: gasto, error: errGasto } = await supabase
        .from('gastos')
        .insert(gastoPayload)
        .select()
        .single();
      if (errGasto) {
        return NextResponse.json({ error: errGasto.message }, { status: 500 });
      }
      const regPayloadGasto: Record<string, unknown> = { tipo: 'gasto', mensaje_original: mensaje, datos: { ...datos, parsed: true, gasto_id: gasto?.id }, usuario_id: user.id };
      if (empresaId) regPayloadGasto.empresa_id = empresaId;
      const { data: reg } = await supabase.from('registros').insert(regPayloadGasto).select('id, tipo, mensaje_original, datos, created_at').single();
      return NextResponse.json({ ok: true, registro: reg, gasto });
    }

    // Resto: insertar solo en registros
    const regPayloadRest: Record<string, unknown> = { tipo, mensaje_original: mensaje, datos: { ...datos, parsed: true }, usuario_id: user.id };
    if (empresaId) regPayloadRest.empresa_id = empresaId;
    const { data: row, error } = await supabase
      .from('registros')
      .insert(regPayloadRest)
      .select('id, tipo, mensaje_original, datos, created_at')
      .single();

    if (error) {
      console.error('Error insertando registro:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, registro: row });
  } catch (err) {
    console.error('API registros:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error al registrar' },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const empresaId = getEmpresaIdFromRequest(req);
    let query = supabase.from('registros').select('id, tipo, mensaje_original, datos, created_at');
    if (empresaId) query = query.eq('empresa_id', empresaId);
    const { data, error } = await query.order('created_at', { ascending: false }).limit(50);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ registros: data ?? [] });
  } catch (err) {
    console.error('API registros GET:', err);
    return NextResponse.json({ error: 'Error al obtener registros' }, { status: 500 });
  }
}
