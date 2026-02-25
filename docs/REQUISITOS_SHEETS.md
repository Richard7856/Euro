# Requisitos para normalizar las hojas de Google Sheets

Lista de lo que debe acomodarse en cada tabla para que el dashboard funcione correctamente.

---

## Nombres exactos de hojas (no cambiar)

| Hoja | Uso en el dashboard |
|------|---------------------|
| **Cobros** | Pagos recibidos (ingresos) |
| **Ventas** | Pedidos y detalle de ventas |
| **Compras** | Compras a proveedores |
| **Fumigación** | Gastos de fumigación |
| **LogisticaEnvios** | Envíos, logística y almacenaje |
| **PagosCompra** | Pagos realizados a proveedores |
| **Productos** | Inventario y catálogo |

---

## 1. Hoja COBROS

**Orden de columnas (A → H):**

| Col | Nombre sugerido | Tipo | Requerido | Notas |
|-----|-----------------|------|-----------|-------|
| A | ID_Venta | Texto | ✓ | Debe existir en la hoja Ventas |
| B | ID_Producto | Texto | ✓ | |
| C | CANAL (de cobro) | Texto | ✓ | Ej: DANTE, EFECTIVO, TRANSFERENCIA |
| D | Fecha_pago | Fecha | ✓ | Formato: `yyyy-mm-dd` o `dd/mm/yyyy` |
| E | Método_pago | Texto | ✓ | Ej: EFECTIVO, TRANSFERENCIA |
| F | Monto_Pagado | Número | ✓ | Sin símbolos de moneda |
| G | Evidencia | Texto | | |
| H | NOTAS | Texto | | |

**Reglas:**
- Cada fila = 1 cobro recibido.
- ID_Venta debe coincidir con alguna venta en la hoja Ventas.
- Fecha en formato consistente (preferir `2025-01-15`).

---

## 2. Hoja VENTAS

**Orden de columnas (A → L):**

| Col | Nombre sugerido | Tipo | Requerido | Notas |
|-----|-----------------|------|-----------|-------|
| A | ID_Pedido | Texto | ✓ | Único por pedido |
| B | ID_Venta | Texto | ✓ | Ej: DTL-003-V-001 |
| C | ID_Compra | Texto | | Vincula con Compras |
| D | ID_Producto | Texto | ✓ | |
| E | ID_Cliente | Texto | ✓ | Ej: Christ_CDMX, PCR-MLG |
| F | ID_Logistica | Texto | | |
| G | Fecha_Pedido | Fecha | ✓ | Formato consistente |
| H | Canal_Venta | Texto | | Ej: Dante/Arabe, Dante |
| I | Cantidad | Número | | |
| J | Precio_Unitario | Número | | |
| K | Logistica | Texto/Número | | |
| L | Subtotal | Número | ✓ | Cantidad × Precio_Unitario |

**Reglas:**
- Una fila por línea de pedido (un pedido puede tener varias filas).
- ID_Cliente debe ser consistente en todo el workbook.
- Subtotal siempre numérico, sin "$" ni comas.

---

## 3. Hoja COMPRAS

**Orden de columnas (A → M):**

| Col | Nombre sugerido | Tipo | Requerido | Notas |
|-----|-----------------|------|-----------|-------|
| A | ID_Compra | Texto | ✓ | Ej: DTL-003-C-001 |
| B | ID_Producto | Texto | | |
| C | Movimiento | Texto | | Nombre del producto |
| D | Fecha_Compra | Fecha | ✓ | |
| E | ID_Proveedor | Texto | ✓ | Ej: DVD_BRS, WND-PST |
| F | Tipo_Compra | Texto | ✓ | "Crédito" o "Contado" |
| G | Cantidad_Compra | Número | ✓ | Kg o unidades |
| H | Costo_Unitario | Número | ✓ | |
| I | Subtotal | Número | ✓ | Cantidad × Costo_Unitario |
| J | Moneda | Texto | | MXN, USD, etc. |
| K | Fecha_Vencimi | Fecha | | Para compras a crédito |
| L | Estado_Pago | Texto | | PAGADO, PENDIENTE, CRÉDITO |
| M | Observaciones | Texto | | |

**Reglas:**
- Para compras a crédito, llenar Fecha_Vencimi.
- ID_Compra debe usarse en PagosCompra cuando se pague.

---

## 4. Hoja FUMIGACIÓN

**Orden de columnas (A → K):**

