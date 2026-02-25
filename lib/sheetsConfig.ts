/**
 * Configuración de hojas según capturas del workbook:
 * Cobros: ID_Venta, ID_Producto, CANAL, Fecha_pago, Método, Monto_Pagado, Evidencia, NOTAS
 * Ventas: ID_Pedido, ID_Venta, ID_Compra, ID_Producto, ID_Cliente, ID_Logistica, Fecha_Pedido, Canal_Venta, Cantidad, Precio_Unitario, Subtotal...
 * Compras: ID_Compra, ID_Producto, Movimiento, Fecha_Compra, ID_Proveedor, Tipo_Compra, Cantidad, Costo_Unitario, Subtotal, Moneda, Fecha_Vencimi, Estado_Pago, Observaciones
 * Fumigación: ID_Fumigación, Sede, Dirección, Proveedor, Frecuencia, Fecha_Fumigaci, Próxima_Fumiga, Costo, Responsable, Evidencia, Notas
 * LogisticaEnvios: ID_Envio, Producto, ID_Cliente, ID_Compra, Tipo_Envio, Fecha_Envio, Proveedor, Guía, Costo_Envio, Origen, Destino, Estado, Fecha_Entrega
 * PagosCompra: ID_Pago, ID_Compra, Fecha_Pago, Monto_Pago, Método_Pago, Referencia, Evidencia
 * Productos: ID_Producto, Nombre, Categoría, Unidad(kg), Costo_Ref, Moneda, Precio_Venta, Moneda_Venta, Costo_Total, Estado, Venta_total
 */
export const SHEETS_CONFIG = {
  ranges: {
    ventas: 'Cobros!A2:H',              // Cobros: pagos recibidos
    pedidos: 'Ventas!A2:L',              // Ventas: tiene ID_Pedido, ID_Venta, ID_Cliente, Subtotal
    envios: 'LogisticaEnvios!A2:O',
    compras: 'Compras!A2:M',
    gastos: 'Fumigación!A2:K',           // Fumigación: ID, Sede, Dir, Proveedor, Frec, Fecha_Fum, Próx_Fum, Costo
    pagos: 'PagosCompra!A2:G',
    cuentasPorCobrar: 'Ventas!A2:O',     // Ventas agregadas por cliente para CxC
    inventario: 'Productos!A2:K',
  },
} as const;
