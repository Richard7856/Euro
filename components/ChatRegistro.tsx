'use client';

import { useState, useEffect, useRef } from 'react';
import { ChatBubbleLeftRightIcon, XMarkIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

type Registro = {
  id: string;
  tipo: string;
  mensaje_original: string;
  datos: Record<string, unknown>;
  created_at: string;
};

const TIPO_LABEL: Record<string, string> = {
  compra: '🛒 Compra',
  venta: '💰 Venta',
  promesa_proveedor: '📅 Promesa proveedor',
  promesa_cliente: '📅 Promesa cliente',
  contenedor: '📦 Contenedor',
  gasto: '📤 Gasto',
  cliente: '👤 Cliente',
  proveedor: '🏭 Proveedor',
  pago: '💳 Pago',
  nota: '📝 Nota',
};

export default function ChatRegistro() {
  const [open, setOpen] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const fetchRegistros = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/registros');
      if (!res.ok) throw new Error('Error al cargar');
      const json = await res.json();
      setRegistros(json.registros ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) fetchRegistros();
  }, [open]);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = 0;
  }, [registros]);

  const handleEnviar = async (e: React.FormEvent) => {
    e.preventDefault();
    const txt = mensaje.trim();
    if (!txt || sending) return;

    setSending(true);
    setError(null);
    try {
      const res = await fetch('/api/registros', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensaje: txt }),
      });
      const json = await res.json();

      if (!res.ok) throw new Error(json.error || 'Error al registrar');

      setMensaje('');
      setRegistros((prev) => [json.registro, ...prev]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg transition-colors"
        style={{ backgroundColor: 'var(--accent)' }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-light)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--accent)'; }}
        aria-label="Abrir chat de registro"
      >
        <ChatBubbleLeftRightIcon className="h-7 w-7" />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed inset-0 z-50 flex items-end justify-end p-4 pb-20 md:p-6 md:pb-24 pointer-events-none">
            <div
              className="pointer-events-auto w-full max-w-md rounded-2xl bg-slate-800 border border-slate-700 shadow-2xl flex flex-col max-h-[70vh]"
              onClick={(e) => e.stopPropagation()}
            >
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h3 className="font-semibold text-slate-100">Registro rápido</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <p className="px-4 py-2 text-xs text-slate-500 border-b border-slate-700/50">
              Ej: cliente Christ-CDMX Christian e Irving · proveedor DVD-BRS DAVIDSS BROSS · gasto flete 5000 transporte
            </p>

            <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[120px]">
              {loading && (
                <div className="text-center text-slate-500 py-4">Cargando...</div>
              )}
              {error && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3">
                  {error}
                </div>
              )}
              {!loading && registros.length === 0 && !error && (
                <div className="text-center text-slate-500 py-6 text-sm">
                  No hay registros. Escribe un mensaje para agregar uno.
                </div>
              )}
              {registros.map((r) => (
                <div
                  key={r.id}
                  className="rounded-lg bg-slate-700/50 border border-slate-600/50 p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium" style={{ color: 'var(--accent-light)' }}>
                      {TIPO_LABEL[r.tipo] ?? r.tipo}
                    </span>
                    <span className="text-xs text-slate-500">
                      {format(new Date(r.created_at), "d MMM HH:mm", { locale: es })}
                    </span>
                  </div>
                  <p className="text-sm text-slate-200 mt-1">{r.mensaje_original}</p>
                </div>
              ))}
            </div>

            <form onSubmit={handleEnviar} className="p-4 border-t border-slate-700">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={mensaje}
                  onChange={(e) => setMensaje(e.target.value)}
                  placeholder="Escribe para registrar..."
                  className="flex-1 rounded-lg bg-slate-900 border border-slate-600 px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:ring-2 focus:border-transparent theme-focus-ring outline-none"
                  disabled={sending}
                />
                <button
                  type="submit"
                  disabled={sending || !mensaje.trim()}
                  className="rounded-lg px-4 py-2.5 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors hover:opacity-90"
        style={{ backgroundColor: 'var(--accent)' }}
                >
                  <PaperAirplaneIcon className="h-5 w-5" />
                </button>
              </div>
            </form>
          </div>
        </div>
        </>
      )}
    </>
  );
}
