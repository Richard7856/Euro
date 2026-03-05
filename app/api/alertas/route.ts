import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getEmpresaIdFromRequest } from '@/lib/empresaApi';

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const empresaId = getEmpresaIdFromRequest(req);

    // 1. Compras con campos críticos incompletos
    let comprasQuery = supabase
      .from('compras')
      .select('id, id_compra, producto_nombre, id_proveedor, fecha_compra, cantidad_compra, costo_unitario, subtotal, estado_pago, fecha_vencimiento')
      .or('producto_nombre.is.null,id_proveedor.is.null,cantidad_compra.is.null,costo_unitario.is.null')
      .order('fecha_compra', { ascending: false })
      .limit(100);

    if (empresaId) comprasQuery = comprasQuery.eq('empresa_id', empresaId);
    const { data: comprasIncompletas } = await comprasQuery;

    // 2. Compras pendientes de pago con fecha vencida
    const hoy = new Date().toISOString().split('T')[0];
    let vencidasQuery = supabase
      .from('compras')
      .select('id, id_compra, producto_nombre, id_proveedor, fecha_vencimiento, subtotal, estado_pago')
      .eq('estado_pago', 'Pendiente')
      .lt('fecha_vencimiento', hoy)
      .not('fecha_vencimiento', 'is', null)
      .order('fecha_vencimiento', { ascending: true })
      .limit(100);

    if (empresaId) vencidasQuery = vencidasQuery.eq('empresa_id', empresaId);
    const { data: comprasVencidas } = await vencidasQuery;

    // Calcular pendiente real consultando pagos_compra
    const ids = (comprasVencidas ?? []).map((c) => c.id_compra).filter(Boolean) as string[];
    let pagadoMap: Record<string, number> = {};
    if (ids.length > 0) {
      const { data: pagos } = await supabase
        .from('pagos_compra')
        .select('id_compra, monto_pago')
        .in('id_compra', ids);
      (pagos ?? []).forEach((p) => {
        pagadoMap[p.id_compra] = (pagadoMap[p.id_compra] ?? 0) + Number(p.monto_pago ?? 0);
      });
    }

    const comprasVencidasConDias = (comprasVencidas ?? []).map((c) => {
      const venc = new Date(c.fecha_vencimiento);
      const diasVencido = Math.floor((Date.now() - venc.getTime()) / (1000 * 60 * 60 * 24));
      const pagado = pagadoMap[c.id_compra] ?? 0;
      const pendiente_mxn = Math.max(0, (c.subtotal ?? 0) - pagado);
      return { ...c, dias_vencido: diasVencido, pendiente_mxn };
    });

    // 3. Perfiles incompletos — requiere admin client (bypassa RLS)
    const adminClient = await createAdminClient();
    const { data: perfilesIncompletos } = await adminClient
      .from('profiles')
      .select('id, email, nombre, rol, activo')
      .or('nombre.is.null,activo.eq.false')
      .order('created_at', { ascending: false })
      .limit(50);

    return NextResponse.json({
      compras_incompletas: comprasIncompletas ?? [],
      compras_vencidas: comprasVencidasConDias,
      perfiles_incompletos: perfilesIncompletos ?? [],
      totales: {
        compras_incompletas: (comprasIncompletas ?? []).length,
        compras_vencidas: comprasVencidasConDias.length,
        perfiles_incompletos: (perfilesIncompletos ?? []).length,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
