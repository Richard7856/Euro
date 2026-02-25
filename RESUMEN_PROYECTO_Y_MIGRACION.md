# Resumen del proyecto Euro Dashboard y migración Sheets → Supabase

## Qué es el proyecto

**Euro Dashboard** es un dashboard financiero y operativo para una empresa de import/export. Está construido con:

- **Next.js 16** (App Router), **TypeScript**, **Tailwind CSS v4**
- **Supabase**: autenticación (login, 2FA), sesión (middleware) y ya varias tablas en uso
- **Google Sheets**: actualmente la fuente de datos del dashboard “en vivo” (`/dinamico`)

### Módulos actuales

| Ruta | Descripción | Fuente de datos |
|------|-------------|-----------------|
| `/` | Inicio – resumen ejecutivo, KPIs, enlaces a módulos | Datos estáticos (sampleData, cashFlowData) |
| `/financiero` | Efectivo, CxC, CxP, ventas, compras, pagos, análisis | Estático |
| `/dinamico` | **Datos en vivo** – KPIs, ventas, compras, gastos, CxC, inventario, etc. | **Google Sheets** (`/api/sheets`) |
| `/clientes` | Lista y alta de clientes | **Supabase** (`/api/clientes`) |
| `/proveedores` | Lista y alta de proveedores | **Supabase** (`/api/proveedores`) |
| `/gastos` | Registro de gastos | **Supabase** (`/api/gastos`) |
| `/registros` (API) | Registro de mensajes (cliente, proveedor, gasto, nota, etc.) | **Supabase** (`/api/registros`) |
| `/login`, `/configurar-2fa` | Login y 2FA | **Supabase Auth** |
| `/mercancia`, `/contenedores`, `/promesas`, `/cobranza` | Módulos en desarrollo o placeholder | Varios |

---

## Estado de Supabase

### Conexión

- **Comprobación**: `GET /api/supabase-health` (público, sin login).
- **Resultado**: Conexión correcta; tabla `registros` accesible.

### Tablas en uso en Supabase

- **`registros`**: bitácora de mensajes (tipo, mensaje_original, datos, usuario_id).
- **`clientes`**: id_cliente, nombre_cliente, y campos opcionales (rfc, contacto, teléfono, email, etc.).
- **`proveedores`**: id_proveedor, nombre_proveedor, updated_at.
- **`gastos`**: categoria, monto, descripcion, usuario_id.

Auth: usuarios vía Supabase Auth (email/password + 2FA opcional).

---

## Dónde se usa Google Sheets

1. **`/dinamico`**  
   - La página llama a `GET /api/sheets`.  
   - Esa API usa `lib/googleSheets.ts` + `lib/sheetsConfig.ts` + `lib/sheetsMappers.ts` para leer un único Spreadsheet y devolver:
     - ventas (Cobros)
     - pedidos (Ventas)
     - envios (LogisticaEnvios)
     - compras (Compras)
     - gastos (Fumigación)
     - pagos (PagosCompra)
     - cuentasPorCobrar (derivado de Ventas)
     - inventario (Productos)

2. **Variables de entorno** (ver `.env.local.example`):
   - `GOOGLE_SHEETS_ID`
   - `GOOGLE_SHEETS_CLIENT_EMAIL`
   - `GOOGLE_SHEETS_PRIVATE_KEY`

3. **Referencias en UI/docs**  
   - En inicio: “Datos en vivo” descrito como “Dashboard conectado a Google Sheets”.  
   - En financiero: enlace “Datos en vivo (Sheets)”.  
   - En `/dinamico`: textos “Google Sheets”, “Conectando con Google Sheets”.

---

## Plan para quitar Sheets y dejar Supabase fijo

### Objetivo

Que **Supabase sea la única fuente de verdad** para los datos del dashboard en vivo, y eliminar dependencia de Google Sheets y de `/api/sheets`.

### Pasos sugeridos

