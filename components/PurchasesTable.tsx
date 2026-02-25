'use client';

import { Compra } from '@/types/financial';

interface PurchasesTableProps {
    compras: Compra[];
}

export default function PurchasesTable({ compras }: PurchasesTableProps) {
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    };

    const getStatusBadge = (estado: string) => {
        switch (estado) {
            case 'CRÉDITO':
                return <span className="flex items-center gap-1.5 text-yellow-400 font-bold text-xs bg-yellow-500/10 px-2 py-1 rounded-full border border-yellow-500/20"><span className="w-1.5 h-1.5 rounded-full bg-yellow-400"></span>⚠️ CRÉDITO</span>;
            case 'PENDIENTE':
                return <span className="flex items-center gap-1.5 text-orange-400 font-bold text-xs bg-orange-500/10 px-2 py-1 rounded-full border border-orange-500/20"><span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>PENDIENTE</span>;
            case 'PAGADO':
                return <span className="flex items-center gap-1.5 theme-accent font-bold text-xs theme-accent-muted-bg px-2 py-1 rounded-full border theme-accent-border"><span className="w-1.5 h-1.5 rounded-full theme-accent-bg inline-block"></span>PAGADO</span>;
            case 'PERDIDO':
                return <span className="flex items-center gap-1.5 text-red-400 font-bold text-xs bg-red-500/10 px-2 py-1 rounded-full border border-red-500/20"><span className="w-2 h-2 relative"><span className="absolute inset-0 rotate-45 bg-red-400 h-0.5 top-1/2 -translate-y-1/2"></span><span className="absolute inset-0 -rotate-45 bg-red-400 h-0.5 top-1/2 -translate-y-1/2"></span></span>PERDIDO</span>;
            case 'NO RECIBIDA':
                return <span className="flex items-center gap-1.5 text-red-400 font-bold text-xs bg-red-500/10 px-2 py-1 rounded-full border border-red-500/20"><span className="w-2 h-2 relative"><span className="absolute inset-0 rotate-45 bg-red-400 h-0.5 top-1/2 -translate-y-1/2"></span><span className="absolute inset-0 -rotate-45 bg-red-400 h-0.5 top-1/2 -translate-y-1/2"></span></span>NO RECIBIDA</span>;
            default:
                return <span className="text-slate-400 text-xs">{estado}</span>;
        }
    };

    const totalKg = compras.reduce((sum, c) => sum + c.kg, 0);
    const totalInversion = compras.reduce((sum, c) => sum + c.inversion_mxn, 0);
    const totalPagado = compras.reduce((sum, c) => sum + c.pagado_mxn, 0);
    const totalPendiente = compras.reduce((sum, c) => sum + c.pendiente_mxn, 0);

    return (
        <div className="chart-container overflow-hidden">
            <div className="border-b border-slate-700/50 p-4 bg-slate-800/20">
                <h3 className="text-sm font-bold uppercase tracking-wide text-blue-400 flex items-center gap-2">
                    <span className="text-lg">📋</span>
                    Tabla 2: Compras - Inversión Total y Estado de Pago
                </h3>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-xs font-medium text-left">
                    <thead>
                        <tr className="border-b border-slate-700/50 bg-slate-800/40 text-slate-300">
                            <th className="py-3 px-4 font-bold">ID Compra</th>
                            <th className="py-3 px-4 font-bold">Producto</th>
                            <th className="py-3 px-4 font-bold text-right">Ton</th>
                            <th className="py-3 px-4 font-bold">Tipo Pago</th>
                            <th className="py-3 px-4 font-bold">Proveedor</th>
                            <th className="py-3 px-4 font-bold text-right">Inversión MXN</th>
                            <th className="py-3 px-4 font-bold text-right">Pagado MXN</th>
                            <th className="py-3 px-4 font-bold text-right">Pendiente MXN</th>
                            <th className="py-3 px-4 font-bold">Estado</th>
                            <th className="py-3 px-4 font-bold">Nota clave</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/30">
                        {compras.map((compra) => (
                            <tr key={compra.id_compra} className="hover:bg-slate-700/30 transition-colors group">
                                <td className="py-3 px-4 font-mono text-slate-400 group-hover:text-slate-200">{compra.id_compra}</td>
                                <td className="py-3 px-4 text-slate-200 font-semibold">{compra.producto_nombre}</td>
                                <td className="py-3 px-4 text-right text-slate-300">{new Intl.NumberFormat('es-MX', { minimumFractionDigits: 1 }).format(compra.kg)}</td>
                                <td className="py-3 px-4 text-slate-300">{compra.tipo_pago}</td>
                                <td className="py-3 px-4 text-slate-400">{compra.proveedor}</td>
                                <td className="py-3 px-4 text-right font-mono text-slate-200">{formatCurrency(compra.inversion_mxn)}</td>
                                <td className="py-3 px-4 text-right font-mono theme-accent opacity-80">{formatCurrency(compra.pagado_mxn)}</td>
                                <td className="py-3 px-4 text-right font-mono text-orange-400/80">{formatCurrency(compra.pendiente_mxn)}</td>
                                <td className="py-3 px-4">{getStatusBadge(compra.estado)}</td>
                                <td className="py-3 px-4 text-slate-500 italic group-hover:text-slate-400">{compra.nota_clave}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-slate-800/40 font-bold border-t border-slate-600/50 text-slate-200">
                        <tr>
                            <td className="py-4 px-4 text-blue-400">TOTALES</td>
                            <td className="py-4 px-4"></td>
                            <td className="py-4 px-4 text-right text-blue-300">{new Intl.NumberFormat('es-MX', { minimumFractionDigits: 1 }).format(totalKg)}</td>
                            <td className="py-4 px-4"></td>
                            <td className="py-4 px-4"></td>
                            <td className="py-4 px-4 text-right text-blue-300">{formatCurrency(totalInversion)}</td>
                            <td className="py-4 px-4 text-right theme-accent">{formatCurrency(totalPagado)}</td>
                            <td className="py-4 px-4 text-right text-orange-400">{formatCurrency(totalPendiente)}</td>
                            <td className="py-4 px-4"></td>
                            <td className="py-4 px-4"></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
}
