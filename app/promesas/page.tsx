'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CalendarDaysIcon, ArrowLeftIcon, ChatBubbleBottomCenterTextIcon } from '@heroicons/react/24/outline';

type Registro = {
  id: string;
  tipo: string;
  mensaje_original: string | null;
  datos: Record<string, unknown>;
  created_at: string;
};

export default function PromesasPage() {
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/registros')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Error al cargar'))))
      .then((d) => setRegistros(d.registros ?? []))
      .catch((e) => setError(e instanceof Error ? e.message : 'Error'))
      .finally(() => setLoading(false));
  }, []);

  const promesas = registros.filter((r) => r.tipo === 'promesa_proveedor' || r.tipo === 'promesa_cliente');

  return (
    <main className="min-h-screen page-bg text-slate-50 p-4 md:p-8">
      <div className="max-w-[1000px] mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 rounded-lg hover:bg-slate-800 transition-colors">
            <ArrowLeftIcon className="w-6 h-6 text-slate-400" />
          </Link>
          <div className="inline-flex p-3 rounded-xl bg-blue-500/10">
            <CalendarDaysIcon className="h-8 w-8 text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-100">Promesas de pago</h1>
            <p className="text-slate-400">Registros de promesas (proveedor o cliente) capturados desde el chat.</p>
          </div>
        </div>

        <p className="text-slate-500 text-sm flex items-center gap-2">
          <ChatBubbleBottomCenterTextIcon className="w-4 h-4" />
          Escribe en el chat: <code className="text-amber-400">promesa cliente ID_CLIENTE 5000 2026-03-15</code> o <code className="text-amber-400">promesa proveedor ID_PROV 10000 2026-03-20</code>
        </p>

        {loading && <div className="text-center text-slate-500 py-12">Cargando...</div>}
        {error && <div className="rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 p-4">{error}</div>}

        {!loading && !error && (
          <div className="rounded-xl bg-slate-800/40 border border-slate-700/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-slate-400 bg-slate-800/60">
                  <tr>
                    <th className="py-3 px-4 font-medium">Fecha</th>
                    <th className="py-3 px-4 font-medium">Tipo</th>
                    <th className="py-3 px-4 font-medium">Mensaje / Datos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {promesas.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-800/30">
                      <td className="py-3 px-4 text-slate-400">
                        {new Date(r.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${r.tipo === 'promesa_cliente' ? 'bg-blue-500/20 text-blue-400' : 'bg-amber-500/20 text-amber-400'}`}>
                          {r.tipo === 'promesa_cliente' ? 'Cliente' : 'Proveedor'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-300">{r.mensaje_original || JSON.stringify(r.datos)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {promesas.length === 0 && (
              <div className="p-12 text-center text-slate-500">
                No hay promesas de pago registradas. Usa el chat de la esquina para registrar una con: <code className="text-amber-400">promesa cliente &lt;id&gt; &lt;monto&gt; &lt;fecha&gt;</code>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
