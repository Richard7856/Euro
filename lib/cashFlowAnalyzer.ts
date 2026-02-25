import {
    Venta,
    GastoDetallado,
    Compra,
    Inventario,
    CuentaPorCobrar,
    CashPositionKPIs,
    GastosPorCategoria,
    CashFlowData,
    CategoriaGasto,
    Envio
} from '@/types/financial';
import { format, parseISO, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';

/** Parsea fecha de forma segura (ISO, DD/MM/YY, Excel serial). Retorna null si es inválida. */
function safeParseDate(value: string | undefined): Date | null {
    if (!value || typeof value !== 'string') return null;
    const s = String(value).trim();
    if (!s) return null;
    try {
        if (s.includes('-')) {
            const d = parseISO(s);
            return isNaN(d.getTime()) ? null : d;
        }
        const m = s.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
        if (m) {
            const year = m[3].length === 2 ? 2000 + parseInt(m[3], 10) : parseInt(m[3], 10);
            const month = parseInt(m[2], 10) - 1;
            const day = parseInt(m[1], 10);
            const d = new Date(year, month, day);
            return isNaN(d.getTime()) ? null : d;
        }
        const num = parseFloat(s);
        if (!isNaN(num) && num > 0) {
            const d = new Date((num - 25569) * 86400 * 1000);
            return isNaN(d.getTime()) ? null : d;
        }
        const d = parseISO(s);
        return isNaN(d.getTime()) ? null : d;
    } catch {
        return null;
    }
}

export class CashFlowAnalyzer {
    private ventas: Venta[];
    private gastos: GastoDetallado[];
    private compras: Compra[];
    private inventario: Inventario[];
    private cuentasPorCobrar: CuentaPorCobrar[];
    private envios: Envio[];

    constructor(
        ventas: Venta[],
        gastos: GastoDetallado[],
        compras: Compra[],
        inventario: Inventario[],
        cuentasPorCobrar: CuentaPorCobrar[],
        envios: Envio[] = []
    ) {
        this.ventas = ventas;
        this.gastos = gastos;
        this.compras = compras;
        this.inventario = inventario;
        this.cuentasPorCobrar = cuentasPorCobrar;
        this.envios = envios ?? [];
    }

    // Calcular efectivo disponible (cobros - gastos pagados)
    calcularEfectivoDisponible(): number {
        const totalCobrado = this.ventas.reduce((sum, v) => sum + v.monto_pagado, 0);
        const totalGastos = this.gastos.reduce((sum, g) => sum + g.monto, 0);
        const comprasPagadas = this.compras.reduce((sum, c) => sum + c.pagado_mxn, 0);

        return totalCobrado - totalGastos - comprasPagadas;
    }

    // Calcular total de cuentas por cobrar
    calcularCuentasPorCobrar(): number {
        return this.cuentasPorCobrar
            .filter(c => c.monto_pendiente > 0)
            .reduce((sum, c) => sum + c.monto_pendiente, 0);
    }

    // Calcular valor del inventario
    calcularValorInventario(): number {
        return this.inventario.reduce((sum, i) => sum + i.valor_total, 0);
    }

    // Calcular capital en circulación
    calcularCapitalCirculacion(): number {
        return (
            this.calcularEfectivoDisponible() +
            this.calcularCuentasPorCobrar() +
            this.calcularValorInventario()
        );
    }

    // Calcular cuentas por pagar (usando pendiente_mxn)
    calcularCuentasPorPagar(): number {
        return this.compras
            .filter(c => c.pendiente_mxn > 0)
            .reduce((sum, c) => sum + c.pendiente_mxn, 0);
    }

    // Calcular flujo neto del mes actual
    calcularFlujoNetoMes(): number {
        const hoy = new Date();
        const mesActual = hoy.getMonth();
        const añoActual = hoy.getFullYear();

        const ingresosDelMes = this.ventas
            .filter(v => {
                const fecha = safeParseDate(v.fecha_pago);
                return fecha && fecha.getMonth() === mesActual && fecha.getFullYear() === añoActual;
            })
            .reduce((sum, v) => sum + v.monto_pagado, 0);

        const gastosDelMes = this.gastos
            .filter(g => {
                const fecha = safeParseDate(g.fecha);
                return fecha && fecha.getMonth() === mesActual && fecha.getFullYear() === añoActual;
            })
            .reduce((sum, g) => sum + g.monto, 0);

        return ingresosDelMes - gastosDelMes;
    }

    // Calcular burn rate (gasto promedio mensual)
    calcularBurnRate(): number {
        // Agrupar gastos por mes
        const gastosPorMes = new Map<string, number>();

        this.gastos.forEach(gasto => {
            const fecha = safeParseDate(gasto.fecha);
            if (!fecha) return;
            const mes = format(fecha, 'yyyy-MM');
            gastosPorMes.set(mes, (gastosPorMes.get(mes) || 0) + gasto.monto);
        });

        if (gastosPorMes.size === 0) return 0;

        const totalGastos = Array.from(gastosPorMes.values()).reduce((sum, g) => sum + g, 0);
        return totalGastos / gastosPorMes.size;
    }

    // Calcular runway (meses que dura el efectivo)
    calcularRunway(): number {
        const efectivo = this.calcularEfectivoDisponible();
        const burnRate = this.calcularBurnRate();

        if (burnRate <= 0) return 999; // Runway infinito si no hay gastos
        return Math.max(0, efectivo / burnRate);
    }

    // Generar KPIs de posición de efectivo
    generarCashPositionKPIs(): CashPositionKPIs {
        const efectivo = this.calcularEfectivoDisponible();
        const cuentasCobrar = this.calcularCuentasPorCobrar();
        const inventario = this.calcularValorInventario();
        const cuentasPagar = this.calcularCuentasPorPagar();
        const flujoNeto = this.calcularFlujoNetoMes();
        const burnRate = this.calcularBurnRate();
        const runway = this.calcularRunway();

        const gastosPorCategoria = this.analizarGastosPorCategoria();
        const almacenajeEnvios = this.envios.filter(e => (e.tipo_envio || '').toString().toLowerCase().includes('resguardo')).reduce((s, e) => s + (e.costo_envio || 0), 0);
        const logisticaEnvios = this.envios.filter(e => (e.tipo_envio || '').toString().toLowerCase().includes('compra')).reduce((s, e) => s + (e.costo_envio || 0), 0);
        const gastosALF = (gastosPorCategoria.find(g => g.categoria === 'almacenaje')?.total || 0) +
            (gastosPorCategoria.find(g => g.categoria === 'logistica')?.total || 0) +
            (gastosPorCategoria.find(g => g.categoria === 'fumigacion')?.total || 0) +
            almacenajeEnvios +
            logisticaEnvios;

        return {
            efectivo_disponible: {
                label: 'Cashflow',
                value: efectivo,
                format: 'currency',
                trend: efectivo > 0 ? 'up' : 'down'
            },
            cuentas_por_cobrar: {
                label: 'Cuentas por Cobrar',
                value: cuentasCobrar,
                format: 'currency',
                trend: 'neutral'
            },
            inventario_valor: {
                label: 'Valor de Inventario',
                value: inventario,
                format: 'currency',
                trend: 'neutral'
            },
            gastos_almacenaje_logistica_fumigacion: {
                label: 'Gastos Almacenaje, Logística y Fumigación',
                value: gastosALF,
                format: 'currency',
                trend: 'neutral'
            },
            cuentas_por_pagar: {
                label: 'Cuentas por Pagar',
                value: cuentasPagar,
                format: 'currency',
                trend: 'down'
            },
            flujo_neto_mes: {
                label: 'Flujo Neto del Mes',
                value: flujoNeto,
                format: 'currency',
                trend: flujoNeto > 0 ? 'up' : 'down'
            },
            burn_rate: {
                label: 'Burn Rate Mensual',
                value: burnRate,
                format: 'currency',
                trend: 'neutral'
            },
            runway_meses: {
                label: 'Runway (Meses)',
                value: runway,
                format: 'number',
                trend: runway > 6 ? 'up' : runway > 3 ? 'neutral' : 'down'
            }
        };
    }

    // Analizar gastos por categoría
    analizarGastosPorCategoria(): GastosPorCategoria[] {
        const categorias: Map<CategoriaGasto, { total: number; count: number }> = new Map();

        this.gastos.forEach(gasto => {
            const existing = categorias.get(gasto.categoria) || { total: 0, count: 0 };
            existing.total += gasto.monto;
            existing.count += 1;
            categorias.set(gasto.categoria, existing);
        });

        const totalGastos = Array.from(categorias.values()).reduce((sum, c) => sum + c.total, 0);

        return Array.from(categorias.entries()).map(([categoria, data]) => ({
            categoria,
            total: data.total,
            porcentaje: totalGastos > 0 ? (data.total / totalGastos) * 100 : 0,
            count: data.count
        })).sort((a, b) => b.total - a.total);
    }

    // Generar datos de waterfall de flujo de caja
    generarCashFlowWaterfall(): CashFlowData {
        const efectivoInicial = 0; // Podría ser el saldo anterior
        const cobros = this.ventas.reduce((sum, v) => sum + v.monto_pagado, 0);

        const gastosPorCategoria = this.analizarGastosPorCategoria();
        const almacenajeEnvios = this.envios.filter(e => (e.tipo_envio || '').toString().toLowerCase().includes('resguardo')).reduce((s, e) => s + (e.costo_envio || 0), 0);
        const logisticaEnvios = this.envios.filter(e => (e.tipo_envio || '').toString().toLowerCase().includes('compra')).reduce((s, e) => s + (e.costo_envio || 0), 0);
        const fumigacion = gastosPorCategoria.find(g => g.categoria === 'fumigacion')?.total || 0;
        const empaque = gastosPorCategoria.find(g => g.categoria === 'empaque')?.total || 0;
        const logistica = (gastosPorCategoria.find(g => g.categoria === 'logistica')?.total || 0) + logisticaEnvios;
        const almacenaje = (gastosPorCategoria.find(g => g.categoria === 'almacenaje')?.total || 0) + almacenajeEnvios;
        const operativo = gastosPorCategoria.find(g => g.categoria === 'operativo')?.total || 0;

        const compras_pagadas = this.compras.reduce((sum, c) => sum + c.pagado_mxn, 0);

        const efectivoFinal = efectivoInicial + cobros - fumigacion - empaque - logistica - almacenaje - compras_pagadas - operativo;

        return {
            efectivo_inicial: efectivoInicial,
            cobros: cobros,
            gastos_fumigacion: fumigacion,
            gastos_empaque: empaque,
            gastos_logistica: logistica,
            gastos_almacenaje: almacenaje,
            compras: compras_pagadas,
            otros_gastos: operativo,
            efectivo_final: efectivoFinal
        };
    }

    // Obtener cuentas por cobrar vencidas
    getCuentasVencidas(): CuentaPorCobrar[] {
        return this.cuentasPorCobrar
            .filter(c => c.monto_pendiente > 0 && c.dias_vencido > 0)
            .sort((a, b) => b.dias_vencido - a.dias_vencido);
    }

    // Obtener cuentas por vencer (próximos 30 días)
    getCuentasPorVencer(): CuentaPorCobrar[] {
        const hoy = new Date();
        return this.cuentasPorCobrar
            .filter(c => {
                if (c.monto_pendiente <= 0 || !c.fecha_vencimiento) return false;
                const vencimiento = safeParseDate(c.fecha_vencimiento);
                if (!vencimiento) return false;
                const diasParaVencer = differenceInDays(vencimiento, hoy);
                return diasParaVencer >= 0 && diasParaVencer <= 30;
            })
            .sort((a, b) => {
                const fa = safeParseDate(a.fecha_vencimiento);
                const fb = safeParseDate(b.fecha_vencimiento);
                if (!fa || !fb) return 0;
                return fa.getTime() - fb.getTime();
            });
    }

    // Obtener compras pendientes de pago
    getComprasPendientes(): Compra[] {
        return this.compras
            .filter(c => c.pendiente_mxn > 0)
            .sort((a, b) => b.pendiente_mxn - a.pendiente_mxn);
    }

    // Obtener productos con bajo inventario
    getProductosBajoInventario(umbral: number = 500): Inventario[] {
        return this.inventario
            .filter(i => i.cantidad_disponible < umbral && i.cantidad_disponible > 0)
            .sort((a, b) => a.cantidad_disponible - b.cantidad_disponible);
    }
}

// Funciones helper de formateo simples para usar fuera de la clase si es necesario
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}
