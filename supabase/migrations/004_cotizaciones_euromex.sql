-- =============================================================================
-- Cotizador Euromex: precios de venta y cotizaciones guardadas
-- Solo se usa para empresa Euromex (empresa_id = euromex).
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.cotizaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id),
  producto_concepto text NOT NULL,
  cantidad numeric NOT NULL CHECK (cantidad > 0),
  unidad text NOT NULL DEFAULT 'kg',
  costo_compra_total_usd numeric NOT NULL DEFAULT 0,
  gastos_extra jsonb NOT NULL DEFAULT '[]',
  tipo_cambio_mxn numeric NOT NULL DEFAULT 20,
  moneda_venta text NOT NULL DEFAULT 'USD',
  inversion_final_usd numeric NOT NULL DEFAULT 0,
  costo_unitario_final_usd numeric NOT NULL DEFAULT 0,
  modo_margen text NOT NULL DEFAULT 'porcentaje',
  margen_porcentaje_deseado numeric,
  precio_venta_unitario numeric,
  margen_real_porcentaje numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cotizaciones_empresa ON public.cotizaciones(empresa_id);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_created ON public.cotizaciones(created_at DESC);

COMMENT ON COLUMN public.cotizaciones.gastos_extra IS 'Array de { concepto, monto_usd, nota }';
COMMENT ON COLUMN public.cotizaciones.modo_margen IS 'porcentaje = usuario puso % ganancia; precio_fijo = usuario puso precio y se calcula %';
COMMENT ON COLUMN public.cotizaciones.margen_real_porcentaje IS 'Margen resultante cuando modo_margen = precio_fijo';

ALTER TABLE public.cotizaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cotizaciones_select_own_empresa"
  ON public.cotizaciones FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "cotizaciones_insert_authenticated"
  ON public.cotizaciones FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "cotizaciones_update_authenticated"
  ON public.cotizaciones FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "cotizaciones_delete_authenticated"
  ON public.cotizaciones FOR DELETE
  TO authenticated
  USING (true);