1. **Modelo en Supabase**  
   Definir (o ampliar) tablas que reflejen lo que hoy sale de Sheets, por ejemplo:
   - **ventas/cobros**: id_venta, id_producto, canal_cobro, fecha_pago, metodo_pago, monto_pagado, etc.
   - **pedidos**: id_pedido, id_venta, id_cliente, fecha_pedido, canal_venta, cantidad, precio_unitario, subtotal, etc.
   - **envios**: id_envio, producto, id_cliente, id_compra, tipo_envio, fecha_envio, costo_envio, etc.
   - **compras**: id_compra, id_producto, id_proveedor, fecha_compra, cantidad, costo_unitario, subtotal, moneda, estado_pago, etc.
   - **gastos** (ya existe; unificar con “Fumigación” si hace falta): categoria, monto, descripcion, fecha, etc.
   - **pagos**: id_pago, id_compra, fecha_pago, monto_pago, metodo_pago, referencia.
   - **inventario/productos**: id_producto, nombre, categoría, unidad, costo_ref, precio_venta, etc.
   - **CxC**: puede ser vista o tabla derivada de ventas/pedidos y cobros.

2. **Migración de datos**  
   - Un único script o job que lea del Spreadsheet (usando la lógica actual de `fetchAllSheetsData` + mappers) e inserte/actualice las tablas de Supabase.  
   - Ejecutarlo una vez para histórico; luego opcionalmente mantener Sheets solo como respaldo o dejar de usarlo.

3. **Nueva API de datos**  
   - Crear algo como `GET /api/datos` (o `/api/dashboard-datos`) que lea de las tablas de Supabase y devuelva el mismo “shape” que hoy devuelve `/api/sheets` (ventas, pedidos, envios, compras, gastos, pagos, cuentasPorCobrar, inventario).  
   - Así la página `/dinamico` no cambia de contrato, solo de URL.

4. **Cambiar el front**  
   - En `/dinamico`: sustituir `fetch('/api/sheets')` por `fetch('/api/datos')` (o la ruta que elijas).  
   - Actualizar textos y enlaces: quitar “Google Sheets”, poner “Supabase” o “Datos en vivo” sin mencionar Sheets.

5. **Quitar código de Sheets**  
   - Dejar de usar `lib/googleSheets.ts`, `lib/sheetsConfig.ts`, `lib/sheetsMappers.ts` en el flujo principal.  
   - Eliminar o deprecar `GET /api/sheets`.  
   - Quitar del `.env.local.example` (y documentación) las variables `GOOGLE_SHEETS_*` cuando ya no se usen.

6. **Comprobar de nuevo**  
   - Volver a llamar a `GET /api/supabase-health` y a las APIs que usen Supabase (clientes, proveedores, gastos, registros) para confirmar que todo sigue funcionando con Supabase como única fuente.

---

## Resumen de estado

| Aspecto | Estado |
|--------|--------|
| Proyecto | Dashboard Euro (Next.js + Supabase + Sheets) |
| Conexión Supabase | OK (verificado con `/api/supabase-health`) |
| Auth y tablas (registros, clientes, proveedores, gastos) | En uso en Supabase |
| Datos “en vivo” (`/dinamico`) | Hoy 100% desde Google Sheets vía `/api/sheets` |
| Siguiente paso | Crear `GET /api/datos` que lea de Supabase, migrar datos desde Sheets (opcional), cambiar `/dinamico` a esa API y quitar Sheets |

Cuando quieras, el siguiente paso concreto puede ser: esbozar el código de `GET /api/datos` leyendo de las tablas ya creadas en Supabase.

---

## Mapeo Google Sheets → Supabase (implementado vía MCP dash_euro)

Las tablas en Supabase ya están creadas y alineadas con la estructura que tenías en Sheets (definida en `lib/sheetsMappers.ts` y `types/financial.ts`). **No hace falta compartir de nuevo la estructura de Sheets**; ya estaba definida en el código.

