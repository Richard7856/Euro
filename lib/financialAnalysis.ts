import {
    Venta,
    Pedido,
    DetallePedido,
    Envio,
    DashboardData,
    KPI,
    ProductoAnalisis,
    ClienteAnalisis,
    CanalAnalisis
} from '@/types/financial';
import { format, parseISO, startOfMonth, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';

export class FinancialAnalyzer {
    private ventas: Venta[];
    private pedidos: Pedido[];
    private detallesPedido: DetallePedido[];
    private envios: Envio[];

    constructor(
        ventas: Venta[],
        pedidos: Pedido[],
        detallesPedido: DetallePedido[],
        envios: Envio[]
    ) {
        this.ventas = ventas;
        this.pedidos = pedidos;
        this.detallesPedido = detallesPedido;
        this.envios = envios;
    }

    // Calcular ingresos totales
    calcularIngresosTotales(): number {
        return this.ventas.reduce((sum, venta) => sum + venta.monto_pagado, 0);
    }

    // Calcular gastos totales (envíos)
    calcularGastosTotales(): number {
        return this.envios.reduce((sum, envio) => sum + envio.costo_envio, 0);
    }

    // Calcular margen bruto
    calcularMargenBruto(): number {
        const ingresos = this.calcularIngresosTotales();
        const gastos = this.calcularGastosTotales();
        if (ingresos === 0) return 0;
        return ((ingresos - gastos) / ingresos) * 100;
    }

    // Calcular créditos pendientes (diferencia entre pedidos y cobros)
    calcularCreditosPendientes(): number {
        const totalPedidos = this.pedidos.reduce((sum, p) => sum + p.total_pedido, 0);
        const totalCobrado = this.calcularIngresosTotales();
        return totalPedidos - totalCobrado;
    }

    // Análisis de ventas por mes
    ventasPorMes(): { mes: string; ingresos: number; gastos: number; margen: number }[] {
        const mesesMap = new Map<string, { ingresos: number; gastos: number }>();

        // Agregar ingresos por mes
        this.ventas.forEach(venta => {
            if (!venta.fecha_pago) return;
            try {
                const fecha = parseISO(venta.fecha_pago);
                const mes = format(fecha, 'MMM yyyy', { locale: es });
                const current = mesesMap.get(mes) || { ingresos: 0, gastos: 0 };
                current.ingresos += venta.monto_pagado;
                mesesMap.set(mes, current);
            } catch (e) {
                // Ignorar fechas inválidas
            }
        });

        // Agregar gastos por mes
        this.envios.forEach(envio => {
            if (!envio.fecha_envio) return;
            try {
                const fecha = parseISO(envio.fecha_envio);
                const mes = format(fecha, 'MMM yyyy', { locale: es });
                const current = mesesMap.get(mes) || { ingresos: 0, gastos: 0 };
                current.gastos += envio.costo_envio;
                mesesMap.set(mes, current);
            } catch (e) {
                // Ignorar fechas inválidas
            }
        });

        return Array.from(mesesMap.entries())
            .map(([mes, data]) => ({
                mes,
                ingresos: data.ingresos,
                gastos: data.gastos,
                margen: data.ingresos > 0 ? ((data.ingresos - data.gastos) / data.ingresos) * 100 : 0
            }))
            .sort((a, b) => a.mes.localeCompare(b.mes));
    }

    // Productos más vendidos
    productosTop(limit = 10): ProductoAnalisis[] {
        const productosMap = new Map<string, ProductoAnalisis>();

        this.detallesPedido.forEach(detalle => {
            const existing = productosMap.get(detalle.id_producto) || {
                id_producto: detalle.id_producto,
                nombre_producto: detalle.id_producto,
                total_vendido: 0,
                cantidad_vendida: 0,
                margen_promedio: 0,
                ingresos: 0
            };

            existing.total_vendido += detalle.subtotal;
            existing.cantidad_vendida += detalle.cantidad_vendida;
            existing.ingresos += detalle.subtotal;

            productosMap.set(detalle.id_producto, existing);
        });

        // Calcular márgenes
        productosMap.forEach((producto, id) => {
            const ventas = this.ventas.filter(v => v.id_producto === id);
            const ingresos = ventas.reduce((sum, v) => sum + v.monto_pagado, 0);
            const costos = this.envios
                .filter(e => e.id_compra?.includes(id.split('_')[0]))
                .reduce((sum, e) => sum + e.costo_envio, 0);

            if (ingresos > 0) {
                producto.margen_promedio = ((ingresos - costos) / ingresos) * 100;
            }
        });

        return Array.from(productosMap.values())
            .sort((a, b) => b.total_vendido - a.total_vendido)
            .slice(0, limit);
    }

    // Clientes top
    clientesTop(limit = 10): ClienteAnalisis[] {
        const clientesMap = new Map<string, ClienteAnalisis>();

        this.detallesPedido.forEach(detalle => {
            if (!detalle.id_cliente) return;

            const existing = clientesMap.get(detalle.id_cliente) || {
                id_cliente: detalle.id_cliente,
                total_compras: 0,
                total_pedidos: 0,
                credito_pendiente: 0,
                ultimo_pedido: ''
            };

            existing.total_compras += detalle.subtotal;
            existing.total_pedidos += 1;

            clientesMap.set(detalle.id_cliente, existing);
        });

        // Calcular créditos pendientes por cliente
        clientesMap.forEach((cliente, id) => {
            const pedidosCliente = this.pedidos.filter(p => p.id_cliente === id);
            const totalPedidos = pedidosCliente.reduce((sum, p) => sum + p.total_pedido, 0);

            const ventasCliente = this.ventas.filter(v => {
                const detalles = this.detallesPedido.filter(d => d.id_venta === v.id_venta && d.id_cliente === id);
                return detalles.length > 0;
            });
            const totalCobrado = ventasCliente.reduce((sum, v) => sum + v.monto_pagado, 0);

            cliente.credito_pendiente = totalPedidos - totalCobrado;

            // Última fecha de pedido
            const fechas = pedidosCliente
                .map(p => p.fecha_pedido)
                .filter(f => f)
                .sort()
                .reverse();
            cliente.ultimo_pedido = fechas[0] || '';
        });

        return Array.from(clientesMap.values())
            .sort((a, b) => b.total_compras - a.total_compras)
            .slice(0, limit);
    }

    // Análisis por canal
    canalesAnalisis(): CanalAnalisis[] {
        const canalesMap = new Map<string, { ingresos: number; num_ventas: number }>();

        this.pedidos.forEach(pedido => {
            const canal = pedido.canal_venta || 'Desconocido';
            const existing = canalesMap.get(canal) || { ingresos: 0, num_ventas: 0 };
            existing.ingresos += pedido.total_pedido;
            existing.num_ventas += 1;
            canalesMap.set(canal, existing);
        });

        const totalIngresos = Array.from(canalesMap.values()).reduce((sum, c) => sum + c.ingresos, 0);

        return Array.from(canalesMap.entries()).map(([canal, data]) => ({
            canal,
            ingresos: data.ingresos,
            porcentaje: totalIngresos > 0 ? (data.ingresos / totalIngresos) * 100 : 0,
            num_ventas: data.num_ventas
        }));
    }

    // Gastos de logística por mes
    gastosLogisticaPorMes(): { mes: string; costo: number }[] {
        const mesesMap = new Map<string, number>();

        this.envios.forEach(envio => {
            if (!envio.fecha_envio) return;
            try {
                const fecha = parseISO(envio.fecha_envio);
                const mes = format(fecha, 'MMM yyyy', { locale: es });
                const current = mesesMap.get(mes) || 0;
                mesesMap.set(mes, current + envio.costo_envio);
            } catch (e) {
                // Ignorar fechas inválidas
            }
        });

        return Array.from(mesesMap.entries())
            .map(([mes, costo]) => ({ mes, costo }))
            .sort((a, b) => a.mes.localeCompare(b.mes));
    }

    // Generar dashboard completo
    generarDashboard(): DashboardData {
        const ingresos = this.calcularIngresosTotales();
        const gastos = this.calcularGastosTotales();
        const margen = this.calcularMargenBruto();
        const creditos = this.calcularCreditosPendientes();

        return {
            kpis: {
                ingresos_totales: {
                    label: 'Ingresos Totales',
                    value: ingresos,
                    format: 'currency',
                    trend: 'up'
                },
                gastos_totales: {
                    label: 'Gastos Totales',
                    value: gastos,
                    format: 'currency',
                    trend: 'down'
                },
                margen_bruto: {
                    label: 'Margen Bruto',
                    value: margen,
                    format: 'percentage',
                    trend: margen > 50 ? 'up' : 'neutral'
                },
                creditos_pendientes: {
                    label: 'Créditos Pendientes',
                    value: creditos,
                    format: 'currency',
                    trend: creditos < 0 ? 'up' : 'down'
                }
            },
            ventas_por_mes: this.ventasPorMes(),
            productos_top: this.productosTop(10),
            clientes_top: this.clientesTop(10),
            canales: this.canalesAnalisis(),
            gastos_logistica: this.gastosLogisticaPorMes()
        };
    }
}

// Función helper para formatear moneda
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN'
    }).format(amount);
}

// Función helper para formatear porcentaje
export function formatPercentage(value: number): string {
    return `${value.toFixed(2)}%`;
}

// Función helper para formatear número
export function formatNumber(value: number): string {
    return new Intl.NumberFormat('es-MX').format(value);
}
