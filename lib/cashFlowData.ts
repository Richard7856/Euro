
import {
    Venta,
    GastoDetallado,
    Compra,
    Inventario,
    CuentaPorCobrar,
    PagoProveedor
} from '@/types/financial';

// --- VENTAS (legacy, usar sampleData.ventasData para el dashboard) ---
export const ventasData: Venta[] = [
    { id_venta: 'V-2025-001', id_producto: 'P-001', canal_cobro: 'DANTE', fecha_pago: '2025-01-15', metodo_pago: 'TRANSFERENCIA', monto_pagado: 154000 },
    { id_venta: 'V-2025-002', id_producto: 'P-002', canal_cobro: 'DANTE', fecha_pago: '2025-01-12', metodo_pago: 'TRANSFERENCIA', monto_pagado: 42500 },
    { id_venta: 'V-2025-003', id_producto: 'P-003', canal_cobro: 'DANTE', fecha_pago: '2025-01-15', metodo_pago: 'EFECTIVO', monto_pagado: 12000 },
];

// --- GASTOS DETALLADOS ---
export const gastosDetallados: GastoDetallado[] = [
    {
        id: 'G-001',
        fecha: '2025-01-05',
        categoria: 'fumigacion',
        descripcion: 'Control de plagas mensual nave A',
        monto: 12500,
        proveedor: 'Fumigaciones Express'
    },
    {
        id: 'G-002',
        fecha: '2025-01-08',
        categoria: 'empaque',
        descripcion: 'Cajas de cartón corrugado 10kg',
        monto: 45000,
        proveedor: 'Empaques del Valle'
    },
    {
        id: 'G-003',
        fecha: '2025-01-10',
        categoria: 'logistica',
        descripcion: 'Flete a Guadalajara',
        monto: 8500,
        proveedor: 'Transportes Rápidos'
    },
    {
        id: 'G-004',
        fecha: '2025-01-12',
        categoria: 'almacenaje',
        descripcion: 'Renta bodega frigorífica Enero',
        monto: 35000,
        proveedor: 'Frigoríficos Industriales'
    },
    {
        id: 'G-005',
        fecha: '2025-01-15',
        categoria: 'empaque',
        descripcion: 'Etiquetas adhesivas premium',
        monto: 12000,
        proveedor: 'Gráficos Modernos'
    },
    {
        id: 'G-006',
        fecha: '2025-01-20',
        categoria: 'operativo',
        descripcion: 'Nómina operativa semana 3',
        monto: 28000
    },
    {
        id: 'G-007',
        fecha: '2025-01-22',
        categoria: 'fumigacion',
        descripcion: 'Tratamiento preventivo tarimas',
        monto: 4500,
        proveedor: 'Fumigaciones Express'
    },
    {
        id: 'G-008',
        fecha: '2025-01-25',
        categoria: 'logistica',
        descripcion: 'Envío consolidado CDMX',
        monto: 15600,
        proveedor: 'LogisticMX'
    }
];

// --- COMPRAS REALS ---
export const comprasData: Compra[] = [
    {
        id_compra: 'ALM-002-C-001',
        producto_nombre: 'Almendra',
        kg: 10.8,
        tipo_pago: 'Crédito',
        proveedor: 'DVD_BRS',
        inversion_mxn: 636120,
        pagado_mxn: 0,
        pendiente_mxn: 636120,
        estado: 'CRÉDITO',
        nota_clave: 'Vence 12/01/2026',
        fecha_compra: '2026-01-12',
        fecha_vencimiento: '2026-01-12'
    },
    {
        id_compra: 'PST-PLD-003',
        producto_nombre: 'Pistache pelado',
        kg: 19,
        tipo_pago: 'Contado',
        proveedor: 'WND-PST',
        inversion_mxn: 3880750,
        pagado_mxn: 1100000,
        pendiente_mxn: 2780750,
        estado: 'PENDIENTE',
        nota_clave: 'Distribución parcial'
    },
    {
        id_compra: 'PST-ENT-002',
        producto_nombre: 'Pistache entero',
        kg: 38,
        tipo_pago: 'Contado',
        proveedor: 'WND-PST',
        inversion_mxn: 3740000,
        pagado_mxn: 907200,
        pendiente_mxn: 3063800,
        estado: 'PENDIENTE',
        nota_clave: 'Robo parcial'
    },
    {
        id_compra: 'LMN-001-C-001',
        producto_nombre: 'Limón',
        kg: 38,
        tipo_pago: 'Contado',
        proveedor: '---',
        inversion_mxn: 1216000,
        pagado_mxn: 0,
        pendiente_mxn: 1216000,
        estado: 'PERDIDO',
        nota_clave: 'Demanda legal'
    },
    {
        id_compra: 'PST-MRC-001',
        producto_nombre: 'Pistache Marruecos',
        kg: 20,
        tipo_pago: 'Contado',
        proveedor: '---',
        inversion_mxn: 4000000,
        pagado_mxn: 0,
        pendiente_mxn: 4000000,
        estado: 'PENDIENTE',
        nota_clave: '---'
    },
    {
        id_compra: 'DTL-003-C-001',
        producto_nombre: 'Dátil',
        kg: 21,
        tipo_pago: 'Contado',
        proveedor: '---',
        inversion_mxn: 2163000,
        pagado_mxn: 2155000,
        pendiente_mxn: 8000,
        estado: 'PAGADO',
        nota_clave: 'Ajuste menor'
    },
    {
        id_compra: 'OPT-PST-C-001',
        producto_nombre: 'Óptica pistache',
        kg: 1,
        tipo_pago: 'Contado',
        proveedor: '---',
        inversion_mxn: 350000,
        pagado_mxn: 0,
        pendiente_mxn: 350000,
        estado: 'NO RECIBIDA',
        nota_clave: 'Equipo no entregado'
    }
];

