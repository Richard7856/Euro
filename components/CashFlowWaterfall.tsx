'use client';

import { CashFlowData } from '@/types/financial';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';

interface CashFlowWaterfallProps {
    data: CashFlowData;
}

export default function CashFlowWaterfall({ data }: CashFlowWaterfallProps) {
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
            notation: 'compact'
        }).format(Math.abs(value));
    };

    // Preparar datos para el waterfall
    const waterfallData = [
        { name: 'Efectivo Inicial', value: data.efectivo_inicial, tipo: 'inicial' },
        { name: 'Cobros', value: data.cobros, tipo: 'positivo' },
        { name: 'Fumigación', value: -data.gastos_fumigacion, tipo: 'negativo' },
        { name: 'Empaque', value: -data.gastos_empaque, tipo: 'negativo' },
        { name: 'Logística', value: -data.gastos_logistica, tipo: 'negativo' },
        { name: 'Almacenaje', value: -data.gastos_almacenaje, tipo: 'negativo' },
        { name: 'Compras', value: -data.compras, tipo: 'negativo' },
        { name: 'Otros', value: -data.otros_gastos, tipo: 'negativo' },
        { name: 'Efectivo Final', value: data.efectivo_final, tipo: 'final' }
    ];

    const getColor = (tipo: string) => {
        switch (tipo) {
            case 'positivo':
                return '#10b981';
            case 'negativo':
                return '#ef4444';
            case 'inicial':
                return '#3b82f6';
            case 'final':
                return data.efectivo_final >= 0 ? '#10b981' : '#ef4444';
            default:
                return '#6b7280';
        }
    };

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-slate-800/95 backdrop-blur-xl border border-slate-700 rounded-xl p-4 shadow-2xl">
                    <p className="text-slate-200 font-semibold mb-2">{data.name}</p>
                    <div className="flex justify-between gap-4">
                        <span className="text-sm text-slate-400">Monto:</span>
                        <span className={`text-sm font-bold ${data.tipo === 'positivo' || data.tipo === 'inicial'
                                ? 'theme-accent'
                                : 'text-red-400'
                            }`}>
                            {formatCurrency(data.value)}
                        </span>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="chart-container">
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h3 className="text-xl font-bold text-slate-50">
                        Flujo de Caja (Waterfall)
                    </h3>
                    <p className="text-sm text-slate-400 mt-1">
                        Movimiento de efectivo por categoría
                    </p>
                </div>
                <div className="text-right">
                    <div className="text-sm text-slate-400">Balance</div>
                    <div className={`text-2xl font-bold ${data.efectivo_final >= 0 ? 'theme-accent' : 'text-red-400'
                        }`}>
                        {formatCurrency(data.efectivo_final)}
                    </div>
                </div>
            </div>

            <ResponsiveContainer width="100%" height={400}>
                <BarChart data={waterfallData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                    <XAxis
                        dataKey="name"
                        stroke="#94a3b8"
                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={100}
                    />
                    <YAxis
                        stroke="#94a3b8"
                        tick={{ fill: '#94a3b8' }}
                        tickFormatter={formatCurrency}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine y={0} stroke="#475569" strokeWidth={2} />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                        {waterfallData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={getColor(entry.tipo)} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>

            {/* Resumen */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 rounded-lg theme-accent-muted-bg border theme-accent-border">
                    <div className="text-xs theme-accent-light">Total Cobros</div>
                    <div className="text-lg font-bold theme-accent">
                        {formatCurrency(data.cobros)}
                    </div>
                </div>
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                    <div className="text-xs text-red-300">Gastos Operativos</div>
                    <div className="text-lg font-bold text-red-400">
                        {formatCurrency(
                            data.gastos_fumigacion +
                            data.gastos_empaque +
                            data.gastos_logistica +
                            data.gastos_almacenaje +
                            data.otros_gastos
                        )}
                    </div>
                </div>
                <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
                    <div className="text-xs text-purple-300">Compras</div>
                    <div className="text-lg font-bold text-purple-400">
                        {formatCurrency(data.compras)}
                    </div>
                </div>
                <div className={`p-3 rounded-lg ${data.efectivo_final >= 0
                        ? 'theme-accent-muted-bg border theme-accent-border'
                        : 'bg-red-500/10 border-red-500/30'
                    } border`}>
                    <div className={`text-xs ${data.efectivo_final >= 0 ? 'theme-accent-light' : 'text-red-300'
                        }`}>
                        Efectivo Final
                    </div>
                    <div className={`text-lg font-bold ${data.efectivo_final >= 0 ? 'theme-accent' : 'text-red-400'
                        }`}>
                        {formatCurrency(data.efectivo_final)}
                    </div>
                </div>
            </div>
        </div>
    );
}
