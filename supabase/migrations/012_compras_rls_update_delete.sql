-- Permitir que usuarios autenticados puedan actualizar y eliminar compras
-- (si la tabla compras ya tiene RLS, añade estas políticas; si no, las crea)

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'compras') THEN
    RETURN;
  END IF;

  IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.compras'::regclass) THEN
    ALTER TABLE public.compras ENABLE ROW LEVEL SECURITY;
  END IF;

  DROP POLICY IF EXISTS "compras_update_authenticated" ON public.compras;
  CREATE POLICY "compras_update_authenticated"
    ON public.compras FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

  DROP POLICY IF EXISTS "compras_delete_authenticated" ON public.compras;
  CREATE POLICY "compras_delete_authenticated"
    ON public.compras FOR DELETE
    TO authenticated
    USING (true);
END $$;
