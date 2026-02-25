-- =============================================================================
-- Envíos (logística) y gastos de fumigación para Euromex
-- Ejecutar en Supabase SQL Editor después de 001, 002, 003.
-- =============================================================================

DO $$
DECLARE
  euromex_id uuid := 'a0000000-0000-4000-8000-000000000001';
  uid uuid;
BEGIN
  -- Usuario para gastos (primer usuario de auth; si no hay, usuario_id puede quedar NULL si la columna lo permite)
  SELECT id INTO uid FROM auth.users LIMIT 1;

  -- Envíos (logística / almacenaje)
  INSERT INTO public.envios (empresa_id, id_envio, producto, id_cliente, id_compra, tipo_envio, fecha_envio, proveedor_logistico, guia_rastreo, costo_envio, origen, destino, estado_envio, fecha_entrega)
  VALUES
    (euromex_id, 'ENV-001', 'Almendra', 'Christ CDMX', 'ALM-002-C-001', 'Compra', '2025-01-07', 'XXX', '9888552487', 260000.00, 'California', 'Pachuca', 'Terrestre', '2025-01-07'),
    (euromex_id, 'ENV-002', 'Pistache Marruecos', 'Christ CDMX', 'PST-MRC-001-C-001', 'Compra', '2025-02-01', NULL, NULL, 50000.00, 'Marruecos', 'Algeciras', NULL, NULL),
    (euromex_id, 'ENV-003', 'Datil', 'Almacenaje Propio', 'DTL-003-C-001', 'Compra', '2025-02-25', NULL, NULL, 6720.00, NULL, NULL, NULL, NULL),
    (euromex_id, 'ENV-004', 'Datil', 'Almacenaje Propio', 'DTL-003-C-001', 'Compra', '2025-02-28', NULL, NULL, 21120.00, NULL, NULL, NULL, NULL),
    (euromex_id, 'ENV-005', 'Datil', 'Almacenaje Propio', 'DTL-003-C-001', 'Compra', '2025-03-12', NULL, NULL, 35840.00, NULL, NULL, NULL, NULL),
    (euromex_id, 'ENV-006', 'Datil', 'Almacenaje Propio', 'DTL-003-C-001', 'Compra', '2025-03-25', NULL, NULL, 13440.00, NULL, NULL, NULL, NULL),
    (euromex_id, 'ENV-007', 'Datil', 'Almacenaje Propio', 'DTL-003-C-001', 'Compra', '2025-03-01', NULL, NULL, 306600.00, NULL, NULL, NULL, NULL),
    (euromex_id, 'ENV-008', 'Datil', 'Almacenaje Propio', 'DTL-003-C-001', 'Compra', '2025-03-01', NULL, NULL, 318496.00, NULL, NULL, NULL, NULL),
    (euromex_id, 'ENV-009', 'Datil', 'Almacenaje Propio', 'DTL-003-C-001', 'Compra', '2025-03-01', NULL, NULL, 33600.00, NULL, NULL, NULL, NULL),
    (euromex_id, 'ENV-010', 'Datil', 'Almacenaje Propio', 'DTL-003-C-001', 'Compra', '2025-03-01', NULL, NULL, 531242.00, NULL, NULL, NULL, NULL),
    (euromex_id, 'Almacenaje-Datil', 'Datil', 'Almacenaje Propio', 'DTL-003-C-001', 'Resguardo', '2025-03-01', NULL, NULL, 735000.00, 'CDMX', 'CDMX', NULL, NULL),
    (euromex_id, 'ENV-011', 'Limón', NULL, 'LMN-001-C-001', 'Compra', '2025-03-01', NULL, NULL, 126500.00, NULL, NULL, NULL, NULL),
    (euromex_id, 'ENV-012', 'Limón', NULL, 'LMN-001-C-001', 'Compra', '2025-03-01', NULL, NULL, 162200.00, NULL, NULL, NULL, NULL),
    (euromex_id, 'Almacenaje-Limon', 'Limón', NULL, 'LMN-001-C-001', 'Resguardo', '2025-03-01', NULL, NULL, 18600.00, NULL, NULL, NULL, NULL),
    (euromex_id, 'ENV-013', 'Pistache', NULL, 'PST-ENT-003-C-002', 'Compra', '2025-02-25', NULL, NULL, 6720.00, 'Mexicali', 'CDMX', NULL, NULL),
    (euromex_id, 'ENV-014', 'Pistache', NULL, 'PST-ENT-003-C-002', 'Compra', '2025-02-28', NULL, NULL, 21120.00, 'Mexicali', 'CDMX', NULL, NULL),
    (euromex_id, 'ENV-015', 'Pistache', NULL, 'PST-ENT-003-C-002', 'Compra', '2025-03-12', NULL, NULL, 35840.00, 'Mexicali', 'CDMX', NULL, NULL),
    (euromex_id, 'ENV-016', 'Pistache', NULL, 'PST-ENT-003-C-002', 'Compra', '2025-03-25', NULL, NULL, 13440.00, 'Mexicali', 'CDMX', NULL, NULL),
    (euromex_id, 'Almacenaje-Pistache', 'Pistache', NULL, 'PST-ENT-003-C-002', 'Resguardo', '2025-03-01', NULL, NULL, 895412.50, NULL, NULL, NULL, NULL);

  -- Gastos de fumigación (FUM-001 a FUM-009; FUM-008 aparece 3 veces = 11 filas)
  INSERT INTO public.gastos (empresa_id, usuario_id, categoria, monto, descripcion, fecha)
  VALUES
    (euromex_id, uid, 'fumigacion', 6000.00, 'GDL - Mensual - José Carrillo - PROPIO', '2025-04-11'),
    (euromex_id, uid, 'fumigacion', 6000.00, 'GDL - Mensual - José Carrillo - PROPIO', '2025-05-11'),
    (euromex_id, uid, 'fumigacion', 6000.00, 'GDL - Mensual - José Carrillo - PROPIO', '2025-06-11'),
    (euromex_id, uid, 'fumigacion', 6000.00, 'GDL - Mensual - José Carrillo - PROPIO', '2025-07-11'),
    (euromex_id, uid, 'fumigacion', 6000.00, 'GDL - Mensual - José Carrillo - PROPIO', '2025-08-15'),
    (euromex_id, uid, 'fumigacion', 6000.00, 'GDL - Mensual - José Carrillo - PROPIO', '2025-09-11'),
    (euromex_id, uid, 'fumigacion', 6000.00, 'GDL - Mensual - José Carrillo - PROPIO', '2025-10-11'),
    (euromex_id, uid, 'fumigacion', 6000.00, 'GDL - Mensual - José Carrillo - PROPIO', '2025-11-11'),
    (euromex_id, uid, 'fumigacion', 6000.00, 'GDL - Mensual - José Carrillo - PROPIO', '2025-12-11'),
    (euromex_id, uid, 'fumigacion', 6000.00, 'GDL - Mensual - José Carrillo - PROPIO', '2026-01-15'),
    (euromex_id, uid, 'fumigacion', 10200.00, 'PACHUCA - C. Grafito, Abundio de Antorcha - Luis Aguilar - PROPIO - Mensual', '2025-11-01');
END $$;
