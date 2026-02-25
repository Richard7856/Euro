-- Bodegas (almacenes). Inventario por bodega y movimientos (entradas/salidas).
-- Ejecutar en Supabase SQL Editor o con supabase db push.

-- Bodegas
CREATE TABLE IF NOT EXISTS public.bodegas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  codigo text,
  direccion text,
  activo boolean NOT NULL DEFAULT true,
  empresa_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bodegas_empresa ON public.bodegas(empresa_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_bodegas_codigo_empresa ON public.bodegas(empresa_id, codigo) WHERE codigo IS NOT NULL AND codigo <> '';

COMMENT ON TABLE public.bodegas IS 'Almacenes o bodegas donde se guarda inventario';

-- Inventario por bodega y producto (stock actual)
CREATE TABLE IF NOT EXISTS public.inventario_bodega (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bodega_id uuid NOT NULL REFERENCES public.bodegas(id) ON DELETE CASCADE,
  id_producto text NOT NULL,
  cantidad numeric NOT NULL DEFAULT 0 CHECK (cantidad >= 0),
  valor_unitario_promedio numeric NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(bodega_id, id_producto)
);

CREATE INDEX IF NOT EXISTS idx_inventario_bodega_bodega ON public.inventario_bodega(bodega_id);
CREATE INDEX IF NOT EXISTS idx_inventario_bodega_producto ON public.inventario_bodega(id_producto);

COMMENT ON TABLE public.inventario_bodega IS 'Stock actual por bodega y producto';

-- Movimientos de inventario (entradas, salidas, ajustes, traslados)
CREATE TYPE public.tipo_movimiento AS ENUM ('entrada', 'salida', 'ajuste', 'traslado');
CREATE TYPE public.referencia_movimiento AS ENUM ('compra', 'venta', 'ajuste', 'traslado', 'inicial', 'manual');

CREATE TABLE IF NOT EXISTS public.movimientos_inventario (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bodega_id uuid NOT NULL REFERENCES public.bodegas(id) ON DELETE CASCADE,
  id_producto text NOT NULL,
  tipo public.tipo_movimiento NOT NULL,
  cantidad numeric NOT NULL CHECK (cantidad > 0),
  unidad text NOT NULL DEFAULT 'kg',
  referencia_tipo public.referencia_movimiento,
  referencia_id text,
  observaciones text,
  usuario_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  empresa_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_movimientos_bodega ON public.movimientos_inventario(bodega_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_producto ON public.movimientos_inventario(id_producto);
CREATE INDEX IF NOT EXISTS idx_movimientos_created ON public.movimientos_inventario(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_movimientos_empresa ON public.movimientos_inventario(empresa_id);

COMMENT ON TABLE public.movimientos_inventario IS 'Historial de entradas, salidas y ajustes por bodega';

-- RLS (ajustar según tu política de empresas)
ALTER TABLE public.bodegas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventario_bodega ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimientos_inventario ENABLE ROW LEVEL SECURITY;

-- Políticas básicas: usuarios autenticados pueden leer/escribir (refinar con empresa_id si aplica)
CREATE POLICY "bodegas_select" ON public.bodegas FOR SELECT TO authenticated USING (true);
CREATE POLICY "bodegas_insert" ON public.bodegas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "bodegas_update" ON public.bodegas FOR UPDATE TO authenticated USING (true);
CREATE POLICY "bodegas_delete" ON public.bodegas FOR DELETE TO authenticated USING (true);

CREATE POLICY "inventario_bodega_select" ON public.inventario_bodega FOR SELECT TO authenticated USING (true);
CREATE POLICY "inventario_bodega_insert" ON public.inventario_bodega FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "inventario_bodega_update" ON public.inventario_bodega FOR UPDATE TO authenticated USING (true);
CREATE POLICY "inventario_bodega_delete" ON public.inventario_bodega FOR DELETE TO authenticated USING (true);

CREATE POLICY "movimientos_select" ON public.movimientos_inventario FOR SELECT TO authenticated USING (true);
CREATE POLICY "movimientos_insert" ON public.movimientos_inventario FOR INSERT TO authenticated WITH CHECK (true);

-- Trigger para updated_at en bodegas
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS bodegas_updated_at ON public.bodegas;
CREATE TRIGGER bodegas_updated_at
  BEFORE UPDATE ON public.bodegas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS inventario_bodega_updated_at ON public.inventario_bodega;
CREATE TRIGGER inventario_bodega_updated_at
  BEFORE UPDATE ON public.inventario_bodega
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
