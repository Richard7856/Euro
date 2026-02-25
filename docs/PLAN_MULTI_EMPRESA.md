# Plan: mismo dashboard para 3 empresas (multi-tenant)

## Empresas

| Empresa   | Descripción        | Notas        |
|-----------|--------------------|--------------|
| **Euromex** | Import/Export (actual) | Dashboard actual |
| **Garritas** | Croquetas           | Mismo dash, mismas tablas |
| **Cigarros** | Cigarros             | Mismo dash, mismas tablas |

Objetivo: un solo código (mismo dash, mismas tablas en Supabase) con datos separados por empresa. Perfiles y roles siguen siendo importantes (admin por empresa, ventas, logística, etc.).

---

## Enfoque recomendado: columna `empresa_id` (tenant)

- **Misma base de datos**, mismas tablas.
- Añadir en las tablas relevantes una columna **`empresa_id`** (o `tenant_id`) que identifique la empresa (Euromex, Garritas, Cigarros).
- **`profiles`**: cada usuario puede pertenecer a una o más empresas y tener un rol por empresa, o un único rol global. Opciones:
  - **Opción A (simple):** en `profiles` añadir `empresa_id` (nullable). Un usuario pertenece a una empresa; si es null, “superadmin” o sin asignar.
  - **Opción B (más flexible):** tabla `perfil_empresa` (user_id, empresa_id, rol). Un usuario puede tener distinto rol en cada empresa.

### Tablas a tocar (cuando se implemente)

- **`profiles`**: añadir `empresa_id` (FK a una nueva tabla `empresas`) o usar tabla `perfil_empresa`.
- **`empresas`**: id, nombre, slug (euromex, garritas, cigarros), activo.
- Resto de tablas de negocio (clientes, proveedores, gastos, compras, ventas, etc.): añadir `empresa_id` y filtrar siempre por la empresa del usuario (o la empresa seleccionada en el dashboard).

### RLS (Row Level Security)

- Políticas que incluyan `empresa_id` en el `USING`: por ejemplo, “solo ver filas donde `empresa_id` = la empresa del usuario actual”.
- La empresa del usuario actual se puede obtener desde `profiles` (donde id = auth.uid()) o desde una tabla `perfil_empresa`. Para evitar recursión en RLS, usar solo `auth.uid()` en políticas de `profiles` y, para el resto, usar una función `SECURITY DEFINER` que devuelva el `empresa_id` del usuario (leyendo `profiles` o `perfil_empresa` una sola vez).

### UI

- Selector de empresa en el header o sidebar (Euromex / Garritas / Cigarros). Al cambiar, se guarda en contexto o en la sesión y todas las lecturas/escrituras usan ese `empresa_id`.
- Mismo menú y mismas pantallas; solo cambian los datos según la empresa seleccionada y el rol del usuario en esa empresa.

### Resumen de pasos (cuando se implemente)

1. Crear tabla **`empresas`** (id, nombre, slug, activo).
2. Añadir **`empresa_id`** a **`profiles`** (o crear **`perfil_empresa`**).
3. Añadir **`empresa_id`** a las tablas de negocio y filtrar en APIs y RLS.
4. Actualizar RLS para que todo sea por `empresa_id` + rol (evitando recursión).
5. Añadir selector de empresa en el dashboard y pasar `empresa_id` en todas las llamadas/APIs.

Este documento sirve como guía; la implementación concreta se puede hacer por fases (primero Euromex + Garritas, luego Cigarros, etc.).
