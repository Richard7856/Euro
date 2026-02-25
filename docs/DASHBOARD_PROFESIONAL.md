# Plan: Dashboard profesional import/export

Dashboard unificado para una empresa que importa y exporta a nivel mundial. Objetivo: tener en un solo lugar toda la información operativa, financiera y logística.

---

## Módulos del dashboard

### 1. **Inicio / Resumen**
- Vista ejecutiva: KPIs principales, alertas del día, próximos vencimientos.
- Acceso rápido a cada módulo.
- Gráficos de tendencia (ventas, flujo, contenedores en tránsito).

### 2. **Financiero** *(ya existente, se mantiene y se integra)*
- Posición de efectivo (Cashflow, CxC, inventario, gastos almacén/logística/fumigación).
- Compromisos y flujo (CxP, flujo neto, burn rate, runway).
- Ventas y cuentas por cobrar por cliente.
- Compras (tipo de pago, timer vencimientos).
- Pagos a proveedores (en tiempo, historial).
- Ventana de clientes y de proveedores.
- Análisis estratégico (alertas, métricas, recomendaciones).

### 3. **Mercancía y almacenes**
- **Ubicación de la mercancía**: en qué almacén/bodega está cada producto o lote.
- **Por producto**: cantidad por almacén, valor, fecha de entrada.
- **Por almacén**: lista de almacenes (propios, terceros, puerto, tránsito), inventario en cada uno.
- **Movimientos**: entradas/salidas entre almacenes, fechas, referencias (pedido, compra, contenedor).
- *Datos necesarios*: tabla Almacenes, tabla Movimientos o ampliar Logística/Envíos con origen/destino tipo almacén.

### 4. **Clientes y crédito**
- **Clientes**: lista, contacto, país/región, crédito autorizado, uso actual, disponible.
- **Crédito por cliente**: límite, utilizado, disponible, antigüedad de saldos.
- **Historial**: pedidos, cobros, promesas de pago del cliente.
- **Alertas**: cliente cerca del límite, saldo vencido, promesa incumplida.
- *Datos necesarios*: Clientes (límite de crédito), CxC ya existente, Promesas de pago de clientes.

### 5. **Contenedores**
- **Seguimiento de contenedores**: número de contenedor, naviera, origen, destino, ETD/ETA, estado (en tránsito, en puerto, en aduana, recibido).
- **Contenido**: qué compras/pedidos/productos viajan en cada contenedor.
- **Timeline**: fechas clave (embarque, llegada puerto, salida aduana, llegada a almacén).
- **Costos**: flete, seguro, almacenaje puerto, etc.
- *Datos necesarios*: tabla Contenedores (ID, número, naviera, origen, destino, ETD, ETA, estado), relación Contenedor–Compras/Pedidos.

### 6. **Promesas de pago**
- **Promesas de pago – mercancía (proveedores)**: compra, proveedor, monto prometido, fecha prometida, estado (cumplida/pendiente/vencida), notas.
- **Promesas de pago – clientes**: cliente, venta/pedido, monto prometido, fecha prometida, estado, notas.
- **Vista unificada**: calendario o lista de todas las promesas con filtros (por tipo, por fecha, por estado).
- **Timer / alertas**: días para vencimiento, promesas vencidas.
- *Datos necesarios*: tabla PromesasPago (tipo: proveedor | cliente, id_compra o id_venta, monto, fecha_prometida, fecha_real, estado).

---

## Datos y fuentes sugeridas

| Módulo           | Fuente actual   | Ampliación sugerida |
|-----------------|-----------------|----------------------|
| Financiero      | Sheets / estático | Mantener + conectar Supabase cuando se migre |
| Mercancía       | —               | Almacenes, Movimientos (o ampliar envíos con tipo almacén) |
| Clientes        | Ventas, CxC     | Tabla Clientes (crédito, contacto), Promesas cliente |
| Contenedores    | —               | Tabla Contenedores, relación con Compras |
| Promesas de pago| —               | Tabla PromesasPago (proveedor + cliente) |

---

## Navegación propuesta

- **Inicio**: resumen ejecutivo.
- **Financiero**: todo lo actual (efectivo, CxC, CxP, ventas, compras, pagos, análisis).
- **Mercancía**: ubicación por almacén, movimientos.
- **Clientes**: lista, crédito, historial, promesas de pago.
- **Contenedores**: seguimiento por contenedor, fechas, contenido.
- **Promesas de pago**: vista unificada proveedores + clientes, con timer.

---

## Orden de implementación sugerido

1. **Navegación global** – Barra o menú con enlaces a cada módulo (algunos pueden ser “Próximamente”).
2. **Inicio** – Página de resumen que reúna KPIs principales y enlaces a módulos.
3. **Promesas de pago** – Reutilizar lógica de fechas y timers; estructura simple (tabla + filtros).
4. **Contenedores** – Modelo claro (contenedor → fechas → estado); tabla + detalle.
5. **Mercancía y almacenes** – Definir modelo de Almacenes y Movimientos; luego vistas por producto y por almacén.
6. **Clientes y crédito** – Ampliar ventana de clientes con crédito y promesas; después historial y alertas.

---

## Consideraciones técnicas

- **Fuente de verdad**: de momento Sheets; después migrar a Supabase y que el dashboard consuma API o Server Actions.
- **Filtros globales**: mantener filtro por fechas y por producto donde aplique; añadir filtro por almacén, por cliente, por contenedor según el módulo.
- **Diseño**: mismo estilo visual (colores, tarjetas, tablas) en todos los módulos para que se sienta un solo producto.
- **Permisos**: cuando existan roles (admin, ventas, logística), restringir módulos o acciones por rol.

Cuando definas prioridad (por ejemplo “primero contenedores y promesas”), se puede bajar esto a tareas de desarrollo por sprint.
