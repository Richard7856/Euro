'use client';

import { useMemo } from 'react';
import { CubeIcon } from '@heroicons/react/24/outline';

export interface ProductoOption {
  id_producto: string;
  nombre_producto: string;
}

interface ProductFilterProps {
  products: ProductoOption[];
  value: string;
  onChange: (idProducto: string) => void;
}

export default function ProductFilter({ products, value, onChange }: ProductFilterProps) {
  const uniqueProducts = useMemo(() => {
    const seen = new Set<string>();
    return products.filter((p) => {
      if (!p.id_producto || seen.has(p.id_producto)) return false;
      seen.add(p.id_producto);
      return true;
    });
  }, [products]);

  return (
    <div className="flex flex-wrap items-center gap-4 p-4 rounded-xl bg-slate-800/40 border border-slate-700/50">
      <div className="flex items-center gap-2 text-slate-300">
        <CubeIcon className="w-5 h-5" />
        <span className="font-medium">Producto</span>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <div>
          <label className="block text-xs text-slate-500 mb-1">Filtrar por producto</label>
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-600 text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none min-w-[200px]"
          >
            <option value="">Todos los productos</option>
            {uniqueProducts.map((p) => (
              <option key={p.id_producto} value={p.id_producto}>
                {p.nombre_producto || p.id_producto}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
