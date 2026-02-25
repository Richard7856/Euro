'use client';

import { PagoProveedor } from '@/types/financial';
import { Compra } from '@/types/financial';
import { parseISO, differenceInDays } from 'date-fns';

interface PagosPanelProps {
  pagos: PagoProveedor[];
  compras: Compra[];
}

export default function PagosPanel({ pagos, compras }: PagosPanelProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const getCompraByID = (id: string) => compras.find(c => c.id_compra === id);

  const pagosConContexto = pagos.map(p => {
    const compra = getCompraByID(p.id_compra);
    const fechaVenc = compra?.fecha_vencimiento;
    let pagoEnTiempo: boolean | null = null;
    if (fechaVenc) {
      try {
        const venc = parseISO(fechaVenc);
        const pago = parseISO(p.fecha_pago);
        pagoEnTiempo = pago <= venc;
      } catch {
        // ignore
      }
    }
    return { ...p, compra, pagoEnTiempo };
  }).sort((a, b) => new Date(b.fecha_pago).getTime() - new Date(a.fecha_pago).getTime());

  return (
    <div className="chart-container">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-slate-50">Pagos a Proveedores</h3>
          <p className="text-sm text-slate-400 mt-1">Historial de pagos · Pago en tiempo</p>
        </div>
      </div>
      <div className="space-y-3">
        {pagosConContexto.map((pago) => (
          <div
            key={pago.id_pago}
            className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 hover:bg-slate-800/60 transition-all"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div>
                  <div className="font-semibold text-slate-100">{pago.id_compra}</div>
                  <div className="text-sm text-slate-400">{pago.compra?.producto_nombre}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Fecha pago</div>
                  <div className="text-sm font-medium text-slate-200">{pago.fecha_pago}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Monto</div>
                  <div className="text-sm font-bold theme-accent">{formatCurrency(pago.monto_pago)}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Método</div>
                  <div className="text-sm text-slate-300">{pago.metodo_pago}</div>
                </div>
              </div>
              {pago.pagoEnTiempo !== null && (
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  pago.pagoEnTiempo ? 'theme-accent-muted-bg theme-accent' : 'bg-amber-500/20 text-amber-400'
                }`}>
                  {pago.pagoEnTiempo ? '✓ Pagado en tiempo' : '⚠ Fuera de tiempo'}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
      {pagos.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <div className="text-4xl mb-3">💳</div>
          <p>No hay registros de pagos</p>
        </div>
      )}
    </div>
  );
}
