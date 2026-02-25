# Variables de entorno para Vercel

Configura en **Vercel → Project → Settings → Environment Variables** (todas las que uses):

## Obligatorias para login y API

| Variable | Descripción | Dónde obtenerla |
|----------|-------------|------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon / public key | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role (secret) | Supabase → Settings → API → service_role |

## Opcionales

| Variable | Descripción |
|----------|-------------|
| `GOOGLE_SHEETS_ID` | ID del spreadsheet (Dashboard dinámico / datos) |
| `GOOGLE_SHEETS_CLIENT_EMAIL` | Service account email (Google Cloud) |
| `GOOGLE_SHEETS_PRIVATE_KEY` | Private key del service account (entre comillas, con `\n` para saltos de línea) |

**Nota:** Sin las variables de Supabase, el middleware no aplica login; con ellas, las rutas exigen autenticación y `/login` usa Supabase.
