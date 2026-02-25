'use client';

import { useState } from 'react';
import { CuentaPorCobrar } from '@/types/financial';
import { Pedido } from '@/types/financial';
import { Envio } from '@/types/financial';
import { GastoDetallado } from '@/types/financial';

interface VentasCxCClienteProps {
  cuentas: CuentaPorCobrar[];
  pedidos: Pedido[];
  envios: Envio[];
  gastos: GastoDetallado[];
}

export default function VentasCxCCliente({ cuentas, pedidos, envios, gastos }: VentasCxCClienteProps) {
  const [filtroPedido, setFiltroPedido] = useState<string>('');
  const [clienteExpandido, setClienteExpandido] = useState<string | null>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const pedidosUnicos = pedidos.filter(p => p.id_pedido).map(p => p.id_pedido);
  const pedidosIds = Array.from(new Set(pedidosUnicos));

  const cuentasFiltradas = filtroPedido
    ? cuentas.filter(c => {
        const pedidoSeleccionado = pedidos.find(p => p.id_pedido === filtroPedido);
        if (!pedidoSeleccionado) return false;
        return pedidoSeleccionado.id_venta === c.id_venta;
      })
    : cuentas;

  const agruparPorCliente = () => {
    const map = new Map<string, {
      cuenta: CuentaPorCobrar;
      logistica: number;
      almacenaje: number;
      pedidos: Pedido[];
    }>();
    cuentasFiltradas.forEach(c => {
      if (c.monto_pendiente <= 0) return;
      const norm = (s: string) => (s || '').replace(/-/g, '_').toLowerCase();
      const enviosCliente = envios.filter(e => norm(e.id_cliente) === norm(c.id_cliente));
      const logistica = enviosCliente.filter(e => e.tipo_envio === 'Compra').reduce((s, e) => s + e.costo_envio, 0);
      const almacenaje = enviosCliente.filter(e => e.tipo_envio === 'Resguardo').reduce((s, e) => s + e.costo_envio, 0);
      const peds = pedidos.filter(p => p.id_cliente === c.id_cliente);
      map.set(c.id_cliente, { cuenta: c, logistica, almacenaje, pedidos: peds });
    });
    return Array.from(map.values()).sort((a, b) => b.cuenta.monto_pendiente - a.cuenta.monto_pendiente);
  };

  const clientesData = agruparPorCliente();
  const fumigacionTotal = gastos.filter(g => g.categoria === 'fumigacion').reduce((s, g) => s + g.monto, 0);

  const getEstadoStyle = (estado: string) => {
    switch (estado) {
      case 'vencido': return 'bg-red-500/10 border-red-500/30 text-red-400';
      case 'por_vencer': return 'bg-orange-500/10 border-orange-500/30 text-orange-400';
      default: return 'theme-accent-muted-bg border theme-accent-border theme-accent';
    }
  };

  return (
    <div className="chart-container">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h3 className="text-xl font-bold text-slate-50">Ventas · Cuentas por Cobrar</h3>
          <p className="text-sm text-slate-400 mt-1">Detalle por cliente · Gastos (almacenaje, logística)</p>
        </div>
        <select
          value={filtroPedido}
          onChange={(e) => setFiltroPedido(e.target.value)}
          className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-600 text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="">Todos los pedidos</option>
          {pedidosIds.map(id => (
            <option key={id} value={id}>{id}</option>
          ))}
        </select>
      </div>

      <div className="space-y-3">
        {clientesData.map(({ cuenta, logistica, almacenaje, pedidos: peds }) => {
          const isExpanded = clienteExpandido === cuenta.id_cliente;
          return (
            <div key={cuenta.id_venta} className="rounded-xl bg-slate-800/40 border border-slate-700/50 overflow-hidden">
              <button
                type="button"
                onClick={() => setClienteExpandido(isExpanded ? null : cuenta.id_cliente)}
                className="w-full p-4 flex flex-wrap items-center justify-between gap-4 text-left hover:bg-slate-800/60 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-slate-100">{cuenta.nombre_cliente}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getEstadoStyle(cuenta.estado)}`}>
                    {cuenta.estado === 'vencido' ? 'Vencido' : cuenta.estado === 'por_vencer' ? 'Por vencer' : 'Vigente'}
                  </span>
                  {cuenta.dias_vencido > 0 && (
                    <span className="text-xs text-red-400">{cuenta.dias_vencido} días vencido</span>
                  )}
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="text-xs text-slate-500">Pendiente</div>
                    <div className="font-bold text-orange-400">{formatCurrency(cuenta.monto_pendiente)}</div>
                  </div>
                  <div className="text-slate-400">{isExpanded ? '▼' : '▶'}</div>
                </div>
              </button>
              {isExpanded && (
                <div className="px-4 pb-4 pt-0 border-t border-slate-700/50">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                    <div>
                      <div className="text-xs text-slate-500">Total venta</div>
                      <div className="text-sm font-semibold text-slate-200">{formatCurrency(cuenta.monto_total)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Cobrado</div>
                      <div className="text-sm font-semibold theme-accent">{formatCurrency(cuenta.monto_cobrado)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Gastos logística (envíos)</div>
                      <div className="text-sm font-semibold text-slate-200">{formatCurrency(logistica)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Gastos almacenaje</div>
                      <div className="text-sm font-semibold text-slate-200">{formatCurrency(almacenaje)}</div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-xs text-slate-500">Pedidos asociados</div>
                      <div className="text-sm text-slate-300">
                        {peds.map(p => `${p.id_pedido} (${formatCurrency(p.total_pedido || 0)})`).join(' · ') || '—'}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {fumigacionTotal > 0 && (
        <div className="mt-4 p-3 rounded-lg bg-slate-800/60 border border-slate-700/50">
          <span className="text-slate-400">Gastos fumigación (generales): </span>
          <span className="font-semibold text-slate-200">{formatCurrency(fumigacionTotal)}</span>
        </div>
      )}

      {clientesData.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <div className="text-4xl mb-3">💳</div>
          <p>No hay cuentas por cobrar o no hay resultados para el filtro</p>
        </div>
      )}
    </div>
  );
}
