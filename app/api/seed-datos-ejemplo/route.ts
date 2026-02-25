import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/seed-datos-ejemplo
 * Inserta datos de ejemplo en cobros, compras, gastos (y algo de pedidos/productos si hace falta).
 * Solo admin. Útil cuando no tienes Sheets configurado y quieres ver el dashboard con datos.
 */
export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const { data: profile } = await supabase.from('profiles').select('rol').eq('id', user.id).single();
    if (profile?.rol !== 'admin') {
      return NextResponse.json({ error: 'Solo administradores pueden cargar datos de ejemplo' }, { status: 403 });
    }

    const counts = { cobros: 0, compras: 0, gastos: 0, pedidos: 0, productos: 0 };

    const fechas = ['2025-01-15', '2025-02-10', '2025-03-05', '2025-04-20', '2025-05-12', '2025-06-08', '2025-07-22', '2025-08-14', '2025-09-30', '2025-10-05', '2025-11-18', '2025-12-01'];
    const productos = ['P-001', 'P-002', 'P-003'];
    const clientes = ['CLI-A', 'CLI-B', 'CLI-C'];
    const proveedores = ['PROV-X', 'PROV-Y'];

    for (let i = 0; i < 15; i++) {
      const { error } = await supabase.from('cobros').insert({
        id_venta: `V-${1000 + i}`,
        id_producto: productos[i % 3],
        canal_cobro: i % 3 === 0 ? 'DANTE' : i % 3 === 1 ? 'EFECTIVO' : 'TRANSFERENCIA',
        fecha_pago: fechas[i % fechas.length],
        metodo_pago: i % 2 === 0 ? 'TRANSFERENCIA' : 'EFECTIVO',
        monto_pagado: 5000 + i * 1200 + (i % 5) * 800,
      });
      if (!error) counts.cobros++;
    }

    for (let i = 0; i < 12; i++) {
      const { error } = await supabase.from('compras').insert({
        id_compra: `C-${2000 + i}`,
        id_producto: productos[i % 3],
        producto_nombre: `Producto ${productos[i % 3]}`,
        fecha_compra: fechas[i % fechas.length],
        id_proveedor: proveedores[i % 2],
        tipo_compra: i % 3 === 0 ? 'Crédito' : 'Contado',
        cantidad_compra: 100 + i * 20,
        costo_unitario: 50 + (i % 4) * 10,
        subtotal: (100 + i * 20) * (50 + (i % 4) * 10),
        estado_pago: i % 4 === 0 ? 'PAGADO' : 'Pendiente',
      });
      if (!error) counts.compras++;
    }

    const categorias = ['fumigacion', 'logistica', 'almacenaje', 'operativo'];
    for (let i = 0; i < 10; i++) {
      const { error } = await supabase.from('gastos').insert({
        categoria: categorias[i % categorias.length],
        monto: 2000 + i * 500 + (i % 3) * 300,
        descripcion: `Gasto ejemplo ${i + 1}`,
        fecha: fechas[i % fechas.length],
        usuario_id: user.id,
      });
      if (!error) counts.gastos++;
    }

    for (let i = 0; i < 5; i++) {
      await supabase.from('pedidos').upsert({
        id_pedido: `PED-${3000 + i}`,
        id_venta: `V-${1000 + i}`,
        id_cliente: clientes[i % 3],
        fecha_pedido: fechas[i % fechas.length],
        canal_venta: 'Dante',
        total_pedido: 8000 + i * 1000,
        estado_pedido: i % 2 === 0 ? 'Entregado' : 'Pendiente',
      }, { onConflict: 'id_pedido' });
      counts.pedidos++;
    }

    const nombresProductos = ['Café verde', 'Cacao', 'Nuez'];
    for (let i = 0; i < 3; i++) {
      await supabase.from('productos').upsert({
        id_producto: productos[i],
        nombre_producto: nombresProductos[i],
        cantidad_disponible: 500 + i * 200,
        valor_unitario_promedio: 80 + i * 15,
        valor_total: (500 + i * 200) * (80 + i * 15),
      }, { onConflict: 'id_producto' });
      counts.productos++;
    }

    return NextResponse.json({
      ok: true,
      message: 'Datos de ejemplo cargados',
      counts,
    });
  } catch (err) {
    console.error('API seed-datos-ejemplo:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error al cargar datos de ejemplo' },
      { status: 500 }
    );
  }
}
