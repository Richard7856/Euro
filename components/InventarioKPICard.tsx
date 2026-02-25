'use client';

import { useState } from 'react';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { KPI } from '@/types/financial';
import { Inventario } from '@/types/financial';

interface InventarioKPICardProps {
  kpi: KPI;
  inventario: Inventario[];
}

export default function InventarioKPICard({ kpi, inventario }: InventarioKPICardProps) {
  const [expanded, setExpanded] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatValue = () => {
    switch (kpi.format) {
      case 'currency':
        return formatCurrency(kpi.value);
      case 'percentage':
        return `${kpi.value.toFixed(2)}%`;
      case 'number':
        return new Intl.NumberFormat('es-MX').format(kpi.value);
      default:
        return kpi.value.toString();
    }
  };

  const getStockStatus = (cantidad: number) => {
    if (cantidad === 0) return { label: 'Agotado', color: 'text-red-400 bg-red-500/10 border-red-500/30' };
    if (cantidad < 500) return { label: 'Bajo', color: 'text-orange-400 bg-orange-500/10 border-orange-500/30' };
    if (cantidad < 2000) return { label: 'Medio', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30' };
    return { label: 'Bueno', color: 'theme-accent theme-accent-muted-bg border theme-accent-border' };
  };

  const productosActivos = inventario.filter(i => i.cantidad_disponible > 0);

  return (
    <>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="kpi-card-neutral w-full h-full text-left p-4 rounded-xl hover:bg-slate-800/40 transition-all hover:scale-[1.01]"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {expanded ? (
              <ChevronDownIcon className="w-5 h-5 text-slate-400 shrink-0" />
            ) : (
              <ChevronRightIcon className="w-5 h-5 text-slate-400 shrink-0" />
            )}
            <div>
              <p className="text-sm font-medium text-slate-400 uppercase tracking-wide">
                {kpi.label}
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-50">
                {formatValue()}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {productosActivos.length} productos · Haz clic para ver detalle
              </p>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-blue-500/10">
            <ChevronRightIcon className={`w-5 h-5 text-blue-400 transition-transform ${expanded ? 'rotate-90' : ''}`} />
          </div>
        </div>
      </button>

      {expanded && (
        <div className="col-span-full mt-2">
        <div className="chart-container border-t border-slate-700/50 p-4 pt-4 space-y-3">
          <div className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wide">
            Detalle de productos · Dinero donde está
          </div>
          {inventario.map((item, index) => {
            const status = getStockStatus(item.cantidad_disponible);
            return (
              <div
                key={`${item.id_producto}-${index}`}
                className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 hover:bg-slate-800/60 transition-all"
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <h4 className="font-semibold text-slate-100">{item.nombre_producto}</h4>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${status.color}`}>
                      {status.label}
                    </span>
                  </div>
                  <div className="text-right font-bold theme-accent">
                    {formatCurrency(item.valor_total)}
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 pt-3 border-t border-slate-700/30">
                  <div>
                    <div className="text-xs text-slate-500">ID Producto</div>
                    <div className="text-sm font-medium text-slate-300">{item.id_producto}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Cantidad disponible</div>
                    <div className="text-sm font-medium text-slate-200">
                      {new Intl.NumberFormat('es-MX').format(item.cantidad_disponible)} unidades
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Valor unitario</div>
                    <div className="text-sm font-medium text-slate-200">
                      {formatCurrency(item.valor_unitario_promedio)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Última compra</div>
                    <div className="text-sm font-medium text-slate-300">{item.fecha_ultima_compra}</div>
                  </div>
                </div>
              </div>
            );
          })}
          {inventario.length === 0 && (
            <div className="text-center py-8 text-slate-500">No hay productos en inventario</div>
          )}
        </div>
        </div>
      )}
    </>
  );
}
