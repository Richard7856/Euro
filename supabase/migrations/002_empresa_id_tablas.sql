-- =============================================================================
-- Añadir empresa_id a tablas de negocio para filtrar por empresa
-- Ejecutar después de 001_empresas_multi_tenant.sql (Supabase → SQL Editor)
-- =============================================================================

-- clientes
ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS empresa_id uuid REFERENCES public.empresas(id);
CREATE INDEX IF NOT EXISTS idx_clientes_empresa ON public.clientes(empresa_id);

-- proveedores
ALTER TABLE public.proveedores
  ADD COLUMN IF NOT EXISTS empresa_id uuid REFERENCES public.empresas(id);
CREATE INDEX IF NOT EXISTS idx_proveedores_empresa ON public.proveedores(empresa_id);

-- gastos
ALTER TABLE public.gastos
  ADD COLUMN IF NOT EXISTS empresa_id uuid REFERENCES public.empresas(id);
CREATE INDEX IF NOT EXISTS idx_gastos_empresa ON public.gastos(empresa_id);
