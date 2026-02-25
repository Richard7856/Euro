import { Venta, Pedido, DetallePedido, Envio } from '@/types/financial';

// Datos de ejemplo basados en los screenshots proporcionados
export const ventasData: Venta[] = [
    {
        id_venta: 'DTL-003-V-001',
        id_producto: 'DTL-003',
        canal_cobro: 'DANTE',
        fecha_pago: '2025-01-08',
        metodo_pago: 'EFECTIVO',
        monto_pagado: 80000,
        evidencia: ''
    },
    {
        id_venta: 'DTL-003-V-002',
        id_producto: 'DTL-003',
        canal_cobro: 'DANTE',
        fecha_pago: '2025-03-08',
        metodo_pago: 'EFECTIVO',
        monto_pagado: 50000
    },
    {
        id_venta: 'DTL-003-V-003',
        id_producto: 'DTL-003',
        canal_cobro: 'DANTE',
        fecha_pago: '2025-07-08',
        metodo_pago: 'EFECTIVO',
        monto_pagado: 50000
    },
    {
        id_venta: 'DTL-003-V-004',
        id_producto: 'DTL-003',
        canal_cobro: 'DANTE',
        fecha_pago: '2025-08-15',
        metodo_pago: 'EFECTIVO',
        monto_pagado: 100000
    },
    {
        id_venta: 'ALM-002-V-001',
        id_producto: 'ALM_002',
        canal_cobro: 'DANTE',
        fecha_pago: '2025-12-15',
        metodo_pago: 'TRANSFERENCIA',
        monto_pagado: 200000
    },
    {
        id_venta: 'ALM-002-V-001',
        id_producto: 'ALM_002',
        canal_cobro: 'DANTE',
        fecha_pago: '2025-12-18',
        metodo_pago: 'TRANSFERENCIA',
        monto_pagado: 100000
    },
    {
        id_venta: 'ALM-002-V-002',
        id_producto: 'ALM_002',
        canal_cobro: 'DANTE',
        fecha_pago: '2024-06-04',
        metodo_pago: 'EFECTIVO',
        monto_pagado: 405000
    },
    {
        id_venta: 'ALM-002-V-002',
        id_producto: 'ALM_002',
        canal_cobro: 'DANTE',
        fecha_pago: '2025-01-19',
        metodo_pago: 'TRANSFERENCIA',
        monto_pagado: 90000,
        notas: 'Venta que también incluye pistaches'
    }
];

export const pedidosData: Pedido[] = [
    {
        id_pedido: 'V-001',
        id_venta: 'DTL-003-V-001',
        fecha_pedido: '2025-01-08',
        canal_venta: 'Dante/Arabe',
        id_cliente: '',
        total_pedido: 125000,
        estado_pedido: 'Entregado'
    },
    {
        id_pedido: 'V-002',
        id_venta: 'DTL-003-V-002',
        fecha_pedido: '2025-03-08',
        canal_venta: 'Dante/Arabe',
        id_cliente: '',
        total_pedido: 129350,
        estado_pedido: 'Entregado'
    },
    {
        id_pedido: 'V-003',
        id_venta: 'DTL-003-V-003',
        fecha_pedido: '2025-06-08',
        canal_venta: 'Dante/Arabe',
        id_cliente: '',
        total_pedido: 130000,
        estado_pedido: 'Entregado'
    },
    {
        id_pedido: 'V-004',
        id_venta: 'DTL-003-V-004',
        fecha_pedido: '2025-08-08',
        canal_venta: 'Dante/Arabe',
        id_cliente: '',
        total_pedido: 340125,
        estado_pedido: 'Entregado'
    },
    {
        id_pedido: 'V-005',
        id_venta: 'ALM-002-V-001',
        fecha_pedido: '',
        canal_venta: 'Dante',
        id_cliente: 'Christ_CDMX',
        total_pedido: 891000,
        estado_pedido: 'Entregado'
    },
    {
        id_pedido: 'V-006',
        id_venta: 'ALM-002-V-002',
        fecha_pedido: '',
        canal_venta: 'Dante',
        id_cliente: 'Christ_CDMX',
        total_pedido: 316250,
        estado_pedido: 'Entregado'
    },
    {
        id_pedido: 'V-007',
        id_venta: 'PST-002-V-003',
        fecha_pedido: '',
        canal_venta: 'Dante',
        id_cliente: 'Christ_CDMX',
        total_pedido: 400000,
        estado_pedido: 'Entregado'
    }
];

