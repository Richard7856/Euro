-- =============================================================================
-- Fix: infinite recursion in RLS policies for table "profiles" (error 42P17)
-- =============================================================================
-- Causa: una política en profiles hacía SELECT en la misma tabla (ej. "admin ve
-- todos") y eso dispara RLS otra vez → recursión infinita.
--
-- Solución: políticas que SOLO usen auth.uid() = id (cada usuario solo su fila).
-- Las operaciones de admin (ver todos los perfiles, cambiar rol de otros) se
-- hacen en el backend con la service role key (bypasea RLS).
--
-- Cómo aplicar: Supabase Dashboard → SQL Editor → pegar y ejecutar.
-- =============================================================================

-- Quitar todas las políticas actuales de public.profiles (nombres pueden variar)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', r.policyname);
  END LOOP;
END $$;

-- Solo permitir: ver/insertar/actualizar la propia fila (id = auth.uid())
-- Sin ninguna condición que lea de profiles → sin recursión.

CREATE POLICY "profiles_select_own"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "profiles_insert_own"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update_own"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Opcional: si quieres que los usuarios puedan borrar su perfil (poco común)
-- CREATE POLICY "profiles_delete_own"
--   ON public.profiles FOR DELETE TO authenticated USING (id = auth.uid());

-- Asegurar que RLS está activo
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
