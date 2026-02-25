'use client';

import { useState } from 'react';
import { GastoDetallado } from '@/types/financial';
import { Compra } from '@/types/financial';
import { Envio } from '@/types/financial';
import { CategoriaGasto } from '@/types/financial';

interface ProveedoresWindowProps {
  gastos: GastoDetallado[];
  compras: Compra[];
  envios: Envio[];
}

type TipoServicio = CategoriaGasto | 'producto' | 'logistica_envio' | 'todos';

const LABEL_SERVICIO: Record<string, string> = {
  fumigacion: 'Fumigación',
  empaque: 'Empaque',
  logistica: 'Logística',
  almacenaje: 'Almacenaje',
  operativo: 'Operativo',
  compras: 'Compras',
  producto: 'Producto (compras)',
  logistica_envio: 'Logística (envíos)',
  todos: 'Todos'
};

export default function ProveedoresWindow({ gastos, compras, envios }: ProveedoresWindowProps) {
  const [filtro, setFiltro] = useState<TipoServicio>('todos');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const proveedoresGastos = gastos
    .filter(g => filtro === 'todos' || g.categoria === filtro)
    .reduce((acc, g) => {
      const key = g.proveedor || 'Sin proveedor';
      if (!acc[key]) acc[key] = { nombre: key, tipo: g.categoria, total: 0 };
      acc[key].total += g.monto;
      return acc;
    }, {} as Record<string, { nombre: string; tipo: string; total: number }>);

  const proveedoresCompras = compras
    .filter(c => filtro === 'todos' || filtro === 'producto')
    .reduce((acc, c) => {
      const key = c.proveedor || 'Sin proveedor';
      if (key === '---') return acc;
      if (!acc[key]) acc[key] = { nombre: key, tipo: 'producto' as const, total: 0 };
      acc[key].total += c.inversion_mxn;
      return acc;
    }, {} as Record<string, { nombre: string; tipo: string; total: number }>);

  const proveedoresEnvios = envios
    .filter(e => (filtro === 'todos' || filtro === 'logistica_envio') && e.proveedor_logistico)
    .reduce((acc, e) => {
      const key = e.proveedor_logistico || 'Sin proveedor';
      if (!acc[key]) acc[key] = { nombre: key, tipo: 'logistica_envio' as const, total: 0 };
      acc[key].total += e.costo_envio;
      return acc;
    }, {} as Record<string, { nombre: string; tipo: string; total: number }>);

  const combinar = () => {
    const map = new Map<string, { nombre: string; tipo: string; total: number }>();
    Object.values(proveedoresGastos).forEach(p => map.set(p.nombre, { ...p, tipo: LABEL_SERVICIO[p.tipo] || p.tipo }));
    Object.values(proveedoresCompras).forEach(p => {
      const prev = map.get(p.nombre);
      if (prev) prev.total += p.total;
      else map.set(p.nombre, { ...p, tipo: LABEL_SERVICIO.producto });
    });
    Object.values(proveedoresEnvios).forEach(p => {
      const prev = map.get(p.nombre);
      if (prev) prev.total += p.total;
      else map.set(p.nombre, { ...p, tipo: LABEL_SERVICIO.logistica_envio });
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  };

  const lista = combinar();
  const opciones: TipoServicio[] = ['todos', 'fumigacion', 'logistica', 'almacenaje', 'empaque', 'operativo', 'producto', 'logistica_envio'];

  return (
    <div className="chart-container">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h3 className="text-xl font-bold text-slate-50">Ventana de Proveedores</h3>
          <p className="text-sm text-slate-400 mt-1">Filtrar por tipo de servicio</p>
        </div>
        <select
          value={filtro}
          onChange={(e) => setFiltro(e.target.value as TipoServicio)}
          className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-600 text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
        >
          {opciones.map(opt => (
            <option key={opt} value={opt}>{LABEL_SERVICIO[opt] || opt}</option>
          ))}
        </select>
      </div>
      <div className="space-y-3">
        {lista.map((p) => (
          <div
            key={p.nombre}
            className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 hover:bg-slate-800/60 transition-all flex justify-between items-center"
          >
            <div>
              <div className="font-semibold text-slate-100">{p.nombre}</div>
              <div className="text-xs text-slate-400">{p.tipo}</div>
            </div>
            <div className="text-lg font-bold text-blue-400">{formatCurrency(p.total)}</div>
          </div>
        ))}
      </div>
      {lista.length === 0 && (
        <div className="text-center py-12 text-slate-400">No hay proveedores para el filtro seleccionado</div>
      )}
    </div>
  );
}
