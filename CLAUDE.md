# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server (localhost:3000)
npm run build    # Build for production
npm run lint     # Run ESLint
npm start        # Start production server
```

No test suite is configured.

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

Optional (Bot API):
```
COTIZACIONES_BOT_API_KEY
```

## Architecture

**Next.js 16 App Router** with TypeScript, Tailwind CSS v4, Supabase (auth + PostgreSQL), and Recharts.

### Authentication & Authorization

`middleware.ts` protects all routes via Supabase session. Key exceptions:
- `/api/supabase-health` — fully public
- `/api/bot/*` — public but requires `X-API-Key` header (validated via `lib/botAuth.ts`)
- `/perfiles`, `/usuarios` — admin-only (role checked in middleware)

Two Supabase clients exist:
- `lib/supabase/client.ts` — browser client (anon key)
- `lib/supabase/server.ts` — server client (uses cookies)
- `lib/supabase/admin.ts` — service role client for admin operations (bypasses RLS)

### Multi-Tenant Company Context

Three companies are supported: `euromex`, `garritas`, `cigarros`. The active company is managed by `EmpresaProvider` (`lib/empresaContext.tsx`), persisted in localStorage + cookie. All data fetches must filter by `empresa` slug. Each company has its own color theme (emerald/red/amber).

### State Management (Context API)

Three global contexts in `app/layout.tsx`:
- `EmpresaProvider` — active company selection and theming
- `ProfileProvider` (`lib/profileContext.tsx`) — authenticated user, role (`admin`, `ventas`, `logistica`, `finanzas`, `usuario`), and per-module access overrides
- `CurrencyProvider` (`lib/currencyContext.tsx`) — MXN/USD toggle with exchange rate from `/api/config`

### API Route Conventions

All API routes live in `app/api/[resource]/route.ts`. Standard REST handlers (GET/POST/PATCH/DELETE).

Bot API routes (`app/api/bot/*`) are authenticated via API key only — no session required. Regular routes rely on the Supabase session.

### Business Logic

- `lib/cashFlowAnalyzer.ts` — `CashFlowAnalyzer` class that computes all financial KPIs (cash position, receivables, inventory value, payables)
- `lib/financialAnalysis.ts` — revenue, expenses, gross margin, top clients/products
- `lib/dateUtils.ts` — `safeParseDate()` handles ISO, DD/MM/YY, and Excel serial number formats
- `lib/exportUtils.ts` — CSV/Excel export helpers

### Data Flow

Pages are client components (`'use client'`) that fetch from internal API routes via `fetch()`. The API routes query Supabase directly. No ORM — raw Supabase query builder.

The financial page (`app/financiero/page.tsx`) uses a shared `mapApiResponse()` helper to normalize API data, consumed by both the initial load `useEffect` and the manual refresh handler.

### Alertas (Data Quality Panel)

`/alertas` — Centro de Alertas that surfaces data quality issues:
- **Compras incompletas**: purchases missing `producto_nombre`, `id_proveedor`, `cantidad_compra`, or `costo_unitario`
- **Compras vencidas**: purchases with `estado_pago = 'Pendiente'` and `fecha_vencimiento` in the past
- **Perfiles incompletos**: profiles with `nombre IS NULL` or `activo = false`

API: `GET /api/alertas` — uses the admin client to read profiles (bypasses RLS), filters by `empresa_id`.

### Key Type Definitions

All domain types are in `types/financial.ts`: `Venta`, `Pedido`, `Compra`, `Inventario`, `MovimientoInventario`, `PrecioProveedor`, `PrecioVenta`, `CuentaPorCobrar`, KPI types, etc.
