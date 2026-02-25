'use client';

import { CuentaPorCobrar } from '@/types/financial';
import { Pedido } from '@/types/financial';

interface ClientesWindowProps {
  cuentas: CuentaPorCobrar[];
  pedidos: Pedido[];
}

export default function ClientesWindow({ cuentas, pedidos }: ClientesWindowProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const clientesDeCuentas = cuentas.map(c => ({ id: c.id_cliente, nombre: c.nombre_cliente, pendiente: c.monto_pendiente }));
  const clientesDePedidos = pedidos.filter(p => p.id_cliente).map(p => ({ id: p.id_cliente, nombre: p.id_cliente }));
  const clienteMap = new Map<string, { nombre: string; pendiente: number }>();
  clientesDeCuentas.forEach(c => clienteMap.set(c.id, { nombre: c.nombre, pendiente: c.pendiente }));
  clientesDePedidos.forEach(c => {
    if (!clienteMap.has(c.id)) clienteMap.set(c.id, { nombre: c.nombre, pendiente: 0 });
  });
  const totalPedidosPorCliente = pedidos.reduce((acc, p) => {
    if (!p.id_cliente) return acc;
    acc.set(p.id_cliente, (acc.get(p.id_cliente) || 0) + (p.total_pedido || 0));
    return acc;
  }, new Map<string, number>());

  const clientes = Array.from(clienteMap.entries()).map(([id, data]) => ({
    id,
    nombre: data.nombre || id,
    pendiente: data.pendiente,
    totalPedidos: totalPedidosPorCliente.get(id) || 0
  })).sort((a, b) => b.pendiente - a.pendiente);

  return (
    <div className="chart-container">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-slate-50">Ventana de Clientes</h3>
        <p className="text-sm text-slate-400 mt-1">{clientes.length} clientes</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {clientes.map((cli) => (
          <div
            key={cli.id}
            className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 hover:bg-slate-800/60 transition-all"
          >
            <div className="font-semibold text-slate-100">{cli.nombre}</div>
            <div className="text-xs text-slate-400 mt-1">ID: {cli.id}</div>
            <div className="mt-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Total pedidos</span>
                <span className="text-slate-200">{formatCurrency(cli.totalPedidos)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Pendiente cobro</span>
                <span className={cli.pendiente > 0 ? 'text-orange-400 font-semibold' : 'theme-accent'}>
                  {formatCurrency(cli.pendiente)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      {clientes.length === 0 && (
        <div className="text-center py-12 text-slate-400">No hay clientes registrados</div>
      )}
    </div>
  );
}
