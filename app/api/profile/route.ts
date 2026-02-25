import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export type ProfileRole = 'admin' | 'ventas' | 'logistica' | 'finanzas' | 'usuario';

export interface ProfileResponse {
  id: string;
  email: string | null;
  nombre: string | null;
  rol: ProfileRole;
  activo: boolean;
  module_overrides?: Record<string, boolean>;
}

function rowToProfile(row: Record<string, unknown>, fallbackEmail: string | null): ProfileResponse {
  const rol = (row.rol ?? row.role ?? 'usuario') as ProfileRole;
  const activo = row.activo !== undefined ? !!row.activo : row.is_active !== undefined ? !!row.is_active : row.active !== undefined ? !!row.active : true;
  return {
    id: String(row.id),
    email: (row.email as string | null) ?? fallbackEmail,
    nombre: (row.nombre ?? row.full_name ?? row.name ?? null) as string | null,
    rol: ['admin', 'ventas', 'logistica', 'finanzas', 'usuario'].includes(rol) ? rol : 'usuario',
    activo,
    module_overrides: (typeof row.module_overrides === 'object' && row.module_overrides !== null && !Array.isArray(row.module_overrides))
      ? (row.module_overrides as Record<string, boolean>)
      : {},
  };
}

/** GET: perfil del usuario autenticado (incluye rol) */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.error('API profile GET select error:', error.code, error.message);
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 500 }
      );
    }

    if (!profile) {
      const { error: insertErr } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email ?? null,
          nombre: null,
          rol: 'usuario',
          activo: true,
        });
      if (insertErr) {
        console.error('API profile GET insert error:', insertErr.code, insertErr.message);
        return NextResponse.json(
          { error: insertErr.message, code: insertErr.code },
          { status: 500 }
        );
      }
      const { data: newProfile, error: selectAfterInsert } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (selectAfterInsert || !newProfile) {
        return NextResponse.json(rowToProfile({
          id: user.id,
          email: user.email ?? null,
          nombre: null,
          rol: 'usuario',
          activo: true,
        }, user.email ?? null));
      }
      return NextResponse.json(rowToProfile(newProfile as Record<string, unknown>, user.email ?? null));
    }

    const p = profile as Record<string, unknown>;
    if (p.activo === false || p.is_active === false || p.active === false) {
      return NextResponse.json({ error: 'Cuenta desactivada' }, { status: 403 });
    }

    return NextResponse.json(rowToProfile(p, user.email ?? null));
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al obtener perfil';
    console.error('API profile GET:', err);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

/** PATCH: actualizar nombre (propio) o rol (admin puede actualizar cualquier usuario si pasa user_id) */
export async function PATCH(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { nombre, rol, user_id: targetUserId, module_overrides } = body;

    const { data: myProfile } = await supabase
      .from('profiles')
      .select('rol')
      .eq('id', user.id)
      .single();

    const isAdmin = myProfile?.rol === 'admin';
    const targetId = targetUserId ? String(targetUserId).trim() : user.id;

    if (targetId !== user.id && !isAdmin) {
      return NextResponse.json({ error: 'Solo admin puede actualizar otros perfiles' }, { status: 403 });
    }

    if (rol !== undefined && targetId !== user.id && !isAdmin) {
      return NextResponse.json({ error: 'Solo admin puede cambiar roles' }, { status: 403 });
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (nombre !== undefined && targetId === user.id) updates.nombre = String(nombre).trim() || null;
    if (rol !== undefined) {
      if (!isAdmin && targetId !== user.id) {
        return NextResponse.json({ error: 'Solo admin puede cambiar roles' }, { status: 403 });
      }
      const allowed = ['admin', 'ventas', 'logistica', 'finanzas', 'usuario'];
      if (!allowed.includes(rol)) {
        return NextResponse.json({ error: 'Rol no válido' }, { status: 400 });
      }
      updates.rol = rol;
    }
    if (module_overrides !== undefined && isAdmin) {
      if (typeof module_overrides !== 'object' || module_overrides === null) {
        return NextResponse.json({ error: 'module_overrides debe ser un objeto' }, { status: 400 });
      }
      const clean: Record<string, boolean> = {};
      for (const [k, v] of Object.entries(module_overrides)) {
        if (typeof k === 'string' && (v === true || v === false)) clean[k] = v;
      }
      updates.module_overrides = clean;
    }

    // Actualizar otro usuario solo es posible con service role (RLS solo permite actualizar la propia fila)
    const clientForUpdate = targetId === user.id ? supabase : await createAdminClient();
    const { data: updated, error } = await clientForUpdate
      .from('profiles')
      .update(updates)
      .eq('id', targetId)
      .select('id, email, nombre, rol, activo')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ...updated, module_overrides: (updated as { module_overrides?: Record<string, boolean> })?.module_overrides ?? {} });
  } catch (err) {
    console.error('API profile PATCH:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error al actualizar perfil' },
      { status: 500 }
    );
  }
}
