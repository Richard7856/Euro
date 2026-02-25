-- =============================================================================
-- Empresa_id en el resto de tablas de negocio (control independiente por empresa)
-- Ejecutar después de 001 y 002 (Supabase → SQL Editor)
-- =============================================================================

-- cobros (ventas/cobros)
ALTER TABLE public.cobros
  ADD COLUMN IF NOT EXISTS empresa_id uuid REFERENCES public.empresas(id);
CREATE INDEX IF NOT EXISTS idx_cobros_empresa ON public.cobros(empresa_id);

-- pedidos
ALTER TABLE public.pedidos
  ADD COLUMN IF NOT EXISTS empresa_id uuid REFERENCES public.empresas(id);
CREATE INDEX IF NOT EXISTS idx_pedidos_empresa ON public.pedidos(empresa_id);

-- envios
ALTER TABLE public.envios
  ADD COLUMN IF NOT EXISTS empresa_id uuid REFERENCES public.empresas(id);
CREATE INDEX IF NOT EXISTS idx_envios_empresa ON public.envios(empresa_id);

-- compras
ALTER TABLE public.compras
  ADD COLUMN IF NOT EXISTS empresa_id uuid REFERENCES public.empresas(id);
CREATE INDEX IF NOT EXISTS idx_compras_empresa ON public.compras(empresa_id);

-- pagos_compra
ALTER TABLE public.pagos_compra
  ADD COLUMN IF NOT EXISTS empresa_id uuid REFERENCES public.empresas(id);
CREATE INDEX IF NOT EXISTS idx_pagos_compra_empresa ON public.pagos_compra(empresa_id);

-- productos (inventario)
ALTER TABLE public.productos
  ADD COLUMN IF NOT EXISTS empresa_id uuid REFERENCES public.empresas(id);
CREATE INDEX IF NOT EXISTS idx_productos_empresa ON public.productos(empresa_id);

-- registros (bitácora / chat)
ALTER TABLE public.registros
  ADD COLUMN IF NOT EXISTS empresa_id uuid REFERENCES public.empresas(id);
CREATE INDEX IF NOT EXISTS idx_registros_empresa ON public.registros(empresa_id);
