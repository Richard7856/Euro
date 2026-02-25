'use client';

import { ClienteAnalisis } from '@/types/financial';
import { UserIcon } from '@heroicons/react/24/solid';

interface ClientAnalysisProps {
    clientes: ClienteAnalisis[];
}

export default function ClientAnalysis({ clientes }: ClientAnalysisProps) {
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    };

    return (
        <div className="chart-container">
            <h3 className="text-xl font-bold text-slate-50 mb-6">
                Top Clientes
            </h3>
            <div className="space-y-4">
                {clientes.slice(0, 5).map((cliente, index) => (
                    <div
                        key={cliente.id_cliente}
                        className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 hover:bg-slate-800/60 transition-all duration-200"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3 flex-1">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold ${index === 0 ? 'bg-gradient-to-br from-yellow-500 to-orange-500' :
                                        index === 1 ? 'bg-gradient-to-br from-slate-400 to-slate-500' :
                                            index === 2 ? 'bg-gradient-to-br from-amber-700 to-amber-800' :
                                                'bg-gradient-to-br from-blue-500 to-purple-500'
                                    }`}>
                                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : <UserIcon className="w-5 h-5" />}
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-semibold text-slate-100">{cliente.id_cliente}</h4>
                                    <div className="flex items-center gap-4 text-sm text-slate-400 mt-1">
                                        <span>{cliente.total_pedidos} pedidos</span>
                                        {cliente.ultimo_pedido && (
                                            <span>• Último: {cliente.ultimo_pedido}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-lg font-bold theme-accent">
                                    {formatCurrency(cliente.total_compras)}
                                </div>
                                {cliente.credito_pendiente > 0 && (
                                    <div className="text-xs text-orange-400 font-medium mt-1">
                                        Crédito: {formatCurrency(cliente.credito_pendiente)}
                                    </div>
                                )}
                                {cliente.credito_pendiente < 0 && (
                                    <div className="text-xs theme-accent font-medium mt-1">
                                        Al corriente
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
