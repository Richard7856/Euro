-- Producto CRQ (Garritas / Croqueta) y compras de garritas (fórmulas, dossier, honorarios, marca).
-- pagos_compra con id_pago = gen_random_uuid() para cumplir NOT NULL.

-- 1. Producto CRQ en productos
INSERT INTO public.productos (
  id_producto,
  nombre_producto,
  cantidad_disponible,
  valor_unitario_promedio,
  valor_total
)
VALUES ('CRQ', 'Garritas / Croqueta', 0, NULL, NULL)
ON CONFLICT (id_producto) DO UPDATE SET
  nombre_producto = EXCLUDED.nombre_producto;

-- 2. Compras garritas (solo si no existen)
INSERT INTO public.compras (id_compra, id_producto, producto_nombre, fecha_compra, id_proveedor, tipo_compra, cantidad_compra, costo_unitario, subtotal, moneda, estado_pago, observaciones, tipo_cambio_usd)
SELECT 'COM_CRQ_PMG_001', 'CRQ', 'Garritas', '2025-01-09', '0', NULL, 1, 9000, 9000, 'MXN', 'PAGADO', 'El pago fue el 50% para la formula de perro', 18
WHERE NOT EXISTS (SELECT 1 FROM public.compras WHERE id_compra = 'COM_CRQ_PMG_001');

INSERT INTO public.compras (id_compra, id_producto, producto_nombre, fecha_compra, id_proveedor, tipo_compra, cantidad_compra, costo_unitario, subtotal, moneda, estado_pago, observaciones, tipo_cambio_usd)
SELECT 'COM_CRQ_GTO_001', 'CRQ', 'Garritas', '2025-01-15', '0', NULL, 1, 6500, 6500, 'MXN', 'PAGADO', 'Pago del anticipo de la formula para gatos', 18
WHERE NOT EXISTS (SELECT 1 FROM public.compras WHERE id_compra = 'COM_CRQ_GTO_001');

INSERT INTO public.compras (id_compra, id_producto, producto_nombre, fecha_compra, id_proveedor, tipo_compra, cantidad_compra, costo_unitario, subtotal, moneda, estado_pago, observaciones, tipo_cambio_usd)
SELECT 'COM_CRQ_001', 'CRQ', 'Garritas', '2025-01-20', '0', NULL, 1, 9000, 9000, 'MXN', 'PAGADO', 'Pago restante de la formula para perro', 18
WHERE NOT EXISTS (SELECT 1 FROM public.compras WHERE id_compra = 'COM_CRQ_001');

INSERT INTO public.compras (id_compra, id_producto, producto_nombre, fecha_compra, id_proveedor, tipo_compra, cantidad_compra, costo_unitario, subtotal, moneda, estado_pago, observaciones, tipo_cambio_usd)
SELECT 'COM_CRQ_PPQ_001', 'CRQ', 'Garritas', '2025-02-01', '0', NULL, 1, 5000, 5000, 'MXN', 'PAGADO', 'Anticipo de la formula para raza pequeña', 18
WHERE NOT EXISTS (SELECT 1 FROM public.compras WHERE id_compra = 'COM_CRQ_PPQ_001');

INSERT INTO public.compras (id_compra, id_producto, producto_nombre, fecha_compra, id_proveedor, tipo_compra, cantidad_compra, costo_unitario, subtotal, moneda, estado_pago, observaciones, tipo_cambio_usd)
SELECT 'COM_CRQ_005', 'CRQ', 'Garritas', '2025-02-10', '0', NULL, 1, 15000, 15000, 'MXN', 'PAGADO', 'Pago de honorarios del Dr. Carlos', 18
WHERE NOT EXISTS (SELECT 1 FROM public.compras WHERE id_compra = 'COM_CRQ_005');

INSERT INTO public.compras (id_compra, id_producto, producto_nombre, fecha_compra, id_proveedor, tipo_compra, cantidad_compra, costo_unitario, subtotal, moneda, estado_pago, observaciones, tipo_cambio_usd)
SELECT 'COM_CRQ_006', 'CRQ', 'Garritas', '2025-02-12', '0', NULL, 1, 3000, 3000, 'MXN', 'PAGADO', 'Pago para la inscripción del acta', 18
WHERE NOT EXISTS (SELECT 1 FROM public.compras WHERE id_compra = 'COM_CRQ_006');

INSERT INTO public.compras (id_compra, id_producto, producto_nombre, fecha_compra, id_proveedor, tipo_compra, cantidad_compra, costo_unitario, subtotal, moneda, estado_pago, observaciones, tipo_cambio_usd)
SELECT 'COM_CRQ_007', 'CRQ', 'Garritas', '2026-02-14', '0', NULL, 1, 8000, 8000, 'MXN', 'PAGADO', 'Pago correspondiente al registro de la imagen de la marca', 18
WHERE NOT EXISTS (SELECT 1 FROM public.compras WHERE id_compra = 'COM_CRQ_007');

INSERT INTO public.compras (id_compra, id_producto, producto_nombre, fecha_compra, id_proveedor, tipo_compra, cantidad_compra, costo_unitario, subtotal, moneda, estado_pago, observaciones, tipo_cambio_usd)
SELECT 'COM_CRQ_GTO_004', 'CRQ', 'Garritas', '2026-02-16', '0', NULL, 1, 7500, 7500, 'MXN', 'PAGADO', 'Dossier gatos', 18
WHERE NOT EXISTS (SELECT 1 FROM public.compras WHERE id_compra = 'COM_CRQ_GTO_004');