export const detallesPedidoData: DetallePedido[] = [
    {
        id_detalle_pedido: 'IDV-001',
        id_venta: 'DTL-003-V-001',
        id_pedido: 'PED-001',
        id_producto: 'DTL-003',
        id_cliente: 'Christ-CDMX',
        cantidad_vendida: 2020,
        precio_unitario: 65,
        subtotal: 131300,
        id_envio_venta: 'ENV-001'
    },
    {
        id_detalle_pedido: 'IDV-002',
        id_venta: 'DTL-003-V-002',
        id_pedido: 'PED-002',
        id_producto: 'DTL-003',
        id_cliente: 'PCR-MLG',
        cantidad_vendida: 2500,
        precio_unitario: 115.5,
        subtotal: 288750
    },
    {
        id_detalle_pedido: 'IDV-003',
        id_venta: 'DTL-003-V-003',
        id_pedido: 'PED-002',
        id_producto: 'DTL-003',
        id_cliente: 'Christ-CDMX',
        cantidad_vendida: 1990,
        precio_unitario: 65,
        subtotal: 129350,
        id_envio_venta: 'ENV-002'
    },
    {
        id_detalle_pedido: 'IDV-004',
        id_venta: 'DTL-003-V-004',
        id_pedido: 'PED-003',
        id_producto: 'DTL-003',
        id_cliente: 'Christ-CDMX',
        cantidad_vendida: 2000,
        precio_unitario: 65,
        subtotal: 130000,
        id_envio_venta: 'ENV-003'
    },
    {
        id_detalle_pedido: 'IDV-005',
        id_venta: 'DTL-003-V-004',
        id_pedido: 'PED-004',
        id_producto: 'DTL-003',
        id_cliente: 'Christ-CDMX',
        cantidad_vendida: 2090,
        precio_unitario: 50,
        subtotal: 104500,
        id_envio_venta: 'ENV-004'
    },
    {
        id_detalle_pedido: 'IDV-005.1',
        id_venta: 'DTL-003-V-004',
        id_pedido: 'PED-004.1',
        id_producto: 'DTL-003',
        id_cliente: 'Christ-CDMX',
        cantidad_vendida: 3625,
        precio_unitario: 65,
        subtotal: 235625,
        id_envio_venta: 'ENV-005'
    },
    {
        id_detalle_pedido: 'IDV-006',
        id_venta: 'ALM-002-V-001',
        id_pedido: 'PED-006',
        id_producto: 'ALM_002',
        id_cliente: 'Christ-CDMX',
        cantidad_vendida: 6600,
        precio_unitario: 135,
        subtotal: 891000,
        id_envio_venta: 'ENV-006'
    },
    {
        id_detalle_pedido: 'IDV-007',
        id_venta: 'ALM-002-V-002',
        id_pedido: 'PED-006',
        id_producto: 'ALM_002',
        id_cliente: 'Christ-CDMX',
        cantidad_vendida: 2500,
        precio_unitario: 126.5,
        subtotal: 316250,
        id_envio_venta: 'ENV-007'
    },
    {
        id_detalle_pedido: 'IDV-008',
        id_venta: 'PST-002-V-003',
        id_pedido: 'PED-007',
        id_producto: 'PST-002',
        id_cliente: 'Christ-CDMX',
        cantidad_vendida: 2000,
        precio_unitario: 200,
        subtotal: 400000,
        id_envio_venta: 'ENV-008'
    },
    {
        id_detalle_pedido: 'PST-MRC-001',
        id_venta: '',
        id_pedido: '',
        id_producto: 'PST-MRC-001',
        id_cliente: 'SMY-ESP',
        cantidad_vendida: 20000,
        precio_unitario: 344,
        subtotal: 6880000,
        id_envio_venta: 'ENV-009'
    }
];

