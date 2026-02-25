-- Precios recibidos de proveedores (histórico, varios por día o por semana)
-- y Precios finales de venta (para mostrar al cliente).
-- Recibir desde fuera: POST solo con proveedor + producto/concepto + precio.

CREATE TYPE public.fuente_precio AS ENUM ('manual', 'importacion', 'api', 'email', 'whatsapp');

-- Histórico de precios que envían los proveedores
CREATE TABLE IF NOT EXISTS public.precios_proveedor (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_proveedor text NOT NULL,
  nombre_proveedor text,
  id_producto text,
  concepto text,
  precio numeric NOT NULL CHECK (precio >= 0),
  moneda text NOT NULL DEFAULT 'MXN',
  unidad text DEFAULT 'kg',
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  vigente_desde date,
  vigente_hasta date,
  fuente public.fuente_precio NOT NULL DEFAULT 'manual',
  referencia text,
  observaciones text,
  empresa_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_precios_proveedor_proveedor ON public.precios_proveedor(id_proveedor);
CREATE INDEX IF NOT EXISTS idx_precios_proveedor_producto ON public.precios_proveedor(id_producto);
CREATE INDEX IF NOT EXISTS idx_precios_proveedor_fecha ON public.precios_proveedor(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_precios_proveedor_empresa ON public.precios_proveedor(empresa_id);
CREATE INDEX IF NOT EXISTS idx_precios_proveedor_created ON public.precios_proveedor(created_at DESC);

COMMENT ON TABLE public.precios_proveedor IS 'Precios recibidos de proveedores (varios por día/semana). Ingesta ligera desde fuera.';

-- Precio final de venta por producto (lo que se muestra al cliente)
CREATE TABLE IF NOT EXISTS public.precios_venta (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_producto text NOT NULL,
  nombre_producto text,
  precio_venta numeric NOT NULL CHECK (precio_venta >= 0),
  moneda text NOT NULL DEFAULT 'MXN',
  unidad text DEFAULT 'kg',
  vigente_desde date NOT NULL DEFAULT CURRENT_DATE,
  vigente_hasta date,
  origen text DEFAULT 'manual',
  empresa_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_precios_venta_producto ON public.precios_venta(id_producto);
CREATE INDEX IF NOT EXISTS idx_precios_venta_vigencia ON public.precios_venta(vigente_desde, vigente_hasta);
CREATE INDEX IF NOT EXISTS idx_precios_venta_empresa ON public.precios_venta(empresa_id);

COMMENT ON TABLE public.precios_venta IS 'Precio de venta final por producto; usado para cotizador y mostrar a clientes.';

-- RLS
ALTER TABLE public.precios_proveedor ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.precios_venta ENABLE ROW LEVEL SECURITY;

CREATE POLICY "precios_proveedor_select" ON public.precios_proveedor FOR SELECT TO authenticated USING (true);
CREATE POLICY "precios_proveedor_insert" ON public.precios_proveedor FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "precios_proveedor_update" ON public.precios_proveedor FOR UPDATE TO authenticated USING (true);
CREATE POLICY "precios_proveedor_delete" ON public.precios_proveedor FOR DELETE TO authenticated USING (true);

CREATE POLICY "precios_venta_select" ON public.precios_venta FOR SELECT TO authenticated USING (true);
CREATE POLICY "precios_venta_insert" ON public.precios_venta FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "precios_venta_update" ON public.precios_venta FOR UPDATE TO authenticated USING (true);
CREATE POLICY "precios_venta_delete" ON public.precios_venta FOR DELETE TO authenticated USING (true);

-- Trigger updated_at precios_venta
DROP TRIGGER IF EXISTS precios_venta_updated_at ON public.precios_venta;
CREATE TRIGGER precios_venta_updated_at
  BEFORE UPDATE ON public.precios_venta
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
