-- Producto CGR (Cigarros) y dos compras: COM-CGR-001, COM-CGR-002
-- Ambas pagadas en su totalidad (registro en pagos_compra).

-- 1. Asegurar producto CGR en productos
INSERT INTO public.productos (
  id_producto,
  nombre_producto,
  cantidad_disponible,
  valor_unitario_promedio,
  valor_total
)
VALUES ('CGR', 'Cigarros', 0, NULL, NULL)
ON CONFLICT (id_producto) DO UPDATE SET
  nombre_producto = EXCLUDED.nombre_producto;

-- 2. Compras de cigarros (solo si no existen ya)
INSERT INTO public.compras (
  id_compra,
  id_producto,
  producto_nombre,
  fecha_compra,
  id_proveedor,
  tipo_compra,
  cantidad_compra,
  costo_unitario,
  subtotal,
  moneda,
  estado_pago,
  observaciones,
  tipo_cambio_usd
)
SELECT 'COM-CGR-001', 'CGR', 'Cigarros', '2025-12-22', '0', NULL, 1, 3600, 3600, 'MXN', 'PAGADO', 'Viaticos pagados a Montse para la fabrica de tabaco', 18
WHERE NOT EXISTS (SELECT 1 FROM public.compras WHERE id_compra = 'COM-CGR-001');

INSERT INTO public.compras (
  id_compra,
  id_producto,
  producto_nombre,
  fecha_compra,
  id_proveedor,
  tipo_compra,
  cantidad_compra,
  costo_unitario,
  subtotal,
  moneda,
  estado_pago,
  observaciones,
  tipo_cambio_usd
)
SELECT 'COM-CGR-002', 'CGR', 'Cigarros', '2026-01-28', '0', NULL, 1, 6500, 6500, 'MXN', 'PAGADO', 'Traducción del contrato de Paraguay', 18
WHERE NOT EXISTS (SELECT 1 FROM public.compras WHERE id_compra = 'COM-CGR-002');

-- 3. Pagos para que pendiente quede en 0 (id_pago es NOT NULL, usar gen_random_uuid())
INSERT INTO public.pagos_compra (id_pago, id_compra, fecha_pago, monto_pago, metodo_pago)
SELECT gen_random_uuid(), 'COM-CGR-001', '2025-12-22', 3600, 'Transferencia'
WHERE NOT EXISTS (SELECT 1 FROM public.pagos_compra WHERE id_compra = 'COM-CGR-001');

INSERT INTO public.pagos_compra (id_pago, id_compra, fecha_pago, monto_pago, metodo_pago)
SELECT gen_random_uuid(), 'COM-CGR-002', '2026-01-28', 6500, 'Transferencia'
WHERE NOT EXISTS (SELECT 1 FROM public.pagos_compra WHERE id_compra = 'COM-CGR-002');