export const enviosData: Envio[] = [
    {
        id_envio: 'ENV-001',
        producto: 'Almendra',
        id_cliente: 'Christ_CDMX',
        id_compra: 'ALM-002-C-001',
        tipo_envio: 'Compra',
        fecha_envio: '2026-01-07',
        proveedor_logistico: 'XXX',
        guia_rastreo: '9889852487',
        costo_envio: 260000,
        origen: 'California',
        destino: 'Pachuca',
        estado_envio: 'Terrestre',
        fecha_entrega: '2026-01-07'
    },
    {
        id_envio: 'ENV-002',
        producto: 'Pistache Mariscos',
        id_cliente: 'Christ_CDMX',
        id_compra: 'PST-MRC-001',
        tipo_envio: 'Compra',
        fecha_envio: '',
        proveedor_logistico: '',
        guia_rastreo: '',
        costo_envio: 50000,
        origen: 'Mariscos',
        destino: '',
        estado_envio: ''
    },
    {
        id_envio: 'ENV-003',
        producto: 'Dátil',
        id_cliente: 'Almacenaje Propo',
        id_compra: 'DTL-003-C-001',
        tipo_envio: 'Compra',
        fecha_envio: '2026-02-25',
        proveedor_logistico: '',
        guia_rastreo: '',
        costo_envio: 6720,
        origen: '',
        destino: '',
        estado_envio: ''
    },
    {
        id_envio: 'ENV-004',
        producto: 'Dátil',
        id_cliente: 'Almacenaje Propo',
        id_compra: 'DTL-003-C-001',
        tipo_envio: 'Compra',
        fecha_envio: '2026-02-28',
        proveedor_logistico: '',
        guia_rastreo: '',
        costo_envio: 21120,
        origen: '',
        destino: '',
        estado_envio: ''
    },
    {
        id_envio: 'ENV-005',
        producto: 'Dátil',
        id_cliente: 'Almacenaje Propo',
        id_compra: 'DTL-003-C-001',
        tipo_envio: 'Compra',
        fecha_envio: '2026-03-12',
        proveedor_logistico: '',
        guia_rastreo: '',
        costo_envio: 35840,
        origen: '',
        destino: '',
        estado_envio: ''
    },
    {
        id_envio: 'ENV-006',
        producto: 'Dátil',
        id_cliente: 'Almacenaje Propo',
        id_compra: 'DTL-003-C-001',
        tipo_envio: 'Compra',
        fecha_envio: '2026-03-25',
        proveedor_logistico: '',
        guia_rastreo: '',
        costo_envio: 13440,
        origen: '',
        destino: '',
        estado_envio: ''
    },
    {
        id_envio: 'ENV-007',
        producto: 'Dátil',
        id_cliente: 'Almacenaje Propo',
        id_compra: 'DTL-003-C-001',
        tipo_envio: 'Compra',
        fecha_envio: '2026-03-28',
        proveedor_logistico: '',
        guia_rastreo: '',
        costo_envio: 306600,
        origen: '',
        destino: '',
        estado_envio: ''
    },
    {
        id_envio: 'ENV-008',
        producto: 'Dátil',
        id_cliente: 'Almacenaje Propo',
        id_compra: 'DTL-003-C-001',
        tipo_envio: 'Compra',
        fecha_envio: '2026-04-30',
        proveedor_logistico: '',
        guia_rastreo: '',
        costo_envio: 318496,
        origen: '',
        destino: '',
        estado_envio: ''
    },
    {
        id_envio: 'ENV-009',
        producto: 'Dátil',
        id_cliente: 'Almacenaje Propo',
        id_compra: 'DTL-003-C-001',
        tipo_envio: 'Compra',
        fecha_envio: '2026-05-06',
        proveedor_logistico: '',
        guia_rastreo: '',
        costo_envio: 33600,
        origen: '',
        destino: '',
        estado_envio: ''
    },
    {
        id_envio: 'ENV-010',
        producto: 'Dátil',
        id_cliente: 'Almacenaje Propo',
        id_compra: 'DTL-003-C-001',
        tipo_envio: 'Compra',
        fecha_envio: '2026-05-31',
        proveedor_logistico: '',
        guia_rastreo: '',
        costo_envio: 531242,
        origen: '',
        destino: '',
        estado_envio: ''
    },
    {
        id_envio: 'Almacenaje',
        producto: 'Dátil',
        id_cliente: 'Almacenaje Propo',
        id_compra: 'DTL-003-C-001',
        tipo_envio: 'Resguardo',
        fecha_envio: '',
        proveedor_logistico: '',
        guia_rastreo: '',
        costo_envio: 735000,
        origen: 'CDMX',
        destino: 'CDMX',
        estado_envio: ''
    },
    {
        id_envio: 'ENV-011',
        producto: 'Limón',
        id_cliente: '',
        id_compra: 'LMN-001-C-001',
        tipo_envio: 'Compra',
        fecha_envio: '',
        proveedor_logistico: '',
        guia_rastreo: '',
        costo_envio: 128500,
        origen: '',
        destino: '',
        estado_envio: ''
    },
    {
        id_envio: 'ENV-012',
        producto: 'Limón',
        id_cliente: '',
        id_compra: 'LMN-001-C-001',
        tipo_envio: 'Compra',
        fecha_envio: '',
        proveedor_logistico: '',
        guia_rastreo: '',
        costo_envio: 162200,
        origen: '',
        destino: '',
        estado_envio: ''
    },
    {
        id_envio: 'Almacenaje',
        producto: 'Limón',
        id_cliente: '',
        id_compra: 'LMN-001-C-001',
        tipo_envio: 'Resguardo',
        fecha_envio: '',
        proveedor_logistico: '',
        guia_rastreo: '',
        costo_envio: 18600,
        origen: '',
        destino: '',
        estado_envio: ''
    },
    {
        id_envio: 'ENV-013',
        producto: 'Pistache',
        id_cliente: '',
        id_compra: 'PST-ENT-003-C-002',
        tipo_envio: 'Compra',
        fecha_envio: '2026-02-25',
        proveedor_logistico: '',
        guia_rastreo: '',
        costo_envio: 6720,
        origen: 'Mexicali',
        destino: 'CDMX',
        estado_envio: ''
    },
    {
        id_envio: 'ENV-014',
        producto: 'Pistache',
        id_cliente: '',
        id_compra: 'PST-ENT-003-C-002',
        tipo_envio: 'Compra',
        fecha_envio: '2026-02-28',
        proveedor_logistico: '',
        guia_rastreo: '',
        costo_envio: 21120,
        origen: 'Mexicali',
        destino: 'CDMX',
        estado_envio: ''
    },
    {
        id_envio: 'ENV-015',
        producto: 'Pistache',
        id_cliente: '',
        id_compra: 'PST-ENT-003-C-002',
        tipo_envio: 'Compra',
        fecha_envio: '2026-03-12',
        proveedor_logistico: '',
        guia_rastreo: '',
        costo_envio: 35840,
        origen: 'Mexicali',
        destino: 'CDMX',
        estado_envio: ''
    },
    {
        id_envio: 'ENV-016',
        producto: 'Pistache',
        id_cliente: '',
        id_compra: 'PST-ENT-003-C-002',
        tipo_envio: 'Compra',
        fecha_envio: '2026-03-25',
        proveedor_logistico: '',
        guia_rastreo: '',
        costo_envio: 13440,
        origen: 'Mexicali',
        destino: 'CDMX',
        estado_envio: ''
    },
    {
        id_envio: 'Almacenaje',
        producto: 'Pistache',
        id_cliente: '',
        id_compra: 'PST-ENT-003-C-002',
        tipo_envio: 'Resguardo',
        fecha_envio: '',
        proveedor_logistico: '',
        guia_rastreo: '',
        costo_envio: 865412.5,
        origen: '',
        destino: '',
        estado_envio: ''
    }
];

// Nombres de productos para mapeo
export const productosNombres: Record<string, string> = {
    'DTL-003': 'Dátil',
    'ALM_002': 'Almendra',
    'PST-002': 'Pistache',
    'PST-MRC-001': 'Pistache Mariscos',
    'LMN-001': 'Limón'
};
