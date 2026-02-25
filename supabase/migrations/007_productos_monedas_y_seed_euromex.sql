-- =============================================================================
-- Productos: columnas de moneda y seed Euromex (costos/precios en varias monedas)
-- Tipos de cambio: 1 USD = 18 MXN, 1 EUR = 20 MXN
-- =============================================================================

ALTER TABLE public.productos
  ADD COLUMN IF NOT EXISTS moneda_costo text,
  ADD COLUMN IF NOT EXISTS costo_referencia numeric,
  ADD COLUMN IF NOT EXISTS moneda_venta text,
  ADD COLUMN IF NOT EXISTS precio_venta_referencia numeric;

DO $$
DECLARE
  euromex_id uuid := 'a0000000-0000-4000-8000-000000000001';
BEGIN
  -- Seed productos Euromex (valor_* en MXN convertidos con 18 USD, 20 EUR)
  INSERT INTO public.productos (
    empresa_id, id_producto, nombre_producto, categoria, cantidad_disponible,
    valor_unitario_promedio, valor_total, moneda_costo, costo_referencia, moneda_venta, precio_venta_referencia
  ) VALUES
    (euromex_id, 'ALM-002', 'Almendra de segunda calidad', 'Almendra', 0, 55.80, 0, 'USD', 3.10, 'MXN', 135.00),
    (euromex_id, 'PST-GRN-002', 'Pistache en grano de tercera calidad', 'Pistache', 0, 193.50, 0, 'USD', 10.75, 'MXN', 200.00),
    (euromex_id, 'PST-ENT-002', 'Pistache de segunda calidad (entero)', 'Pistache', 0, 85.50, 0, 'USD', 4.75, 'MXN', 110.00),
    (euromex_id, 'LMN-001', 'Limon de primera calidad', 'Limón', 0, 30.40, 0, 'MXN', 30.40, 'EUR', 9.00),
    (euromex_id, 'PST-MRC-001', 'Pistache de Marruecos', 'Pistache', 0, 101.90, 0, 'MXN', 101.90, 'EUR', 16.00),
    (euromex_id, 'DTL-003', 'Datil', 'Dátil', 0, 103.00, 0, 'MXN', 103.00, 'EUR', 6.00)
  ON CONFLICT (id_producto) DO UPDATE SET
    nombre_producto = EXCLUDED.nombre_producto,
    categoria = EXCLUDED.categoria,
    valor_unitario_promedio = EXCLUDED.valor_unitario_promedio,
    valor_total = EXCLUDED.valor_total,
    moneda_costo = EXCLUDED.moneda_costo,
    costo_referencia = EXCLUDED.costo_referencia,
    moneda_venta = EXCLUDED.moneda_venta,
    precio_venta_referencia = EXCLUDED.precio_venta_referencia,
    empresa_id = EXCLUDED.empresa_id;

  -- Vino (sin ID en imagen; usar ID genérico)
  INSERT INTO public.productos (
    empresa_id, id_producto, nombre_producto, categoria, cantidad_disponible,
    valor_unitario_promedio, valor_total, moneda_costo, costo_referencia, moneda_venta, precio_venta_referencia
  ) VALUES
    (euromex_id, 'VINO-001', 'Vino', 'Vino', 0, 220.00, 0, 'EUR', 11.00, 'MXN', 600.00)
  ON CONFLICT (id_producto) DO UPDATE SET
    nombre_producto = EXCLUDED.nombre_producto,
    categoria = EXCLUDED.categoria,
    valor_unitario_promedio = EXCLUDED.valor_unitario_promedio,
    valor_total = EXCLUDED.valor_total,
    moneda_costo = EXCLUDED.moneda_costo,
    costo_referencia = EXCLUDED.costo_referencia,
    moneda_venta = EXCLUDED.moneda_venta,
    precio_venta_referencia = EXCLUDED.precio_venta_referencia,
    empresa_id = EXCLUDED.empresa_id;
END $$;
