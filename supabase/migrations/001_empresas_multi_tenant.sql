-- =============================================================================
-- Multi-tenant: tabla empresas y columna empresa_id en tablas de negocio
-- Ejecutar en Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- =============================================================================

-- Tabla de empresas (Euromex, Garritas, Cigarros)
CREATE TABLE IF NOT EXISTS public.empresas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  nombre text NOT NULL,
  subtitulo text,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Índice para filtrar por slug
CREATE INDEX IF NOT EXISTS idx_empresas_slug ON public.empresas(slug);

-- Insertar las 3 empresas (ids fijos para poder referenciar desde el app)
INSERT INTO public.empresas (id, slug, nombre, subtitulo, activo)
VALUES
  ('a0000000-0000-4000-8000-000000000001'::uuid, 'euromex', 'Euromex', 'Import/Export', true),
  ('a0000000-0000-4000-8000-000000000002'::uuid, 'garritas', 'Garritas', 'Croquetas', true),
  ('a0000000-0000-4000-8000-000000000003'::uuid, 'cigarros', 'Cigarros', 'Cigarros', true)
ON CONFLICT (slug) DO NOTHING;

-- RLS: lectura pública de empresas (solo slug, nombre, subtitulo para el selector)
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "empresas_select_authenticated"
  ON public.empresas FOR SELECT
  TO authenticated
  USING (activo = true);

-- =============================================================================
-- Añadir empresa_id a tablas de negocio (opcional: ejecutar si quieres datos por empresa)
-- =============================================================================
-- Descomenta y adapta los nombres de tabla según tu esquema:

/*
-- Ejemplo: clientes
ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS empresa_id uuid REFERENCES public.empresas(id);
CREATE INDEX IF NOT EXISTS idx_clientes_empresa ON public.clientes(empresa_id);

-- Ejemplo: proveedores
ALTER TABLE public.proveedores
  ADD COLUMN IF NOT EXISTS empresa_id uuid REFERENCES public.empresas(id);
CREATE INDEX IF NOT EXISTS idx_proveedores_empresa ON public.proveedores(empresa_id);

-- Ejemplo: gastos
ALTER TABLE public.gastos
  ADD COLUMN IF NOT EXISTS empresa_id uuid REFERENCES public.empresas(id);
CREATE INDEX IF NOT EXISTS idx_gastos_empresa ON public.gastos(empresa_id);
*/

-- Perfiles: permitir vincular usuario a empresa(s) más adelante
-- ALTER TABLE public.profiles
--   ADD COLUMN IF NOT EXISTS empresa_id uuid REFERENCES public.empresas(id);
