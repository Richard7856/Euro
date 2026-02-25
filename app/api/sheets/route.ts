import { NextResponse } from 'next/server';
import { fetchAllSheetsData } from '@/lib/googleSheets';
import {
  mapVentas,
  mapPedidos,
  mapEnvios,
  mapCompras,
  mapGastos,
  mapPagos,
  mapCuentasPorCobrar,
  mapInventario,
} from '@/lib/sheetsMappers';

export async function GET() {
  try {
    const raw = await fetchAllSheetsData();

    if ('error' in raw) {
      return NextResponse.json({ error: raw.error }, { status: 500 });
    }

    const ventas = mapVentas(raw.ventas || []);
    const pedidos = mapPedidos(raw.pedidos || []);
    const envios = mapEnvios(raw.envios || []);
    const pagos = mapPagos(raw.pagos || []);
    let compras = mapCompras(raw.compras || []);
    const pagadoPorCompra = new Map<string, number>();
    for (const p of pagos) {
      pagadoPorCompra.set(p.id_compra, (pagadoPorCompra.get(p.id_compra) ?? 0) + p.monto_pago);
    }
    compras = compras.map(c => {
      const pagado = pagadoPorCompra.get(c.id_compra) ?? 0;
      return { ...c, pagado_mxn: pagado, pendiente_mxn: Math.max(0, c.inversion_mxn - pagado) };
    });
    const gastos = mapGastos(raw.gastos || []);
    let cuentasPorCobrar = mapCuentasPorCobrar(raw.cuentasPorCobrar || []);
    const cobradoPorCliente = new Map<string, number>();
    const ventaToCliente = new Map<string, string>();
    for (const p of pedidos) {
      if (p.id_venta && p.id_cliente) ventaToCliente.set(p.id_venta, p.id_cliente);
    }
    for (const v of ventas) {
      const cid = ventaToCliente.get(v.id_venta);
      if (cid) cobradoPorCliente.set(cid, (cobradoPorCliente.get(cid) ?? 0) + v.monto_pagado);
    }
    cuentasPorCobrar = cuentasPorCobrar.map(c => {
      const cobrado = cobradoPorCliente.get(c.id_cliente) ?? 0;
      return { ...c, monto_cobrado: cobrado, monto_pendiente: Math.max(0, c.monto_total - cobrado) };
    });
    const inventario = mapInventario(raw.inventario || []);

    return NextResponse.json({
      ventas,
      pedidos,
      envios,
      compras,
      gastos,
      pagos,
      cuentasPorCobrar,
      inventario,
      _meta: {
        counts: {
          ventas: ventas.length,
          pedidos: pedidos.length,
          envios: envios.length,
          compras: compras.length,
          gastos: gastos.length,
          pagos: pagos.length,
          cuentasPorCobrar: cuentasPorCobrar.length,
          inventario: inventario.length,
        },
      },
    });
  } catch (err) {
    console.error('API /api/sheets error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error al obtener datos de Sheets' },
      { status: 500 }
    );
  }
}
