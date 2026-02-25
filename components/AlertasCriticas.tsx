'use client';

import type { AlertaCritica } from '@/lib/analisisEstrategico';

interface AlertasCriticasProps {
  alertas: AlertaCritica[];
}

const PRIORIDAD_STYLES: Record<AlertaCritica['prioridad'], string> = {
  CRÍTICO: 'bg-red-500/20 border-red-500/50 text-red-400',
  ALTA: 'bg-amber-500/20 border-amber-500/50 text-amber-400',
  MEDIA: 'bg-orange-500/20 border-orange-500/50 text-orange-400',
  BAJA: 'bg-slate-500/20 border-slate-500/50 text-slate-400',
};

export default function AlertasCriticas({ alertas }: AlertasCriticasProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="chart-container">
      <h3 className="text-lg font-bold text-slate-50 mb-4 flex items-center gap-2">
        <span className="text-red-400">⚠️</span>
        Tabla 8: Alertas Críticas
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700/50 text-slate-400 text-left">
              <th className="py-3 px-4 font-semibold">Prioridad</th>
              <th className="py-3 px-4 font-semibold">Alerta</th>
              <th className="py-3 px-4 font-semibold text-right">Monto</th>
              <th className="py-3 px-4 font-semibold">Fecha Límite</th>
              <th className="py-3 px-4 font-semibold">Acción Requerida</th>
            </tr>
          </thead>
          <tbody>
            {alertas.map((a, i) => (
              <tr key={i} className="border-b border-slate-700/30 hover:bg-slate-800/40">
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-bold border ${PRIORIDAD_STYLES[a.prioridad]}`}>
                    <span className="w-2 h-2 rounded-full bg-current" />
                    {a.prioridad}
                  </span>
                </td>
                <td className="py-3 px-4 font-medium text-slate-200">{a.alerta}</td>
                <td className={`py-3 px-4 text-right font-semibold ${a.monto < 0 ? 'text-red-400' : 'text-slate-200'}`}>
                  {formatCurrency(a.monto)}
                </td>
                <td className="py-3 px-4 text-slate-300">{a.fechaLimite}</td>
                <td className="py-3 px-4 text-slate-400">{a.accionRequerida}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {alertas.length === 0 && (
        <div className="text-center py-8 text-slate-500">No hay alertas críticas</div>
      )}
    </div>
  );
}
