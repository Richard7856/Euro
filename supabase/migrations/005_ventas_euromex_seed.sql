-- =============================================================================
-- Ventas Grupo Euromex: seed desde hoja de ventas (cobros + pedidos)
-- Ejecutar en Supabase SQL Editor después de 001, 002, 003.
-- Ejecutar una sola vez; si se repite, pueden existir duplicados en cobros.
-- =============================================================================

SET client_encoding = 'UTF8';

DO $$
DECLARE
  euromex_id uuid := 'a0000000-0000-4000-8000-000000000001';
BEGIN
  -- Cobros (ventas / pagos recibidos)
  INSERT INTO public.cobros (empresa_id, id_venta, id_producto, canal_cobro, fecha_pago, metodo_pago, monto_pagado, evidencia, notas)
  VALUES
    (euromex_id, 'DTL-003-V-001', 'DTL-003', 'Dante/Arabe', '2025-08-01', 'TRANSFERENCIA', 131300.00, NULL, NULL),
    (euromex_id, 'DTL-003-V-002', 'DTL-003', 'Menahen', '2025-08-15', 'TRANSFERENCIA', 288750.00, 'Se vendio a paco la Rosa', NULL),
    (euromex_id, 'DTL-003-V-003', 'DTL-003', 'Dante/Arabe', '2025-08-03', 'TRANSFERENCIA', 129350.00, NULL, NULL),
    (euromex_id, 'DTL-003-V004', 'DTL-003', 'Dante/Arabe', '2025-08-06', 'TRANSFERENCIA', 130000.00, NULL, NULL),
    (euromex_id, 'DTL-003-V004', 'DTL-003', 'Dante/Arabe', '2025-08-08', 'TRANSFERENCIA', 104500.00, NULL, NULL),
    (euromex_id, 'DTL-003-V004', 'DTL-003', 'Dante', '2025-08-15', 'TRANSFERENCIA', 235625.00, NULL, NULL),
    (euromex_id, 'ALM-002-V001', 'ALM-002', 'Dante', '2025-08-15', 'TRANSFERENCIA', 877500.00, NULL, NULL),
    (euromex_id, 'ALM-002-V002', 'ALM-002', 'Dante', '2025-08-15', 'TRANSFERENCIA', 316250.00, NULL, NULL),
    (euromex_id, 'PST-MRC-001-V001', 'PST-MRC-001', 'Menahen', '2025-08-15', 'TRANSFERENCIA', 4410000.00, 'Lo debe Sammy', NULL),
    (euromex_id, 'PST-GRN-002-V001', 'PST-GRN-002', 'Dante', '2025-08-15', 'TRANSFERENCIA', 400000.00, NULL, NULL),
    (euromex_id, 'PST-GRN-002-V002', 'PST-GRN-002', 'Dante', '2025-08-15', 'TRANSFERENCIA', 133650.00, NULL, 'Pendiente de confirmar si se lo quedan');

  -- Pedidos (una fila por venta; fecha_pedido NOT NULL, se usa 2025-08-15 cuando no había fecha)
  INSERT INTO public.pedidos (empresa_id, id_pedido, id_venta, id_producto, id_cliente, fecha_pedido, canal_venta, total_pedido, estado_pedido)
  VALUES
    (euromex_id, 'PED-001', 'DTL-003-V-001', 'DTL-003', 'Christ-CDMX', '2025-08-01', 'Dante/Arabe', 131300.00, 'Entregado'),
    (euromex_id, 'PED-002', 'DTL-003-V-002', 'DTL-003', 'PCR-MLG', '2025-08-15', 'Menahen', 288750.00, 'Pendiente'),
    (euromex_id, 'PED-003', 'DTL-003-V-003', 'DTL-003', 'Christ-CDMX', '2025-08-03', 'Dante/Arabe', 129350.00, 'Entregado'),
    (euromex_id, 'PED-004', 'DTL-003-V004', 'DTL-003', 'Christ-CDMX', '2025-08-06', 'Dante/Arabe', 130000.00, 'Entregado'),
    (euromex_id, 'PED-005', 'DTL-003-V004', 'DTL-003', 'Christ-CDMX', '2025-08-08', 'Dante/Arabe', 104500.00, 'Entregado'),
    (euromex_id, 'PED-006', 'DTL-003-V004', 'DTL-003', 'Christ-CDMX', '2025-08-15', 'Dante', 235625.00, 'Pendiente'),
    (euromex_id, 'PED-007', 'ALM-002-V001', 'ALM-002', 'Christ-CDMX', '2025-08-15', 'Dante', 877500.00, 'Pendiente'),
    (euromex_id, 'PED-008', 'ALM-002-V002', 'ALM-002', 'Christ-CDMX', '2025-08-15', 'Dante', 316250.00, 'Pendiente'),
    (euromex_id, 'PED-009', 'PST-MRC-001-V001', 'PST-MRC-001', 'SMY-ESP', '2025-08-15', 'Menahen', 4410000.00, 'Pendiente'),
    (euromex_id, 'PED-010', 'PST-GRN-002-V001', 'PST-GRN-002', 'Christ-CDMX', '2025-08-15', 'Dante', 400000.00, 'Pendiente'),
    (euromex_id, 'PED-011', 'PST-GRN-002-V002', 'PST-GRN-002', 'Christ-CDMX', '2025-08-15', 'Dante', 133650.00, 'Pendiente');
END $$;
