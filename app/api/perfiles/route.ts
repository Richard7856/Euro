import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

/** GET: lista de perfiles (solo admin). Usa admin client para listar todos (RLS solo permite ver la propia fila). */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { data: myProfile } = await supabase
      .from('profiles')
      .select('rol')
      .eq('id', user.id)
      .single();

    if (myProfile?.rol !== 'admin') {
      return NextResponse.json({ error: 'Solo administradores pueden ver perfiles' }, { status: 403 });
    }

    const admin = await createAdminClient();
    const { data: profiles, error } = await admin
      .from('profiles')
      .select('id, email, nombre, rol, activo, module_overrides, created_at, updated_at')
      .order('nombre', { ascending: true, nullsFirst: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ perfiles: profiles ?? [] });
  } catch (err) {
    console.error('API perfiles GET:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error al listar perfiles' },
      { status: 500 }
    );
  }
}
