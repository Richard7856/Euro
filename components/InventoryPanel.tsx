'use client';

import { useState } from 'react';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { Inventario } from '@/types/financial';

interface InventoryPanelProps {
    inventario: Inventario[];
}

export default function InventoryPanel({ inventario }: InventoryPanelProps) {
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

    const toggleExpand = (id: string) => {
        setExpandedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    };

    const formatNumber = (value: number) => {
        return new Intl.NumberFormat('es-MX').format(value);
    };

    const totalInventario = inventario.reduce((sum, item) => sum + item.valor_total, 0);
    const productosActivos = inventario.filter(i => i.cantidad_disponible > 0);

    const getStockStatus = (cantidad: number) => {
        if (cantidad === 0) return { label: 'Agotado', color: 'text-red-400 bg-red-500/10 border-red-500/30' };
        if (cantidad < 500) return { label: 'Bajo', color: 'text-orange-400 bg-orange-500/10 border-orange-500/30' };
        if (cantidad < 2000) return { label: 'Medio', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30' };
        return { label: 'Bueno', color: 'theme-accent theme-accent-muted-bg border theme-accent-border' };
    };

    return (
        <div className="chart-container">
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h3 className="text-xl font-bold text-slate-50">
                        Control de Inventario
                    </h3>
                    <p className="text-sm text-slate-400 mt-1">
                        {productosActivos.length} productos en stock · Haz clic para ver detalle
                    </p>
                </div>
                <div className="text-right">
                    <div className="text-sm text-slate-400">Valor Total</div>
                    <div className="text-2xl font-bold text-blue-400">
                        {formatCurrency(totalInventario)}
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                {inventario.map((item) => {
                    const status = getStockStatus(item.cantidad_disponible);
                    const isExpanded = expandedIds.has(item.id_producto);
                    return (
                        <div
                            key={item.id_producto}
                            className="rounded-xl bg-slate-800/40 border border-slate-700/50 overflow-hidden transition-all duration-200"
                        >
                            <button
                                type="button"
                                onClick={() => toggleExpand(item.id_producto)}
                                className="w-full p-4 flex items-center justify-between gap-4 hover:bg-slate-800/60 transition-colors text-left"
                            >
                                <div className="flex items-center gap-3">
                                    {isExpanded ? (
                                        <ChevronDownIcon className="w-5 h-5 text-slate-400 shrink-0" />
                                    ) : (
                                        <ChevronRightIcon className="w-5 h-5 text-slate-400 shrink-0" />
                                    )}
                                    <h4 className="font-semibold text-slate-100">
                                        {item.nombre_producto}
                                    </h4>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${status.color}`}>
                                        {status.label}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs text-slate-500">Valor Total</div>
                                    <div className="text-sm font-semibold theme-accent">
                                        {formatCurrency(item.valor_total)}
                                    </div>
                                </div>
                            </button>
                            {isExpanded && (
                                <div className="px-4 pb-4 pt-0 border-t border-slate-700/50">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                                        <div>
                                            <div className="text-xs text-slate-500">ID Producto</div>
                                            <div className="text-sm font-semibold text-slate-200">{item.id_producto}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-slate-500">Cantidad disponible</div>
                                            <div className="text-sm font-semibold text-slate-200">
                                                {formatNumber(item.cantidad_disponible)} unidades
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-slate-500">Valor unitario promedio</div>
                                            <div className="text-sm font-semibold text-slate-200">
                                                {formatCurrency(item.valor_unitario_promedio)}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-slate-500">Rotación (días)</div>
                                            <div className="text-sm font-semibold text-blue-400">
                                                {item.rotacion_dias > 0 ? `${item.rotacion_dias} días` : 'N/A'}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-slate-500">Última compra</div>
                                            <div className="text-sm font-semibold text-slate-200">{item.fecha_ultima_compra}</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {inventario.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                    <div className="text-4xl mb-3">📦</div>
                    <p>No hay productos en inventario</p>
                </div>
            )}
        </div>
    );
}
