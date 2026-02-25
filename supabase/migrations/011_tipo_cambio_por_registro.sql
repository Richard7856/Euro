-- Tipo de cambio USD usado al guardar cada registro.
-- El rate global solo aplica a registros nuevos; los existentes conservan su rate (no se recalculan).

-- compras: rate usado para convertir subtotal a MXN si venía en USD
ALTER TABLE public.compras ADD COLUMN IF NOT EXISTS tipo_cambio_usd numeric;
UPDATE public.compras SET tipo_cambio_usd = 18 WHERE tipo_cambio_usd IS NULL;
COMMENT ON COLUMN public.compras.tipo_cambio_usd IS 'Tipo de cambio USD->MXN al guardar; solo afecta visualización en USD.';

-- gastos
ALTER TABLE public.gastos ADD COLUMN IF NOT EXISTS tipo_cambio_usd numeric;
UPDATE public.gastos SET tipo_cambio_usd = 18 WHERE tipo_cambio_usd IS NULL;
COMMENT ON COLUMN public.gastos.tipo_cambio_usd IS 'Tipo de cambio USD->MXN al guardar; solo afecta visualización en USD.';

-- precios_proveedor (precio puede estar en USD)
ALTER TABLE public.precios_proveedor ADD COLUMN IF NOT EXISTS tipo_cambio_usd numeric;
UPDATE public.precios_proveedor SET tipo_cambio_usd = 18 WHERE tipo_cambio_usd IS NULL;
COMMENT ON COLUMN public.precios_proveedor.tipo_cambio_usd IS 'Tipo de cambio USD->MXN al guardar; solo afecta visualización en USD.';

-- precios_venta
ALTER TABLE public.precios_venta ADD COLUMN IF NOT EXISTS tipo_cambio_usd numeric;
UPDATE public.precios_venta SET tipo_cambio_usd = 18 WHERE tipo_cambio_usd IS NULL;
COMMENT ON COLUMN public.precios_venta.tipo_cambio_usd IS 'Tipo de cambio USD->MXN al guardar; solo afecta visualización en USD.';
