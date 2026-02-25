'use client';

import { CanalAnalisis } from '@/types/financial';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface ChannelAnalysisProps {
    canales: CanalAnalisis[];
}

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#ef4444'];

export default function ChannelAnalysis({ canales }: ChannelAnalysisProps) {
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
                    <p className="text-slate-200 font-semibold mb-2">{data.canal}</p>
                    <div className="space-y-1">
                        <div className="flex justify-between gap-4">
                            <span className="text-sm text-slate-400">Ingresos:</span>
                            <span className="text-sm font-bold text-slate-50">
                                {formatCurrency(data.ingresos)}
                            </span>
                        </div>
                        <div className="flex justify-between gap-4">
                            <span className="text-sm text-slate-400">Porcentaje:</span>
                            <span className="text-sm font-bold theme-accent">
                                {data.porcentaje.toFixed(1)}%
                            </span>
                        </div>
                        <div className="flex justify-between gap-4">
                            <span className="text-sm text-slate-400">Ventas:</span>
                            <span className="text-sm font-bold text-blue-400">
                                {data.num_ventas}
                            </span>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="chart-container">
            <h3 className="text-xl font-bold text-slate-50 mb-6">
                Distribución por Canal de Venta
            </h3>
            <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                    <Pie
                        data={canales}
                        dataKey="ingresos"
                        nameKey="canal"
                        cx="50%"
                        cy="50%"
                        outerRadius={120}
                        innerRadius={60}
                        paddingAngle={5}
                        label={((p: { canal?: string; porcentaje?: number }) =>
                            `${p.canal ?? ''} (${(p.porcentaje ?? 0).toFixed(0)}%)`) as never}
                        labelLine={{ stroke: '#94a3b8', strokeWidth: 1 }}
                    >
                        {canales.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                </PieChart>
            </ResponsiveContainer>

            {/* Legend with Stats */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {canales.map((canal, index) => (
                    <div
                        key={canal.canal}
                        className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/40 border border-slate-700/50"
                    >
                        <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <div className="flex-1">
                            <div className="text-sm font-semibold text-slate-200">{canal.canal}</div>
                            <div className="text-xs text-slate-400">
                                {formatCurrency(canal.ingresos)} • {canal.num_ventas} ventas
                            </div>
                        </div>
                        <div className="text-sm font-bold theme-accent">
                            {canal.porcentaje.toFixed(1)}%
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
