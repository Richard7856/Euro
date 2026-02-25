import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/supabase-health
 * Verifica que la conexión a Supabase esté configurada y que el proyecto responda.
 * No requiere autenticación (útil para comprobar env y conectividad).
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('registros')
      .select('id')
      .limit(1)
      .maybeSingle();

    if (error) {
      const rlsOrPolicy = error.code === 'PGRST301' || /policy|row-level|RLS|permission/i.test(error.message);
      return NextResponse.json(
        {
          ok: rlsOrPolicy,
          message: rlsOrPolicy
            ? 'Supabase responde correctamente (la tabla existe; RLS puede requerir sesión para leer).'
            : 'Error al consultar Supabase',
          error: error.message,
          code: error.code,
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: 'Conexión a Supabase correcta',
      table_registros: 'accesible',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const missingEnv = /NEXT_PUBLIC_SUPABASE|env\.local/i.test(message);
    return NextResponse.json(
      {
        ok: false,
        error: message,
        hint: missingEnv
          ? 'Configura NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local'
          : 'Revisa que el proyecto Supabase exista y la URL sea correcta.',
      },
      { status: missingEnv ? 503 : 500 }
    );
  }
}
