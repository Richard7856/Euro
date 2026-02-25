# Dashboard Financiero Euro

Dashboard financiero completo construido con Next.js, TypeScript y Tailwind CSS para análisis de ventas, compras, gastos y rentabilidad.

![Dashboard Preview](/.gemini/antigravity/brain/1350dd84-fe0f-4e43-a62c-081755865a90/dashboard_top_kpis_1769733637484.png)

## 🚀 Características

- **KPIs en Tiempo Real**: Ingresos, gastos, margen bruto y créditos pendientes
- **Análisis de Ventas**: Visualización mensual de ingresos vs gastos
- **Análisis por Canal**: Distribución de ventas por canal (Dante, Dante/Arabe)
- **Top Clientes**: Ranking de clientes con totales y créditos pendientes
- **Top Productos**: Análisis de productos más vendidos con márgenes
- **Gastos de Logística**: Seguimiento de costos de envío y almacenamiento
- **Diseño Premium**: Glassmorphism, dark mode, animaciones suaves

## 📋 Requisitos Previos

- Node.js 18+ 
- npm o yarn

## 🛠️ Instalación

```bash
# Instalar dependencias
npm install

# Ejecutar servidor de desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 📊 Stack Tecnológico

- **Framework**: Next.js 16 (App Router)
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS v4
- **Gráficos**: Recharts
- **Iconos**: Heroicons
- **Fechas**: date-fns

## 📁 Estructura del Proyecto

```
dashboard/
├── app/                    # App Router
│   ├── layout.tsx         # Layout principal
│   ├── page.tsx           # Dashboard principal
│   └── globals.css        # Estilos globales
├── components/            # Componentes React
│   ├── KPICard.tsx
│   ├── SalesChart.tsx
│   ├── ChannelAnalysis.tsx
│   ├── ClientAnalysis.tsx
│   ├── ProductTable.tsx
│   └── LogisticsChart.tsx
├── lib/                   # Utilidades y lógica
│   ├── financialAnalysis.ts
│   └── sampleData.ts
└── types/                 # Definiciones TypeScript
    └── financial.ts
```

## 📊 Dos modos de Dashboard

- **`/`** – Dashboard **estático** con datos de ejemplo (sampleData, cashFlowData)
- **`/dinamico`** – Dashboard **dinámico** conectado a Google Sheets en tiempo real

## 🔧 Configuración de Google Sheets (Dashboard Dinámico)

1. Copia `.env.local.example` a `.env.local`
2. Crea un proyecto en [Google Cloud Console](https://console.cloud.google.com)
3. Activa la **Google Sheets API**
4. Crea una **Service Account** y descarga el JSON de credenciales
5. Copia `client_email` y `private_key` al `.env.local`
6. Obtén el ID de tu Spreadsheet (está en la URL: `.../d/ID_AQUI/edit`)
7. **Comparte** tu Google Sheet con el email de la Service Account (como Editor)

### Variables en `.env.local`

```env
GOOGLE_SHEETS_ID=tu_spreadsheet_id
GOOGLE_SHEETS_CLIENT_EMAIL=tu-service-account@proyecto.iam.gserviceaccount.com
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### Nombres de hojas esperados

Ajusta `lib/sheetsConfig.ts` según tus hojas:

| Hoja | Uso |
|------|-----|
| Ventas | Cobros (ID_Venta, Fecha_Pago, Monto_Pagado...) |
| Pedidos | Pedidos (ID_Pedido, ID_Venta, ID_Cliente...) |
| DetallePedido | Detalle por pedido |
| Envios | Logística (ID_Cliente, Costo_Envio, Tipo_Envio...) |
| Compras | Compras a proveedores |
| Gastos | Gastos (fumigación, logística, almacenaje...) |
| Pagos | Pagos a proveedores |
| CxC | Cuentas por cobrar |
| Inventario | Productos en stock |

## 🚢 Deployment

### Vercel (Recomendado)

```bash
npm run build
vercel
```

### Otros Proveedores

```bash
npm run build
npm start
```

## 📈 Características del Motor de Análisis

El motor de análisis financiero (`lib/financialAnalysis.ts`) proporciona:

- Cálculo de ingresos totales
- Cálculo de gastos totales
- Margen bruto ((Ingresos - Gastos) / Ingresos * 100)
- Créditos pendientes (Pedidos - Cobros)
- Análisis por mes, producto, cliente y canal
- Rankings de clientes y productos
- Gastos de logística por mes

## 🎨 Sistema de Diseño

El dashboard usa un sistema de diseño premium con:

- **Glassmorphism**: Tarjetas translúcidas con efecto blur
- **Color Coding**: Verde para utilidades, rojo para pérdidas
- **Gradientes**: Transiciones suaves de color
- **Animaciones**: Efectos hover y transiciones
- **Responsive**: Adaptable a móviles, tablets y desktop

## 📝 Datos de Ejemplo

Los datos de ejemplo en `lib/sampleData.ts` están basados en las siguientes tablas:

- **Ventas (Cobros)**: Registros de pagos
- **Pedidos**: Órdenes de compra
- **Detalle de Pedidos**: Ítems por pedido
- **Envíos**: Costos de logística

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📄 Licencia

MIT

## 👤 Autor

Dashboard Financiero Euro - 2026
