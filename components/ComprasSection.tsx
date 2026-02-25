'use client';

import { useCurrency } from '@/lib/currencyContext';
import { Compra } from '@/types/financial';
import { parseISO, differenceInDays } from 'date-fns';

interface ComprasSectionProps {
  compras: Compra[];
}

export default function ComprasSection({ compras }: ComprasSectionProps) {
  const { formatCurrency } = useCurrency();

  const parseFechaVenc = (s: string): Date | null => {
    try {
      if (s.includes('-')) return parseISO(s);
      const m = s.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
      if (m) return parseISO(`${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`);
      return null;
    } catch { return null; }
  };

  const getTimerInfo = (compra: Compra) => {
    const raw = compra.fecha_vencimiento || compra.nota_clave?.match(/\d{2}\/\d{2}\/\d{4}|\d{4}-\d{2}-\d{2}/)?.[0];
    if (!raw || compra.estado === 'PAGADO') return null;
    const fechaVenc = parseFechaVenc(raw);
    if (!fechaVenc) return null;
    const hoy = new Date();
    const dias = differenceInDays(fechaVenc, hoy);
    if (dias > 0) return { label: 'Vence en', dias, tipo: 'countdown' as const };
    if (dias === 0) return { label: 'Vence hoy', dias: 0, tipo: 'urgent' as const };
    return { label: 'Vencido hace', dias: Math.abs(dias), tipo: 'vencido' as const };
  };

  const getStatusBadge = (estado: string) => {
    const styles: Record<string, string> = {
      'CRÉDITO': 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
      'PENDIENTE': 'text-orange-400 bg-orange-500/10 border-orange-500/20',
      'PAGADO': 'theme-accent theme-accent-muted-bg border theme-accent-border',
      'PERDIDO': 'text-red-400 bg-red-500/10 border-red-500/20',
      'NO RECIBIDA': 'text-red-400 bg-red-500/10 border-red-500/20'
    };
    return <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${styles[estado] || 'text-slate-400'}`}>{estado}</span>;
  };

  return (
    <div className="chart-container overflow-hidden">
      <div className="border-b border-slate-700/50 p-4 bg-slate-800/20">
        <h3 className="text-sm font-bold uppercase tracking-wide text-blue-400 flex items-center gap-2">
          <span className="text-lg">🛒</span>
          Compras
        </h3>
        <p className="text-xs text-slate-400 mt-1">Tipo de pago y timer de vencimiento</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs font-medium text-left">
          <thead>
            <tr className="border-b border-slate-700/50 bg-slate-800/40 text-slate-300">
              <th className="py-3 px-4 font-bold">ID</th>
              <th className="py-3 px-4 font-bold">Producto</th>
              <th className="py-3 px-4 font-bold">Tipo Pago</th>
              <th className="py-3 px-4 font-bold">Proveedor</th>
              <th className="py-3 px-4 font-bold text-right">Inversión</th>
              <th className="py-3 px-4 font-bold text-right">Pendiente</th>
              <th className="py-3 px-4 font-bold">Estado</th>
              <th className="py-3 px-4 font-bold">Timer / Vencimiento</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/30">
            {compras.map((compra) => {
              const timer = getTimerInfo(compra);
              return (
                <tr key={compra.id_compra} className="hover:bg-slate-700/30 transition-colors">
                  <td className="py-3 px-4 font-mono text-slate-400">{compra.id_compra}</td>
                  <td className="py-3 px-4 text-slate-200 font-semibold">{compra.producto_nombre}</td>
                  <td className="py-3 px-4 text-slate-300">{compra.tipo_pago}</td>
                  <td className="py-3 px-4 text-slate-400">{compra.proveedor}</td>
                  <td className="py-3 px-4 text-right text-slate-200">{formatCurrency(compra.inversion_mxn)}</td>
                  <td className="py-3 px-4 text-right text-orange-400">{formatCurrency(compra.pendiente_mxn)}</td>
                  <td className="py-3 px-4">{getStatusBadge(compra.estado)}</td>
                  <td className="py-3 px-4">
                    {timer ? (
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        timer.tipo === 'vencido' ? 'bg-red-500/20 text-red-400' :
                        timer.tipo === 'urgent' ? 'bg-orange-500/20 text-orange-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {timer.label} {timer.dias} días
                      </span>
                    ) : (
                      <span className="text-slate-500 text-xs">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
