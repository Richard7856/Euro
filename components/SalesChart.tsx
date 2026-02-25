'use client';

import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    ComposedChart
} from 'recharts';

interface VentasChartProps {
    data: { mes: string; ingresos: number; gastos: number; margen: number }[];
}

export default function SalesChart({ data }: VentasChartProps) {
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
            notation: 'compact'
        }).format(value);
    };

    const formatPercentage = (value: number) => {
        return `${value.toFixed(1)}%`;
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-slate-800/95 backdrop-blur-xl border border-slate-700 rounded-xl p-4 shadow-2xl">
                    <p className="text-slate-200 font-semibold mb-2">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center justify-between gap-4 py-1">
                            <span className="text-sm" style={{ color: entry.color }}>
                                {entry.name}:
                            </span>
                            <span className="text-sm font-bold text-slate-50">
                                {entry.name === 'Margen'
                                    ? formatPercentage(entry.value)
                                    : formatCurrency(entry.value)
                                }
                            </span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="chart-container">
            <h3 className="text-xl font-bold text-slate-50 mb-6">
                Análisis de Ventas por Mes
            </h3>
            <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <defs>
                        <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                        </linearGradient>
                        <linearGradient id="colorGastos" x1="0" y1="0" x2="0" y2="1">
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
                        yAxisId="left"
                        stroke="#94a3b8"
                        tick={{ fill: '#94a3b8' }}
                        tickLine={{ stroke: '#94a3b8' }}
                        tickFormatter={formatCurrency}
                    />
                    <YAxis
                        yAxisId="right"
                        orientation="right"
                        stroke="#94a3b8"
                        tick={{ fill: '#94a3b8' }}
                        tickLine={{ stroke: '#94a3b8' }}
                        tickFormatter={formatPercentage}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                        wrapperStyle={{ paddingTop: '20px' }}
                        iconType="circle"
                        formatter={(value) => <span className="text-slate-300">{value}</span>}
                    />
                    <Bar
                        yAxisId="left"
                        dataKey="ingresos"
                        name="Ingresos"
                        fill="url(#colorIngresos)"
                        radius={[8, 8, 0, 0]}
                    />
                    <Bar
                        yAxisId="left"
                        dataKey="gastos"
                        name="Gastos"
                        fill="url(#colorGastos)"
                        radius={[8, 8, 0, 0]}
                    />
                    <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="margen"
                        name="Margen"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        dot={{ fill: '#3b82f6', r: 5 }}
                        activeDot={{ r: 7 }}
                    />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
}
