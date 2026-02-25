'use client';

import { ProductoAnalisis } from '@/types/financial';
import { productosNombres } from '@/lib/sampleData';

interface ProductTableProps {
    productos: ProductoAnalisis[];
}

export default function ProductTable({ productos }: ProductTableProps) {
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

    const getMargenColor = (margen: number) => {
        if (margen >= 70) return 'theme-accent';
        if (margen >= 50) return 'text-green-400';
        if (margen >= 30) return 'text-yellow-400';
        if (margen >= 10) return 'text-orange-400';
        return 'text-red-400';
    };

    return (
        <div className="chart-container">
            <h3 className="text-xl font-bold text-slate-50 mb-6">
                Top Productos por Ventas
            </h3>
            <div className="overflow-x-auto custom-scrollbar">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th className="text-left">Producto</th>
                            <th className="text-right">Cantidad</th>
                            <th className="text-right">Total Vendido</th>
                            <th className="text-right">Margen</th>
                        </tr>
                    </thead>
                    <tbody>
                        {productos.map((producto, index) => (
                            <tr key={producto.id_producto}>
                                <td className="font-medium text-slate-200">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                                            {index + 1}
                                        </div>
                                        <div>
                                            <div className="font-semibold">
                                                {productosNombres[producto.id_producto] || producto.nombre_producto}
                                            </div>
                                            <div className="text-xs text-slate-500">{producto.id_producto}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="text-right text-slate-300">
                                    {formatNumber(producto.cantidad_vendida)}
                                </td>
                                <td className="text-right font-semibold text-slate-100">
                                    {formatCurrency(producto.total_vendido)}
                                </td>
                                <td className={`text-right font-bold ${getMargenColor(producto.margen_promedio)}`}>
                                    {producto.margen_promedio.toFixed(1)}%
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