// --- PAGOS A PROVEEDORES ---
export const pagosProveedorData: PagoProveedor[] = [
    { id_pago: 'PG-001', id_compra: 'DTL-003-C-001', fecha_pago: '2025-01-30', monto_pago: 115000, metodo_pago: 'Transferencia Interbancaria' },
    { id_pago: 'PG-002', id_compra: 'PST-PLD-003', fecha_pago: '2025-03-08', monto_pago: 1100000, metodo_pago: 'Transferencia Interbancaria' },
    { id_pago: 'PG-003', id_compra: 'DTL-003-C-001', fecha_pago: '2025-02-15', monto_pago: 500000, metodo_pago: 'Transferencia Interbancaria' },
    { id_pago: 'PG-004', id_compra: 'DTL-003-C-001', fecha_pago: '2025-03-20', monto_pago: 1540500, metodo_pago: 'Transferencia Interbancaria' },
];

// --- INVENTARIO ---
export const inventarioData: Inventario[] = [
    {
        id_producto: 'P-001',
        nombre_producto: 'Pistache Premium',
        cantidad_disponible: 1250,
        valor_unitario_promedio: 185.00,
        valor_total: 231250,
        fecha_ultima_compra: '2025-01-10',
        rotacion_dias: 12
    },
    {
        id_producto: 'P-002',
        nombre_producto: 'Nuez Pecana',
        cantidad_disponible: 850,
        valor_unitario_promedio: 210.00,
        valor_total: 178500,
        fecha_ultima_compra: '2025-01-15',
        rotacion_dias: 8
    },
    {
        id_producto: 'P-003',
        nombre_producto: 'Almendra Entera',
        cantidad_disponible: 2500,
        valor_unitario_promedio: 145.00,
        valor_total: 362500,
        fecha_ultima_compra: '2025-01-20',
        rotacion_dias: 25
    },
    {
        id_producto: 'P-004',
        nombre_producto: 'Arándano Deshidratado',
        cantidad_disponible: 450,
        valor_unitario_promedio: 95.00,
        valor_total: 42750,
        fecha_ultima_compra: '2024-12-28',
        rotacion_dias: 35
    },
    {
        id_producto: 'P-005',
        nombre_producto: 'Dátil Medjool',
        cantidad_disponible: 200, // Bajo inventario
        valor_unitario_promedio: 120.00,
        valor_total: 24000,
        fecha_ultima_compra: '2025-01-05',
        rotacion_dias: 4
    }
];

// --- CUENTAS POR COBRAR (alineado con pedidos: Christ_CDMX, PCR-MLG, Almacenaje Propo, SMY-ESP) ---
export const cuentasPorCobrar: CuentaPorCobrar[] = [
    {
        id_venta: 'ALM-002-V-001',
        id_cliente: 'Christ_CDMX',
        nombre_cliente: 'Christ CDMX',
        monto_total: 891000,
        monto_cobrado: 300000,
        monto_pendiente: 591000,
        fecha_venta: '2025-12-15',
        fecha_vencimiento: '2026-01-15',
        dias_vencido: 0,
        estado: 'vigente'
    },
    {
        id_venta: 'PST-002-V-003',
        id_cliente: 'Christ_CDMX',
        nombre_cliente: 'Christ CDMX',
        monto_total: 400000,
        monto_cobrado: 0,
        monto_pendiente: 400000,
        fecha_venta: '2025-02-15',
        fecha_vencimiento: '2025-03-17',
        dias_vencido: 0,
        estado: 'por_vencer'
    },
    {
        id_venta: 'DTL-003-V-002',
        id_cliente: 'PCR-MLG',
        nombre_cliente: 'PCR Málaga',
        monto_total: 288750,
        monto_cobrado: 0,
        monto_pendiente: 288750,
        fecha_venta: '2025-03-08',
        fecha_vencimiento: '2025-04-08',
        dias_vencido: 0,
        estado: 'por_vencer'
    },
    {
        id_venta: 'PST-MRC-001',
        id_cliente: 'SMY-ESP',
        nombre_cliente: 'SMY España',
        monto_total: 6880000,
        monto_cobrado: 0,
        monto_pendiente: 6880000,
        fecha_venta: '2025-01-15',
        fecha_vencimiento: '2025-02-28',
        dias_vencido: 0,
        estado: 'vigente'
    },
    {
        id_venta: 'DTL-003-V-004',
        id_cliente: 'Almacenaje Propo',
        nombre_cliente: 'Almacenaje Propo',
        monto_total: 340125,
        monto_cobrado: 100000,
        monto_pendiente: 240125,
        fecha_venta: '2025-08-08',
        fecha_vencimiento: '2025-09-08',
        dias_vencido: 0,
        estado: 'vigente'
    }
];
