'use client';

import { useState, useEffect, useCallback } from 'react';
import { useProfile } from '@/lib/profileContext';
import LogoutButton from '@/components/LogoutButton';
import type { ProfileRole } from '@/lib/profileContext';

interface PerfilRow {
  id: string;
  email: string | null;
  nombre: string | null;
  rol: string;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

const ROLES: ProfileRole[] = ['admin', 'ventas', 'logistica', 'finanzas', 'usuario'];

const rolLabel: Record<string, string> = {
  admin: 'Admin',
  ventas: 'Ventas',
  logistica: 'Logística',
  finanzas: 'Finanzas',
  usuario: 'Usuario',
};

export default function PerfilesPage() {
  const { isAdmin, profile: myProfile } = useProfile();
  const [perfiles, setPerfiles] = useState<PerfilRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [migrating, setMigrating] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [dataMessage, setDataMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

  const [apiKeyStatus, setApiKeyStatus] = useState<{ configured: boolean; masked?: string; source?: string } | null>(null);
  const [apiKeyLoading, setApiKeyLoading] = useState(false);
  const [apiKeyGenerating, setApiKeyGenerating] = useState(false);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);

  const fetchPerfiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/perfiles');
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `Error ${res.status}`);
      }
      const data = await res.json();
      setPerfiles(data.perfiles ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) fetchPerfiles();
  }, [isAdmin, fetchPerfiles]);

  const fetchApiKeyStatus = useCallback(() => {
    if (!isAdmin) return;
    setApiKeyLoading(true);
    fetch('/api/config/bot-api-key', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setApiKeyStatus({ configured: d.configured, masked: d.masked, source: d.source }))
      .catch(() => setApiKeyStatus(null))
      .finally(() => setApiKeyLoading(false));
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) fetchApiKeyStatus();
  }, [isAdmin, fetchApiKeyStatus]);

  const generateBotApiKey = async () => {
    setApiKeyGenerating(true);
    setNewApiKey(null);
    try {
      const res = await fetch('/api/config/bot-api-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'generate' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Error');
      setNewApiKey(data.api_key ?? '');
      fetchApiKeyStatus();
    } catch (e) {
      setDataMessage({ type: 'error', text: e instanceof Error ? e.message : 'Error al generar' });
    } finally {
      setApiKeyGenerating(false);
    }
  };

  const copyApiKey = () => {
    if (newApiKey) {
      navigator.clipboard.writeText(newApiKey);
      setDataMessage({ type: 'ok', text: 'API key copiada al portapapeles.' });
    }
  };

  const runMigrateSheets = async () => {
    setDataMessage(null);
    setMigrating(true);
    try {
      const res = await fetch('/api/migrate-sheets', { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Error al migrar');
      setDataMessage({ type: 'ok', text: `Migración completada: ${data.counts?.cobros ?? 0} cobros, ${data.counts?.compras ?? 0} compras, ${data.counts?.gastos ?? 0} gastos.` });
    } catch (e) {
      setDataMessage({ type: 'error', text: e instanceof Error ? e.message : 'Error' });
    } finally {
      setMigrating(false);
    }
  };

  const runSeedEjemplo = async () => {
    setDataMessage(null);
    setSeeding(true);
    try {
      const res = await fetch('/api/seed-datos-ejemplo', { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Error al cargar');
      setDataMessage({ type: 'ok', text: `Datos de ejemplo cargados: ${data.counts?.cobros ?? 0} cobros, ${data.counts?.compras ?? 0} compras, ${data.counts?.gastos ?? 0} gastos.` });
    } catch (e) {
      setDataMessage({ type: 'error', text: e instanceof Error ? e.message : 'Error' });
    } finally {
      setSeeding(false);
    }
  };

  const updateRol = async (userId: string, rol: ProfileRole) => {
    setUpdatingId(userId);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userId === myProfile?.id ? { rol } : { rol, user_id: userId }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'Error al actualizar');
      }
      setPerfiles((prev) => prev.map((p) => (p.id === userId ? { ...p, rol } : p)));
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error');
    } finally {
      setUpdatingId(null);
    }
  };

  if (!myProfile) return null;
  if (!isAdmin) {
    return (
      <main className="min-h-screen page-bg text-slate-50 p-8">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-slate-400">No tienes permiso para ver esta página.</p>
          <a href="/" className="text-blue-400 hover:underline mt-2 inline-block">Volver al inicio</a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen page-bg text-slate-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold gradient-text">
              Perfiles y roles
            </h1>
            <p className="text-slate-400 mt-1">Gestiona usuarios y asignación de roles (solo administradores).</p>
          </div>
          <LogoutButton />
        </header>

        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-10 h-10 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3">
            {error}
          </div>
        )}

        {dataMessage && (
          <div className={`rounded-xl px-4 py-3 ${dataMessage.type === 'ok' ? 'theme-accent-muted-bg theme-accent-border theme-accent-light' : 'bg-red-500/10 border border-red-500/30 text-red-300'}`}>
            {dataMessage.text}
          </div>
        )}

        <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-4 space-y-3">
          <h2 className="text-lg font-semibold text-slate-200">API Bot Cotizaciones</h2>
          <p className="text-slate-400 text-sm">
            La API key permite que el bot de cotizaciones (WhatsApp, etc.) consulte productos, envíe precios de proveedores y establezca el precio final. Header: <code className="text-slate-300">X-API-Key</code> o <code className="text-slate-300">Authorization: Bearer &lt;key&gt;</code>.
          </p>
          {apiKeyLoading ? (
            <p className="text-slate-500 text-sm">Comprobando…</p>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              {apiKeyStatus?.configured ? (
                <>
                  <span className="text-emerald-400 text-sm font-medium">Configurada</span>
                  {apiKeyStatus.masked && <span className="text-slate-500 font-mono text-sm">{apiKeyStatus.masked}</span>}
                  {apiKeyStatus.source === 'env' && <span className="text-slate-500 text-xs">(variable de entorno)</span>}
                </>
              ) : (
                <span className="text-slate-500 text-sm">No configurada</span>
              )}
              <button
                onClick={generateBotApiKey}
                disabled={apiKeyGenerating}
                className="px-4 py-2 rounded-lg bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600/30 text-sm font-medium disabled:opacity-50"
              >
                {apiKeyGenerating ? 'Generando…' : 'Generar nueva API key'}
              </button>
            </div>
          )}
          <p className="text-slate-500 text-xs">
            La key se guarda en el dashboard (o usa la variable de entorno COTIZACIONES_BOT_API_KEY). Al generar una nueva, cópiala y guárdala; no se volverá a mostrar.
          </p>
        </div>

        {newApiKey && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" role="dialog" aria-modal="true">
            <div className="bg-slate-800 rounded-xl border border-slate-600 max-w-lg w-full p-6 shadow-xl">
              <h3 className="text-lg font-semibold text-slate-100 mb-2">API key generada</h3>
              <p className="text-slate-400 text-sm mb-3">Cópiala y guárdala en un lugar seguro. No se volverá a mostrar.</p>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  readOnly
                  value={newApiKey}
                  className="flex-1 rounded-lg bg-slate-900 border border-slate-600 px-3 py-2 text-slate-200 font-mono text-sm"
                />
                <button type="button" onClick={copyApiKey} className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500">
                  Copiar
                </button>
              </div>
              <button type="button" onClick={() => setNewApiKey(null)} className="w-full py-2 rounded-lg bg-slate-700 text-slate-200 hover:bg-slate-600">
                Cerrar
              </button>
            </div>
          </div>
        )}

        <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-4 space-y-3">
          <h2 className="text-lg font-semibold text-slate-200">Cargar datos</h2>
          <p className="text-slate-400 text-sm">Llena ventas, compras y gastos para probar el dashboard.</p>
          <div className="flex flex-wrap gap-3">
            <button onClick={runMigrateSheets} disabled={migrating || seeding} className="btn-primary flex items-center gap-2">
              {migrating ? 'Migrando...' : '📊 Migrar desde Google Sheets'}
            </button>
            <button onClick={runSeedEjemplo} disabled={migrating || seeding} className="btn-secondary flex items-center gap-2">
              {seeding ? 'Cargando...' : '📦 Cargar datos de ejemplo'}
            </button>
          </div>
          <p className="text-slate-500 text-xs">Sheets: configura GOOGLE_SHEETS_* en .env.local. Ejemplo: no requiere Sheets.</p>
        </div>

        {!loading && !error && (
          <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-700/50 bg-slate-800/50">
                  <th className="px-4 py-3 text-slate-300 font-medium">Usuario / Email</th>
                  <th className="px-4 py-3 text-slate-300 font-medium">Nombre</th>
                  <th className="px-4 py-3 text-slate-300 font-medium">Rol</th>
                  <th className="px-4 py-3 text-slate-300 font-medium">Estado</th>
                  <th className="px-4 py-3 text-slate-300 font-medium">Acción</th>
                </tr>
              </thead>
              <tbody>
                {perfiles.map((p) => (
                  <tr key={p.id} className="border-b border-slate-700/30 hover:bg-slate-800/30">
                    <td className="px-4 py-3 text-slate-200">{p.email || p.id}</td>
                    <td className="px-4 py-3 text-slate-300">{p.nombre || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-700 text-slate-300">
                        {rolLabel[p.rol] ?? p.rol}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {p.activo ? (
                        <span className="theme-accent text-sm">Activo</span>
                      ) : (
                        <span className="text-slate-500 text-sm">Inactivo</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {p.id === myProfile.id ? (
                        <span className="text-slate-500 text-sm">Tú</span>
                      ) : (
                        <select
                          value={p.rol}
                          disabled={updatingId === p.id}
                          onChange={(e) => updateRol(p.id, e.target.value as ProfileRole)}
                          className="bg-slate-800 border border-slate-600 rounded-lg px-2 py-1 text-sm text-slate-200"
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>{rolLabel[r]}</option>
                          ))}
                        </select>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="text-slate-500 text-sm">
          Los roles definen permisos en el dashboard. Admin puede gestionar perfiles y asignar roles.
        </p>
      </div>
    </main>
  );
}
