'use client';

import type { MetricaOperativa } from '@/lib/analisisEstrategico';

interface MetricasOperativasProps {
  metricas: MetricaOperativa[];
}

const ESTADO_STYLES: Record<MetricaOperativa['estado'], { bg: string; icon: string; label: string }> = {
  bueno: { bg: 'theme-accent-muted-bg border theme-accent-border', icon: '✔', label: 'Bueno' },
  regular: { bg: 'bg-amber-500/20 border-amber-500/50', icon: '!', label: 'Regular' },
  bajo: { bg: 'bg-orange-500/20 border-orange-500/50', icon: '✗', label: 'Bajo' },
  critico: { bg: 'bg-red-500/20 border-red-500/50', icon: '✗', label: 'Crítico' },
};

export default function MetricasOperativas({ metricas }: MetricasOperativasProps) {
  return (
    <div className="chart-container">
      <h3 className="text-lg font-bold text-slate-50 mb-4 flex items-center gap-2">
        <span className="text-blue-400">📊</span>
        Tabla 9: Métricas Operativas
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700/50 text-slate-400 text-left">
              <th className="py-3 px-4 font-semibold">KPI</th>
              <th className="py-3 px-4 font-semibold text-right">Valor</th>
              <th className="py-3 px-4 font-semibold text-right">Meta</th>
              <th className="py-3 px-4 font-semibold">Estado</th>
              <th className="py-3 px-4 font-semibold">Interpretación</th>
            </tr>
          </thead>
          <tbody>
            {metricas.map((m, i) => {
              const estilo = ESTADO_STYLES[m.estado];
              return (
                <tr key={i} className="border-b border-slate-700/30 hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-medium text-slate-200">{m.kpi}</td>
                  <td className="py-3 px-4 text-right font-semibold text-slate-100">{m.valor}</td>
                  <td className="py-3 px-4 text-right text-slate-400">{m.meta}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-bold border ${estilo.bg}`}>
                      {estilo.icon} {estilo.label}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-sm">{m.interpretacion}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
