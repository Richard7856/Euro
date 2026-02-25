'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface LogisticsChartProps {
    data: { mes: string; costo: number }[];
}

export default function LogisticsChart({ data }: LogisticsChartProps) {
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
            notation: 'compact'
        }).format(value);
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-slate-800/95 backdrop-blur-xl border border-slate-700 rounded-xl p-4 shadow-2xl">
                    <p className="text-slate-200 font-semibold mb-2">{label}</p>
                    <div className="flex items-center justify-between gap-4">
                        <span className="text-sm text-slate-400">Costo de Envío:</span>
                        <span className="text-sm font-bold text-red-400">
                            {formatCurrency(payload[0].value)}
                        </span>
                    </div>
                </div>
            );
        }
        return null;
    };

    const totalGastos = data.reduce((sum, item) => sum + item.costo, 0);

    return (
        <div className="chart-container">
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h3 className="text-xl font-bold text-slate-50">
                        Gastos de Logística
                    </h3>
                    <p className="text-sm text-slate-400 mt-1">
                        Costos de envío y almacenamiento
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
                <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorCosto" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                    <XAxis
                        dataKey="mes"
                        stroke="#94a3b8"
                        tick={{ fill: '#94a3b8' }}
                        tickLine={{ stroke: '#94a3b8' }}
                    />
                    <YAxis
                        stroke="#94a3b8"
                        tick={{ fill: '#94a3b8' }}
                        tickLine={{ stroke: '#94a3b8' }}
                        tickFormatter={formatCurrency}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                        type="monotone"
                        dataKey="costo"
                        stroke="#ef4444"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorCosto)"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