INSERT INTO public.compras (id_compra, id_producto, producto_nombre, fecha_compra, id_proveedor, tipo_compra, cantidad_compra, costo_unitario, subtotal, moneda, estado_pago, observaciones, tipo_cambio_usd)
SELECT 'COM_CRQ_008', 'CRQ', 'Garritas', '2026-02-18', '0', NULL, 1, 30000, 30000, 'MXN', 'PAGADO', 'Inscripción de la marca', 18
WHERE NOT EXISTS (SELECT 1 FROM public.compras WHERE id_compra = 'COM_CRQ_008');

INSERT INTO public.compras (id_compra, id_producto, producto_nombre, fecha_compra, id_proveedor, tipo_compra, cantidad_compra, costo_unitario, subtotal, moneda, estado_pago, observaciones, tipo_cambio_usd)
SELECT 'COM_CRQ_009', 'CRQ', 'Garritas', '2026-02-20', '0', NULL, 1, 12000, 12000, 'MXN', 'PAGADO', 'Dossier SADER', 18
WHERE NOT EXISTS (SELECT 1 FROM public.compras WHERE id_compra = 'COM_CRQ_009');

-- 3. Pagos (id_pago obligatorio)
INSERT INTO public.pagos_compra (id_pago, id_compra, fecha_pago, monto_pago, metodo_pago)
SELECT gen_random_uuid(), 'COM_CRQ_PMG_001', '2025-01-09', 9000, 'Transferencia'
WHERE NOT EXISTS (SELECT 1 FROM public.pagos_compra WHERE id_compra = 'COM_CRQ_PMG_001');

INSERT INTO public.pagos_compra (id_pago, id_compra, fecha_pago, monto_pago, metodo_pago)
SELECT gen_random_uuid(), 'COM_CRQ_GTO_001', '2025-01-15', 6500, 'Transferencia'
WHERE NOT EXISTS (SELECT 1 FROM public.pagos_compra WHERE id_compra = 'COM_CRQ_GTO_001');

INSERT INTO public.pagos_compra (id_pago, id_compra, fecha_pago, monto_pago, metodo_pago)
SELECT gen_random_uuid(), 'COM_CRQ_001', '2025-01-20', 9000, 'Transferencia'
WHERE NOT EXISTS (SELECT 1 FROM public.pagos_compra WHERE id_compra = 'COM_CRQ_001');

INSERT INTO public.pagos_compra (id_pago, id_compra, fecha_pago, monto_pago, metodo_pago)
SELECT gen_random_uuid(), 'COM_CRQ_PPQ_001', '2025-02-01', 5000, 'Transferencia'
WHERE NOT EXISTS (SELECT 1 FROM public.pagos_compra WHERE id_compra = 'COM_CRQ_PPQ_001');

INSERT INTO public.pagos_compra (id_pago, id_compra, fecha_pago, monto_pago, metodo_pago)
SELECT gen_random_uuid(), 'COM_CRQ_005', '2025-02-10', 15000, 'Transferencia'
WHERE NOT EXISTS (SELECT 1 FROM public.pagos_compra WHERE id_compra = 'COM_CRQ_005');

INSERT INTO public.pagos_compra (id_pago, id_compra, fecha_pago, monto_pago, metodo_pago)
SELECT gen_random_uuid(), 'COM_CRQ_006', '2025-02-12', 3000, 'Transferencia'
WHERE NOT EXISTS (SELECT 1 FROM public.pagos_compra WHERE id_compra = 'COM_CRQ_006');

INSERT INTO public.pagos_compra (id_pago, id_compra, fecha_pago, monto_pago, metodo_pago)
SELECT gen_random_uuid(), 'COM_CRQ_007', '2026-02-14', 8000, 'Transferencia'
WHERE NOT EXISTS (SELECT 1 FROM public.pagos_compra WHERE id_compra = 'COM_CRQ_007');

INSERT INTO public.pagos_compra (id_pago, id_compra, fecha_pago, monto_pago, metodo_pago)
SELECT gen_random_uuid(), 'COM_CRQ_GTO_004', '2026-02-16', 7500, 'Transferencia'
WHERE NOT EXISTS (SELECT 1 FROM public.pagos_compra WHERE id_compra = 'COM_CRQ_GTO_004');

INSERT INTO public.pagos_compra (id_pago, id_compra, fecha_pago, monto_pago, metodo_pago)
SELECT gen_random_uuid(), 'COM_CRQ_008', '2026-02-18', 30000, 'Transferencia'
WHERE NOT EXISTS (SELECT 1 FROM public.pagos_compra WHERE id_compra = 'COM_CRQ_008');

INSERT INTO public.pagos_compra (id_pago, id_compra, fecha_pago, monto_pago, metodo_pago)
SELECT gen_random_uuid(), 'COM_CRQ_009', '2026-02-20', 12000, 'Transferencia'
WHERE NOT EXISTS (SELECT 1 FROM public.pagos_compra WHERE id_compra = 'COM_CRQ_009');
