'use client';

import type { RecomendacionEstrategica } from '@/lib/analisisEstrategico';

interface RecomendacionesEstrategicasProps {
  recomendaciones: RecomendacionEstrategica[];
}

const PRIORIDAD_STYLES: Record<string, string> = {
  Inmediato: 'bg-red-500/20 border-red-500/50 text-red-400',
  '1 semana': 'bg-orange-500/20 border-orange-500/50 text-orange-400',
  '2 semanas': 'bg-amber-500/20 border-amber-500/50 text-amber-400',
  '1 mes': 'bg-amber-500/20 border-amber-500/50 text-amber-400',
  Continuo: 'bg-blue-500/20 border-blue-500/50 text-blue-400',
};

const IMPACTO_STYLES: Record<string, string> = {
  'Muy Alto': 'text-amber-400 font-bold',
  Alto: 'text-orange-400 font-semibold',
  Medio: 'text-slate-300',
};

export default function RecomendacionesEstrategicas({ recomendaciones }: RecomendacionesEstrategicasProps) {
  return (
    <div className="chart-container">
      <h3 className="text-lg font-bold text-slate-50 mb-4 flex items-center gap-2">
        <span className="theme-accent">💡</span>
        Tabla 10: Recomendaciones Estratégicas
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700/50 text-slate-400 text-left">
              <th className="py-3 px-4 font-semibold">Área</th>
              <th className="py-3 px-4 font-semibold">Recomendación</th>
              <th className="py-3 px-4 font-semibold">Impacto</th>
              <th className="py-3 px-4 font-semibold">Prioridad</th>
            </tr>
          </thead>
          <tbody>
            {recomendaciones.map((r, i) => (
              <tr key={i} className="border-b border-slate-700/30 hover:bg-slate-800/40">
                <td className="py-3 px-4 font-medium text-slate-200">{r.area}</td>
                <td className="py-3 px-4 text-slate-300">{r.recomendacion}</td>
                <td className={`py-3 px-4 ${IMPACTO_STYLES[r.impacto] || 'text-slate-300'}`}>
                  {r.impacto}
                </td>
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-bold border ${PRIORIDAD_STYLES[r.prioridad] || 'bg-slate-500/20 border-slate-500/50 text-slate-400'}`}>
                    <span className="w-2 h-2 rounded-full bg-current" />
                    {r.prioridad}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {recomendaciones.length === 0 && (
        <div className="text-center py-8 text-slate-500">No hay recomendaciones activas</div>
      )}
    </div>
  );
}
