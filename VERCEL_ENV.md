# Variables de entorno para Vercel

Configura en **Vercel → Project → Settings → Environment Variables**:

## Obligatorias

| Variable | Descripción | Dónde obtenerla |
|----------|-------------|------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon / public key | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role (secret) | Supabase → Settings → API → service_role |

## Opcionales

| Variable | Descripción |
|----------|-------------|
| `COTIZACIONES_BOT_API_KEY` | API key para el bot de cotizaciones (header `X-API-Key`) |

**Nota:** Sin las variables de Supabase, el middleware no aplica login. Las rutas `/api/bot/*` requieren `COTIZACIONES_BOT_API_KEY` o la key generada desde Perfiles.
