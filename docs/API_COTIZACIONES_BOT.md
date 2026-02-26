# API Cotizaciones Bot (Euromex)

API para que el bot de cotizaciones consulte productos, precios de proveedores y precio final de venta. **SKU = `id_producto`** en todo el sistema (el dashboard crea productos con ese ID; el bot lo usa como SKU).

- **Base URL:** `https://tu-dominio.vercel.app` (o tu URL de producción).
- **Alcance:** Solo empresa Euromex.
- **Autenticación:** API Key en header.

---

## Autenticación

Todas las peticiones deben incluir:

```
X-API-Key: <tu_api_key>
```

O bien:

```
Authorization: Bearer <tu_api_key>
```

La API key se configura en el dashboard (variable de entorno `COTIZACIONES_BOT_API_KEY`). Sin clave válida las rutas responden `401 No autorizado`.

---

## Endpoints

### 1. Listar productos (GET)

Obtener todos los productos con su precio de venta actual y últimos precios de proveedores.

**Request**

```
GET /api/bot/productos
```

Query params (opcionales):

| Parámetro | Tipo   | Descripción                          |
|----------|--------|--------------------------------------|
| `sku`    | string | Filtrar por un solo producto (SKU).  |

**Response 200**

```json
{
  "productos": [
    {
      "sku": "CGR",
      "nombre": "Cigarros",
      "precio_venta": 125.50,
      "moneda_venta": "MXN",
      "unidad": "kg",
      "ultimos_precios_proveedor": [
        {
          "id_proveedor": "PROV-01",
          "nombre_proveedor": "Tabacalera SA",
          "precio": 98.00,
          "moneda": "MXN",
          "unidad": "kg",
          "fecha": "2026-02-20",
          "fuente": "whatsapp"
        }
      ]
    }
  ]
}
```

- `sku`: identificador del producto (igual que `id_producto`).
- `precio_venta`: precio final vigente (de tabla precios_venta).
- `ultimos_precios_proveedor`: últimos precios recibidos por proveedor/producto (uno por combinación proveedor+producto).

---

### 2. Enviar nuevo precio de proveedor (POST)

Registrar un precio que envía un proveedor (ej. desde WhatsApp/email).

**Request**

```
POST /api/bot/precios-proveedor
Content-Type: application/json
```

**Body**

| Campo           | Tipo   | Requerido | Descripción                                |
|-----------------|--------|-----------|--------------------------------------------|
| `sku`           | string | Sí        | ID del producto (SKU).                     |
| `id_proveedor`  | string | Sí        | Identificador del proveedor.                |
| `precio`        | number | Sí        | Precio (≥ 0).                              |
| `nombre_proveedor` | string | No     | Nombre del proveedor.                      |
| `moneda`        | string | No        | Default `MXN`.                             |
| `unidad`        | string | No        | Default `kg`.                              |
| `fuente`        | string | No        | `api` \| `email` \| `whatsapp` \| `manual`. Default `api`. |
| `observaciones` | string | No        | Nota opcional.                             |

**Ejemplo**

```json
{
  "sku": "CGR",
  "id_proveedor": "PROV-01",
  "nombre_proveedor": "Tabacalera SA",
  "precio": 95.00,
  "moneda": "MXN",
  "unidad": "kg",
  "fuente": "whatsapp"
}
```

**Response 200**

```json
{
  "ok": true,
  "precio": {
    "id": "uuid",
    "id_producto": "CGR",
    "id_proveedor": "PROV-01",
    "precio": 95,
    "fecha": "2026-02-23",
    "created_at": "..."
  }
}
```

**Errores:** `400` (faltan sku, id_proveedor o precio); `404` (producto no existe); `401` (API key inválida).

---

### 3. Establecer precio final de venta (PATCH)

Actualizar o crear el precio de venta vigente para un producto (SKU).

**Request**

```
PATCH /api/bot/precios-venta
Content-Type: application/json
```

**Body**

| Campo        | Tipo   | Requerido | Descripción                    |
|-------------|--------|-----------|--------------------------------|
| `sku`       | string | Sí        | ID del producto (SKU).         |
| `precio_venta` | number | Sí     | Precio de venta (≥ 0).         |
| `moneda`    | string | No        | Default `MXN`.                 |
| `unidad`    | string | No        | Default `kg`.                  |

**Ejemplo**

```json
{
  "sku": "CGR",
  "precio_venta": 130.00,
  "moneda": "MXN",
  "unidad": "kg"
}
```

**Response 200**

```json
{
  "ok": true,
  "precio_venta": {
    "id_producto": "CGR",
    "precio_venta": 130,
    "moneda": "MXN",
    "vigente_desde": "2026-02-23"
  }
}
```

- Si ya existe un precio vigente para ese producto, se actualiza.
- Si no existe, se crea uno nuevo vigente desde hoy.

**Errores:** `400` (falta sku o precio_venta); `404` (producto no existe); `401` (API key inválida).

---

## Resumen para el bot

| Acción                         | Método | Ruta                      | Body principal                          |
|--------------------------------|--------|---------------------------|-----------------------------------------|
| Listar productos y precios     | GET    | `/api/bot/productos`       | —                                       |
| Un producto por SKU            | GET    | `/api/bot/productos?sku=X` | —                                       |
| Enviar precio de proveedor    | POST   | `/api/bot/precios-proveedor` | `sku`, `id_proveedor`, `precio`     |
| Establecer precio final venta  | PATCH  | `/api/bot/precios-venta`   | `sku`, `precio_venta`                   |

---

## Notas

- Los productos se crean desde el **dashboard** (Mercancía / Precios). El bot solo hace **GET** para saber cuáles existen y qué precios tienen.
- **SKU** en la API = **id_producto** en base de datos (ej. `CGR`, `CRQ`, `PROD-001`).
- Todas las rutas bajo `/api/bot/*` están pensadas para consumo por el bot (API key). El dashboard sigue usando sesión de usuario en `/api/precios-proveedor`, `/api/precios-venta`, etc.
