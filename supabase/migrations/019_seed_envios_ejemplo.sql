-- ============================================================
-- Seed 019: Contenedores / Envíos de ejemplo — Euromex
-- Datos ficticios para demostración del mapa GPS y módulo de
-- contenedores. Se insertan solo si la tabla envios está vacía.
-- ============================================================

DO $$
DECLARE
  -- ID fijo definido en lib/empresaApi.ts — no viene de tabla empresas
  euromex_id uuid := 'a0000000-0000-4000-8000-000000000001';
BEGIN
  -- Solo insertar si los CONT-26XX no existen ya
  IF (SELECT COUNT(*) FROM envios WHERE id_envio LIKE 'CONT-26%') = 0 THEN

    INSERT INTO envios (
      id_envio, producto, id_cliente, id_compra, tipo_envio,
      fecha_envio, proveedor_logistico, guia_rastreo, costo_envio,
      origen, destino, estado_envio, fecha_entrega,
      carrier, lat_actual, lng_actual, temperatura_actual,
      ultima_actualizacion, tracking_eventos, empresa_id
    ) VALUES

    -- 1. Contenedor marítimo España → Veracruz (en camino, GPS en Atlántico)
    (
      'CONT-2601', 'Aceite de Oliva Extra Virgen (500 cajas)', 'CLI-001',
      'COMP-2601', 'Compra', '2026-02-20', 'Mediterranean Shipping Company (MSC)',
      'MSCU7234891', 85000.00,
      'Valencia, España', 'Veracruz, México',
      'En tránsito', '2026-03-18',
      'manual', 25.3210, -52.4870, 18.5,
      NOW() - INTERVAL '2 hours',
      '[
        {"fecha":"2026-02-20","descripcion":"Contenedor cargado en terminal Valencia","ubicacion":"Valencia, España"},
        {"fecha":"2026-02-22","descripcion":"Zarpe confirmado","ubicacion":"Valencia, España"},
        {"fecha":"2026-03-01","descripcion":"En tránsito — Estrecho de Gibraltar","ubicacion":"Cádiz, España"},
        {"fecha":"2026-03-08","descripcion":"En tránsito — Océano Atlántico","ubicacion":"Atlántico Norte"}
      ]'::jsonb,
      euromex_id
    ),

    -- 2. Envío DHL aéreo Holanda → CDMX (entregado)
    (
      'CONT-2602', 'Queso Gouda Premium (80 kg)', 'CLI-002',
      'COMP-2602', 'Compra', '2026-02-28', 'DHL Express',
      'JD014600006281740018', 12500.00,
      'Ámsterdam, Países Bajos', 'CDMX, México',
      'Entregado', '2026-03-05',
      'dhl', 19.4326, -99.1332, 4.2,
      NOW() - INTERVAL '5 days',
      '[
        {"fecha":"2026-02-28","descripcion":"Recogida en origen","ubicacion":"Ámsterdam"},
        {"fecha":"2026-03-01","descripcion":"En proceso en hub aéreo","ubicacion":"Leipzig, Alemania"},
        {"fecha":"2026-03-03","descripcion":"En vuelo a México","ubicacion":"Atlántico"},
        {"fecha":"2026-03-04","descripcion":"Aduana en AICM — liberado","ubicacion":"CDMX, México"},
        {"fecha":"2026-03-05","descripcion":"Entregado al destinatario","ubicacion":"CDMX, México"}
      ]'::jsonb,
      euromex_id
    ),

    -- 3. FedEx aéreo Italia → Guadalajara (en tránsito, GPS en aduana GDL)
    (
      'CONT-2603', 'Jamón Serrano (30 piezas)', 'CLI-003',
      'COMP-2603', 'Compra', '2026-03-05', 'FedEx International',
      '772898610453', 9800.00,
      'Parma, Italia', 'Guadalajara, México',
      'En tránsito', '2026-03-14',
      'fedex', 20.5218, -103.3109, 5.0,
      NOW() - INTERVAL '4 hours',
      '[
        {"fecha":"2026-03-05","descripcion":"Recogida confirmada","ubicacion":"Parma, Italia"},
        {"fecha":"2026-03-06","descripcion":"En hub FedEx","ubicacion":"Milán, Italia"},
        {"fecha":"2026-03-08","descripcion":"Salida vuelo internacional","ubicacion":"París, Francia"},
        {"fecha":"2026-03-10","descripcion":"Llegada a México","ubicacion":"Guadalajara, México"},
        {"fecha":"2026-03-10","descripcion":"En proceso aduanal","ubicacion":"Guadalajara, México"}
      ]'::jsonb,
      euromex_id
    ),

    -- 4. Estafeta nacional Veracruz → Monterrey (en tránsito, GPS en carretera)
    (
      'CONT-2604', 'Vino Rioja (240 botellas)', 'CLI-004',
      'COMP-2604', 'Resguardo', '2026-03-08', 'Estafeta',
      '9352847', 3200.00,
      'Almacén Veracruz', 'Monterrey, Nuevo León',
      'En tránsito', '2026-03-12',
      'estafeta', 22.2497, -100.9799, NULL,
      NOW() - INTERVAL '1 hour',
      '[
        {"fecha":"2026-03-08","descripcion":"Recepción en almacén Veracruz","ubicacion":"Veracruz, México"},
        {"fecha":"2026-03-09","descripcion":"En tránsito Tampico","ubicacion":"Tampico, Tamaulipas"},
        {"fecha":"2026-03-10","descripcion":"En camino a destino","ubicacion":"San Luis Potosí"}
      ]'::jsonb,
      euromex_id
    ),

    -- 5. Contenedor marítimo China → Manzanillo (descargando en puerto)
    (
      'CONT-2605', 'Especias y Condimentos Asiáticos (1,200 cajas)', 'CLI-005',
      'COMP-2605', 'Compra', '2026-02-01', 'COSCO Shipping',
      'COSU6143208940', 142000.00,
      'Shanghái, China', 'Manzanillo, Colima',
      'En tránsito', '2026-03-13',
      'manual', 19.0508, -104.3200, 22.1,
      NOW() - INTERVAL '30 minutes',
      '[
        {"fecha":"2026-02-01","descripcion":"Contenedor cargado en Shanghái","ubicacion":"Shanghái, China"},
        {"fecha":"2026-02-03","descripcion":"Zarpe desde puerto Yangtze","ubicacion":"Shanghái, China"},
        {"fecha":"2026-02-15","descripcion":"En tránsito — Océano Pacífico","ubicacion":"Pacífico Norte"},
        {"fecha":"2026-03-10","descripcion":"Llegada a puerto Manzanillo","ubicacion":"Manzanillo, México"},
        {"fecha":"2026-03-11","descripcion":"En proceso de descarga y revisión aduanal","ubicacion":"Manzanillo, México"}
      ]'::jsonb,
      euromex_id
    ),

    -- 6. DHL aéreo Colombia → CDMX (pendiente, sin GPS aún)
    (
      'CONT-2606', 'Café Verde Premium (500 kg)', 'CLI-006',
      'COMP-2606', 'Compra', '2026-03-10', 'DHL Express',
      'JD014600006281850022', 7500.00,
      'Medellín, Colombia', 'CDMX, México',
      'Pendiente', '2026-03-16',
      'dhl', NULL, NULL, NULL,
      NULL,
      NULL,
      euromex_id
    ),

    -- 7. Estafeta nacional CDMX → Guadalajara (entregado, sin GPS)
    (
      'CONT-2607', 'Paprika Húngara y Pimentón (150 kg)', 'CLI-007',
      'COMP-2607', 'Venta', '2026-03-01', 'Estafeta',
      '8741293', 1850.00,
      'Almacén CDMX', 'Guadalajara, Jalisco',
      'Entregado', '2026-03-04',
      'estafeta', 20.6597, -103.3496, NULL,
      NOW() - INTERVAL '7 days',
      '[
        {"fecha":"2026-03-01","descripcion":"Recogida en almacén CDMX","ubicacion":"CDMX"},
        {"fecha":"2026-03-02","descripcion":"En tránsito","ubicacion":"Querétaro"},
        {"fecha":"2026-03-04","descripcion":"Entregado","ubicacion":"Guadalajara, Jalisco"}
      ]'::jsonb,
      euromex_id
    ),

    -- 8. FedEx aéreo USA → CDMX cadena de frío (en tránsito, GPS en AICM)
    (
      'CONT-2608', 'Mantequilla Europea Importada (200 kg)', 'CLI-002',
      'COMP-2608', 'Compra', '2026-03-09', 'FedEx Cold Chain',
      '774412239871', 15600.00,
      'Miami, Florida, USA', 'CDMX, México',
      'En tránsito', '2026-03-13',
      'fedex', 19.4361, -99.0719, 3.8,
      NOW() - INTERVAL '45 minutes',
      '[
        {"fecha":"2026-03-09","descripcion":"Recogida en Miami — cadena de frío activada","ubicacion":"Miami, USA"},
        {"fecha":"2026-03-10","descripcion":"En vuelo MEX","ubicacion":"Golfo de México"},
        {"fecha":"2026-03-11","descripcion":"Llegada AICM — en aduana","ubicacion":"CDMX, México"}
      ]'::jsonb,
      euromex_id
    ),

    -- 9. Sin carrier — envío marítimo cancelado
    (
      'CONT-2609', 'Aceitunas Kalamata (300 cajas)', 'CLI-001',
      'COMP-2609', 'Compra', '2026-01-15', 'Grimaldi Lines',
      NULL, 55000.00,
      'Atenas, Grecia', 'Veracruz, México',
      'Cancelado', NULL,
      'manual', NULL, NULL, NULL,
      NULL,
      '[{"fecha":"2026-01-15","descripcion":"Pedido cancelado por proveedor","ubicacion":"Atenas, Grecia"}]'::jsonb,
      euromex_id
    ),

    -- 10. Envío local CDMX → Monterrey (pendiente, programado)
    (
      'CONT-2610', 'Lote Mixto Importación Marzo', 'CLI-008',
      NULL, 'Resguardo', '2026-03-15', 'Transportes TMM',
      NULL, 6200.00,
      'Almacén Tlalnepantla, CDMX', 'Distribuidora Monterrey, NL',
      'Pendiente', '2026-03-19',
      'manual', NULL, NULL, NULL,
      NULL,
      NULL,
      euromex_id
    );

  END IF;
END $$;
