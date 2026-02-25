'use client';

import { CuentaPorCobrar } from '@/types/financial';

interface ReceivablesPanelProps {
    cuentas: CuentaPorCobrar[];
}

export default function ReceivablesPanel({ cuentas }: ReceivablesPanelProps) {
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    };

    const cuentasActivas = cuentas.filter(c => c.monto_pendiente > 0);
    const totalPendiente = cuentasActivas.reduce((sum, c) => sum + c.monto_pendiente, 0);
    const vencidas = cuentasActivas.filter(c => c.estado === 'vencido');
    const porVencer = cuentasActivas.filter(c => c.estado === 'por_vencer');
    const vigentes = cuentasActivas.filter(c => c.estado === 'vigente');

    const getEstadoStyle = (estado: string) => {
        switch (estado) {
            case 'vencido':
                return 'bg-red-500/10 border-red-500/30 text-red-400';
            case 'por_vencer':
                return 'bg-orange-500/10 border-orange-500/30 text-orange-400';
            default:
                return 'theme-accent-muted-bg border theme-accent-border theme-accent';
        }
    };

    const getEstadoLabel = (estado: string) => {
        switch (estado) {
            case 'vencido':
                return 'Vencido';
            case 'por_vencer':
                return 'Por Vencer';
            default:
                return 'Vigente';
        }
    };

    return (
        <div className="chart-container">
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h3 className="text-xl font-bold text-slate-50">
                        Cuentas por Cobrar
                    </h3>
                    <p className="text-sm text-slate-400 mt-1">
                        {cuentasActivas.length} {cuentasActivas.length === 1 ? 'cuenta activa' : 'cuentas activas'}
                    </p>
                </div>
                <div className="text-right">
                    <div className="text-sm text-slate-400">Total Pendiente</div>
                    <div className="text-2xl font-bold text-orange-400">
                        {formatCurrency(totalPendiente)}
                    </div>
                </div>
            </div>

            {/* Resumen por estado */}
            <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="p-3 rounded-lg theme-accent-muted-bg border theme-accent-border">
                    <div className="text-xs theme-accent-light">Vigentes</div>
                    <div className="text-lg font-bold theme-accent">{vigentes.length}</div>
                </div>
                <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/30">
                    <div className="text-xs text-orange-300">Por Vencer</div>
                    <div className="text-lg font-bold text-orange-400">{porVencer.length}</div>
                </div>
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                    <div className="text-xs text-red-300">Vencidas</div>
                    <div className="text-lg font-bold text-red-400">{vencidas.length}</div>
                </div>
            </div>

            {/* Lista de cuentas */}
            <div className="space-y-3">
                {cuentasActivas
                    .sort((a, b) => {
                        // Ordenar por: vencidas primero, luego por vencer, luego vigentes
                        const ordenEstado = { vencido: 0, por_vencer: 1, vigente: 2 };
                        return ordenEstado[a.estado] - ordenEstado[b.estado];
                    })
                    .map((cuenta) => (
                        <div
                            key={cuenta.id_venta}
                            className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 hover:bg-slate-800/60 transition-all duration-200"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h4 className="font-semibold text-slate-100">
                                            {cuenta.nombre_cliente}
                                        </h4>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getEstadoStyle(cuenta.estado)}`}>
                                            {getEstadoLabel(cuenta.estado)}
                                        </span>
                                        {cuenta.dias_vencido > 0 && (
                                            <span className="text-xs text-red-400">
                                                {cuenta.dias_vencido} días vencido
                                            </span>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                                        <div>
                                            <div className="text-xs text-slate-500">Total Venta</div>
                                            <div className="text-sm font-semibold text-slate-200">
                                                {formatCurrency(cuenta.monto_total)}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-slate-500">Cobrado</div>
                                            <div className="text-sm font-semibold theme-accent">
                                                {formatCurrency(cuenta.monto_cobrado)}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-slate-500">Pendiente</div>
                                            <div className="text-sm font-semibold text-orange-400">
                                                {formatCurrency(cuenta.monto_pendiente)}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-slate-500">Fecha Venta</div>
                                            <div className="text-sm font-semibold text-blue-400">
                                                {cuenta.fecha_venta}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
            </div>

            {cuentasActivas.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                    <div className="text-4xl mb-3">💳</div>
                    <p>No hay cuentas por cobrar pendientes</p>
                </div>
            )}
        </div>
    );
}
