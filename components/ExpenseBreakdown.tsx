'use client';

import { GastosPorCategoria } from '@/types/financial';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface ExpenseBreakdownProps {
    gastos: GastosPorCategoria[];
}

const CATEGORY_COLORS: Record<string, string> = {
    fumigacion: '#10b981',
    empaque: '#3b82f6',
    logistica: '#f59e0b',
    almacenaje: '#ef4444',
    compras: '#8b5cf6',
    operativo: '#6b7280'
};

const CATEGORY_NAMES: Record<string, string> = {
    fumigacion: 'Fumigación',
    empaque: 'Empaque',
    logistica: 'Logística',
    almacenaje: 'Almacenaje',
    compras: 'Compras',
    operativo: 'Operativo'
};

const CATEGORY_ICONS: Record<string, string> = {
    fumigacion: '🌿',
    empaque: '📦',
    logistica: '🚚',
    almacenaje: '🏢',
    compras: '🛒',
    operativo: '💼'
};

export default function ExpenseBreakdown({ gastos }: ExpenseBreakdownProps) {
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
            notation: 'compact'
        }).format(value);
    };

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-slate-800/95 backdrop-blur-xl border border-slate-700 rounded-xl p-4 shadow-2xl">
                    <p className="text-slate-200 font-semibold mb-2 flex items-center gap-2">
                        <span>{CATEGORY_ICONS[data.categoria]}</span>
                        <span>{CATEGORY_NAMES[data.categoria]}</span>
                    </p>
                    <div className="space-y-1">
                        <div className="flex justify-between gap-4">
                            <span className="text-sm text-slate-400">Total:</span>
                            <span className="text-sm font-bold text-slate-50">
                                {formatCurrency(data.total)}
                            </span>
                        </div>
                        <div className="flex justify-between gap-4">
                            <span className="text-sm text-slate-400">Porcentaje:</span>
                            <span className="text-sm font-bold theme-accent">
                                {data.porcentaje.toFixed(1)}%
                            </span>
                        </div>
                        <div className="flex justify-between gap-4">
                            <span className="text-sm text-slate-400">Transacciones:</span>
                            <span className="text-sm font-bold text-blue-400">
                                {data.count}
                            </span>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    const totalGastos = gastos.reduce((sum, g) => sum + g.total, 0);

    return (
        <div className="chart-container">
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h3 className="text-xl font-bold text-slate-50">
                        Distribución de Gastos por Categoría
                    </h3>
                    <p className="text-sm text-slate-400 mt-1">
                        Desglose detallado de egresos
                    </p>
                </div>
                <div className="text-right">
                    <div className="text-sm text-slate-400">Total</div>
                    <div className="text-2xl font-bold text-red-400">
                        {formatCurrency(totalGastos)}
                    </div>
                </div>
            </div>

            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie
                        data={gastos}
                        dataKey="total"
                        nameKey="categoria"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        innerRadius={50}
                        paddingAngle={3}
                        label={
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            ((p: any) => `${CATEGORY_ICONS[p.categoria] ?? ''} ${(p.porcentaje ?? 0).toFixed(0)}%`) as never
                        }
                        labelLine={{ stroke: '#94a3b8', strokeWidth: 1 }}
                    >
                        {gastos.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={CATEGORY_COLORS[entry.categoria] || '#6b7280'}
                            />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                </PieChart>
            </ResponsiveContainer>

            {/* Tabla detallada */}
            <div className="mt-6 space-y-3">
                {gastos.map((gasto) => (
                    <div
                        key={gasto.categoria}
                        className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 hover:bg-slate-800/60 transition-all duration-200"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1">
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: CATEGORY_COLORS[gasto.categoria] }}
                                />
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg">{CATEGORY_ICONS[gasto.categoria]}</span>
                                        <h4 className="font-semibold text-slate-100">
                                            {CATEGORY_NAMES[gasto.categoria]}
                                        </h4>
                                    </div>
                                    <div className="text-xs text-slate-400 mt-1">
                                        {gasto.count} {gasto.count === 1 ? 'transacción' : 'transacciones'}
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-lg font-bold text-slate-100">
                                    {formatCurrency(gasto.total)}
                                </div>
                                <div className="text-sm font-medium theme-accent">
                                    {gasto.porcentaje.toFixed(1)}%
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
