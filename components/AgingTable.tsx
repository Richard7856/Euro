'use client';

import { CuentaPorCobrar } from '@/types/financial';

interface AgingTableProps {
    cuentas: CuentaPorCobrar[];
}

export default function AgingTable({ cuentas }: AgingTableProps) {
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    };

    // Clasificar saldos
    const current = cuentas.filter(c => c.dias_vencido <= 0).reduce((sum, c) => sum + c.monto_pendiente, 0);
    const days1to30 = cuentas.filter(c => c.dias_vencido > 0 && c.dias_vencido <= 30).reduce((sum, c) => sum + c.monto_pendiente, 0);
    const days31to60 = cuentas.filter(c => c.dias_vencido > 30 && c.dias_vencido <= 60).reduce((sum, c) => sum + c.monto_pendiente, 0);
    const days61to90 = cuentas.filter(c => c.dias_vencido > 60 && c.dias_vencido <= 90).reduce((sum, c) => sum + c.monto_pendiente, 0);
    const days90plus = cuentas.filter(c => c.dias_vencido > 90).reduce((sum, c) => sum + c.monto_pendiente, 0);

    const total = current + days1to30 + days31to60 + days61to90 + days90plus;

    const getPercentage = (val: number) => total > 0 ? (val / total * 100).toFixed(1) : '0.0';

    return (
        <div className="bg-slate-800/40 rounded-xl border border-slate-700/50 p-6 backdrop-blur-sm">
            <h3 className="text-lg font-bold text-slate-100 mb-4">Antigüedad de Saldos</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead>
                        <tr className="text-slate-400 border-b border-slate-700">
                            <th className="py-2 px-4 font-medium">Periodo</th>
                            <th className="py-2 px-4 font-medium text-right">Monto</th>
                            <th className="py-2 px-4 font-medium text-right">%</th>
                            <th className="py-2 px-4 font-medium text-right">Estatus</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/30">
                        <tr className="hover:bg-slate-700/20">
                            <td className="py-3 px-4 theme-accent font-medium">Sin Vencer</td>
                            <td className="py-3 px-4 text-right text-slate-200">{formatCurrency(current)}</td>
                            <td className="py-3 px-4 text-right text-slate-400">{getPercentage(current)}%</td>
                            <td className="py-3 px-4 text-right"><span className="inline-block w-2 h-2 rounded-full theme-accent-bg"></span></td>
                        </tr>
                        <tr className="hover:bg-slate-700/20">
                            <td className="py-3 px-4 text-slate-200">1 - 30 días</td>
                            <td className="py-3 px-4 text-right text-slate-200">{formatCurrency(days1to30)}</td>
                            <td className="py-3 px-4 text-right text-slate-400">{getPercentage(days1to30)}%</td>
                            <td className="py-3 px-4 text-right"><span className="inline-block w-2 h-2 rounded-full bg-yellow-400"></span></td>
                        </tr>
                        <tr className="hover:bg-slate-700/20">
                            <td className="py-3 px-4 text-slate-200">31 - 60 días</td>
                            <td className="py-3 px-4 text-right text-slate-200">{formatCurrency(days31to60)}</td>
                            <td className="py-3 px-4 text-right text-slate-400">{getPercentage(days31to60)}%</td>
                            <td className="py-3 px-4 text-right"><span className="inline-block w-2 h-2 rounded-full bg-orange-400"></span></td>
                        </tr>
                        <tr className="hover:bg-slate-700/20">
                            <td className="py-3 px-4 text-slate-200">61 - 90 días</td>
                            <td className="py-3 px-4 text-right text-slate-200">{formatCurrency(days61to90)}</td>
                            <td className="py-3 px-4 text-right text-slate-400">{getPercentage(days61to90)}%</td>
                            <td className="py-3 px-4 text-right"><span className="inline-block w-2 h-2 rounded-full bg-red-400"></span></td>
                        </tr>
                        <tr className="hover:bg-slate-700/20">
                            <td className="py-3 px-4 text-red-500 font-medium">+90 días</td>
                            <td className="py-3 px-4 text-right text-slate-200">{formatCurrency(days90plus)}</td>
                            <td className="py-3 px-4 text-right text-slate-400">{getPercentage(days90plus)}%</td>
                            <td className="py-3 px-4 text-right"><span className="inline-block w-2 h-2 rounded-full bg-red-600 animate-pulse"></span></td>
                        </tr>
                    </tbody>
                    <tfoot className="border-t border-slate-700">
                        <tr>
                            <td className="py-3 px-4 font-bold text-slate-100">Total</td>
                            <td className="py-3 px-4 text-right font-bold text-slate-100">{formatCurrency(total)}</td>
                            <td className="py-3 px-4 text-right font-bold text-slate-100">100.0%</td>
                            <td></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
}