| Col | Nombre sugerido | Tipo | Requerido | Notas |
|-----|-----------------|------|-----------|-------|
| A | ID_Fumigación | Texto | ✓ | |
| B | Sede | Texto | | |
| C | Dirección | Texto | | |
| D | Proveedor | Texto | | |
| E | Frecuencia | Texto | | |
| F | Fecha_Fumigaci | Fecha | ✓ | |
| G | Próxima_Fumiga | Fecha | | |
| H | Costo | Número | ✓ | |
| I | Responsable | Texto | | |
| J | Evidencia | Texto | | |
| K | Notas | Texto | | |

---

## 5. Hoja LOGISTICAENVIOS

**Orden de columnas (A → N):**

| Col | Nombre sugerido | Tipo | Requerido | Notas |
|-----|-----------------|------|-----------|-------|
| A | ID_Envio | Texto | ✓ | |
| B | Producto | Texto | | |
| C | ID_Cliente | Texto | ✓ | Mismo ID que en Ventas |
| D | ID_Compra | Texto | ✓ | Mismo ID que en Compras |
| E | Tipo_Envio | Texto | ✓ | "Compra" o "Resguardo" |
| F | Fecha_Envio | Fecha | | |
| G | Proveedor | Texto | | |
| H | Guía | Texto | | |
| I | Costo_Envio | Número | ✓ | |
| J | Origen | Texto | | |
| K | Destino | Texto | | |
| L | Estado | Texto | | |
| M | Fecha_Entrega | Fecha | | |

**Reglas:**
- Tipo_Envio: "Resguardo" = almacenaje; "Compra" = envío de mercancía.
- ID_Cliente e ID_Compra deben existir en sus respectivas hojas.

---

## 6. Hoja PAGOSCOMPRA

**Orden de columnas (A → G):**

| Col | Nombre sugerido | Tipo | Requerido | Notas |
|-----|-----------------|------|-----------|-------|
| A | ID_Pago | Texto | ✓ | Único por pago |
| B | ID_Compra | Texto | ✓ | Debe existir en Compras |
| C | Fecha_Pago | Fecha | ✓ | |
| D | Monto_Pago | Número | ✓ | |
| E | Método_Pago | Texto | | Transferencia, Efectivo, etc. |
| F | Referencia | Texto | | |
| G | Evidencia | Texto | | |

**Reglas:**
- La suma de Monto_Pago por ID_Compra no debe superar el Subtotal de esa compra.

---

## 7. Hoja PRODUCTOS

**Orden de columnas (A → K):**

| Col | Nombre sugerido | Tipo | Requerido | Notas |
|-----|-----------------|------|-----------|-------|
| A | ID_Producto | Texto | ✓ | Ej: DTL-003, ALM_002 |
| B | Nombre | Texto | ✓ | Nombre comercial |
| C | Categoría | Texto | | |
| D | Unidad(kg) | Número | | Cantidad en stock |
| E | Costo_Ref | Número | | Costo unitario de referencia |
| F | Moneda | Texto | | |
| G | Precio_Venta | Número | | |
| H | Moneda_Venta | Texto | | |
| I | Costo_Total | Número | | Valor total en inventario |
| J | Estado | Texto | | |
| K | Venta_total | Número | | |

---

## Reglas generales de consistencia

1. **IDs únicos y consistentes**
   - ID_Cliente: usar siempre el mismo formato (ej: `Christ_CDMX`, no `Christ CDMX` ni `christ_cdmx`).
   - ID_Compra, ID_Venta, ID_Pedido: sin espacios ni caracteres raros.

2. **Fechas**
   - Preferir `yyyy-mm-dd` (ej: 2025-01-15).
   - También acepta: `dd/mm/yyyy`, `dd/mm/yy`, o número serial de Excel.

3. **Números**
   - Sin símbolo de moneda ($), sin comas de miles.
   - Usar punto decimal si hay decimales (ej: 1250.50).

4. **Fila 1**
   - Siempre encabezados. Los datos empiezan en fila 2.

5. **Celdas vacías**
   - Evitar vacíos en columnas marcadas como requeridas.
   - Si no hay dato, preferir "-" o "N/A" en campos de texto.

---

## Resumen rápido para el equipo

- Mantener los **7 nombres de hojas** exactos.
- Respetar el **orden de columnas** en cada hoja.
- Usar **IDs consistentes** entre hojas (Cliente, Compra, Venta, Producto).
- Formato de fechas: **yyyy-mm-dd** o **dd/mm/yyyy**.
- Números: **sin $, sin comas**, punto decimal.