| Hoja en Sheets   | Tabla en Supabase | Notas |
|------------------|-------------------|--------|
| **Cobros**       | `cobros`          | id_venta, id_producto, canal_cobro, fecha_pago, metodo_pago, monto_pagado, evidencia, notas |
| **Ventas**       | `pedidos`         | id_pedido, id_venta, id_compra, id_cliente, fecha_pedido, canal_venta, total_pedido, estado_pedido, etc. |
| **LogisticaEnvios** | `envios`       | id_envio, producto, id_cliente, id_compra, tipo_envio, costo_envio, origen, destino, etc. |
| **Compras**      | `compras`         | id_compra, id_producto, producto_nombre, fecha_compra, id_proveedor, tipo_compra, cantidad_compra, subtotal, estado_pago, etc. |
| **Fumigación**   | `gastos` (existente) | Ya existía; categoria + monto + descripcion + fecha. Para fumigación usar categoria = 'fumigacion'. |
| **PagosCompra**  | `pagos_compra`    | id_pago, id_compra, fecha_pago, monto_pago, metodo_pago, referencia |
| **Productos**    | `productos`       | id_producto, nombre_producto, cantidad_disponible, valor_unitario_promedio, valor_total, etc. |
| **CxC** (Ventas agregadas) | *(cálculo)* | Se calcula en el backend a partir de `pedidos` + `cobros` (igual que en `/api/sheets`). |

Todas las tablas nuevas tienen **RLS** habilitado y política para usuarios **authenticated**. Migraciones aplicadas: `create_productos_inventario`, `create_cobros_ventas`, `create_pedidos`, `create_compras`, `create_pagos_compra`, `create_envios`.

---

## Migración completada y perfiles/roles

### Cambios realizados

1. **`GET /api/datos`**  
   - Lee de Supabase (cobros, pedidos, envios, compras, gastos, pagos_compra, productos) y devuelve el mismo formato que antes `/api/sheets`.  
   - Requiere usuario autenticado.

2. **`/dinamico`**  
   - Usa `fetch('/api/datos')` en lugar de `/api/sheets`.  
   - Textos actualizados a "Supabase" (sin referencias a Google Sheets).

3. **Perfiles y roles (Supabase)**  
   - Tabla **`profiles`**: `id` (FK a auth.users), `email`, `nombre`, `rol`, `activo`.  
   - Roles: `admin`, `ventas`, `logistica`, `finanzas`, `usuario`.  
   - Trigger: al crear un usuario en Auth se crea fila en `profiles` con rol `usuario`.  
   - RLS: cada usuario ve/edita su perfil; solo **admin** puede ver todos y cambiar roles.

4. **Login y autenticación**  
   - Login existente (email/password + 2FA) sin cambios.  
   - **Middleware**: redirige a `/login` si no hay sesión; **`/perfiles`** solo es accesible si `profiles.rol = 'admin'`.

5. **UI por perfil**  
   - **ProfileProvider** en el layout: carga `/api/profile` y expone `profile`, `isAdmin`, `hasRole()`.  
   - Nav: muestra nombre/email y **rol** del usuario; enlace "Perfiles" solo visible para admin.  
   - Página **`/perfiles`**: lista de usuarios y selector de rol (solo admin puede cambiar roles).

6. **APIs**  
   - `GET /api/profile`: perfil del usuario (crea uno por defecto si no existe).  
   - `PATCH /api/profile`: actualizar nombre (propio) o rol (admin puede pasar `user_id`).  
   - `GET /api/perfiles`: lista de perfiles (solo admin).  
   - `POST /api/migrate-sheets`: migración única Sheets → Supabase (solo admin); requiere tener Google Sheets configurado en `.env.local`.

### Cómo dejar un usuario como admin

En Supabase (SQL o Table Editor), ejecutar una vez:

```sql
UPDATE public.profiles SET rol = 'admin' WHERE email = 'tu@email.com';
```

(o por `id` si lo conoces). Solo así ese usuario podrá entrar a `/perfiles` y ejecutar la migración Sheets → Supabase si la usas.
