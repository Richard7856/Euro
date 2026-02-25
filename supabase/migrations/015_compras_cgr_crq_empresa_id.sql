-- Asignar empresa_id a compras de Cigarros (CGR) y Garritas (CRQ) para que se vean al elegir esa empresa.
-- UUIDs según lib/empresaApi.ts y 001_empresas_multi_tenant.sql

-- Cigarros
UPDATE public.compras
SET empresa_id = 'a0000000-0000-4000-8000-000000000003'
WHERE id_producto = 'CGR' AND (empresa_id IS NULL OR empresa_id <> 'a0000000-0000-4000-8000-000000000003');

-- Garritas
UPDATE public.compras
SET empresa_id = 'a0000000-0000-4000-8000-000000000002'
WHERE id_producto = 'CRQ' AND (empresa_id IS NULL OR empresa_id <> 'a0000000-0000-4000-8000-000000000002');

-- Si pagos_compra tiene empresa_id, alinearlo con la compra
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'pagos_compra' AND column_name = 'empresa_id'
  ) THEN
    UPDATE public.pagos_compra pc
    SET empresa_id = c.empresa_id
    FROM public.compras c
    WHERE c.id_compra = pc.id_compra
      AND c.id_producto IN ('CGR', 'CRQ')
      AND (pc.empresa_id IS DISTINCT FROM c.empresa_id);
  END IF;
END $$;
