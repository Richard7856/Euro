'use client';

import { KPI } from '@/types/financial';
import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from '@heroicons/react/24/solid';

interface KPICardProps {
    kpi: KPI;
}

export default function KPICard({ kpi }: KPICardProps) {
    const formatValue = () => {
        switch (kpi.format) {
            case 'currency':
                return new Intl.NumberFormat('es-MX', {
                    style: 'currency',
                    currency: 'MXN',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                }).format(kpi.value);
            case 'percentage':
                return `${kpi.value.toFixed(2)}%`;
            case 'number':
                return new Intl.NumberFormat('es-MX').format(kpi.value);
            default:
                return kpi.value.toString();
        }
    };

    const getTrendIcon = () => {
        switch (kpi.trend) {
            case 'up':
                return <ArrowUpIcon className="w-5 h-5" />;
            case 'down':
                return <ArrowDownIcon className="w-5 h-5" />;
            default:
                return <MinusIcon className="w-5 h-5" />;
        }
    };

    const getCardClass = () => {
        if (kpi.label.includes('Margen') || kpi.label.includes('Ingresos')) {
            return 'kpi-card-profit';
        } else if (kpi.label.includes('Gastos')) {
            return 'kpi-card-loss';
        }
        return 'kpi-card-neutral';
    };

    const getTrendClass = () => {
        switch (kpi.trend) {
            case 'up':
                return 'trend-up';
            case 'down':
                return 'trend-down';
            default:
                return 'trend-neutral';
        }
    };

    return (
        <div className={getCardClass()}>
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-slate-400 uppercase tracking-wide">
                        {kpi.label}
                    </p>
                    <p className="mt-2 text-3xl font-bold text-slate-50">
                        {formatValue()}
                    </p>
                    {kpi.change !== undefined && (
                        <div className={`mt-2 text-sm font-medium ${getTrendClass()}`}>
                            {getTrendIcon()}
                            <span>{Math.abs(kpi.change).toFixed(1)}%</span>
                            <span className="text-slate-500 ml-1">vs mes anterior</span>
                        </div>
                    )}
                </div>
                <div className={`p-3 rounded-xl ${kpi.trend === 'up' ? 'theme-accent-muted-bg' : kpi.trend === 'down' ? 'bg-red-500/10' : 'theme-accent-muted-bg'}`}>
                    {getTrendIcon()}
                </div>
            </div>
        </div>
    );
}
