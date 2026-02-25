'use client';

import { useState, useEffect, useCallback } from 'react';
import { useProfile } from '@/lib/profileContext';
import Link from 'next/link';
import LogoutButton from '@/components/LogoutButton';
import type { ProfileRole } from '@/lib/profileContext';
import { MODULE_KEYS } from '@/lib/profileContext';
import { ChevronDownIcon, ChevronRightIcon, UserCircleIcon } from '@heroicons/react/24/outline';

interface PerfilRow {
  id: string;
  email: string | null;
  nombre: string | null;
  rol: string;
  activo: boolean;
  module_overrides?: Record<string, boolean>;
}

const ROLES: ProfileRole[] = ['admin', 'ventas', 'logistica', 'finanzas', 'usuario'];
const rolLabel: Record<string, string> = {
  admin: 'Admin',
  ventas: 'Ventas',
  logistica: 'Logística',
  finanzas: 'Finanzas',
  usuario: 'Usuario',
};

const moduleLabels: Record<string, string> = {
  inicio: 'Inicio',
  financiero: 'Financiero',
  ventas: 'Ventas',
  compras: 'Compras',
  mercancia: 'Mercancía',
  clientes: 'Clientes',
  proveedores: 'Proveedores',
  gastos: 'Gastos',
  contenedores: 'Contenedores',
  promesas: 'Promesas de pago',
  dinamico: 'Datos en vivo',
  cobranza: 'Cobranza',
  perfiles: 'Perfiles',
  usuarios: 'Control de usuarios',
};

export default function UsuariosPage() {
  const { isAdmin, profile: myProfile } = useProfile();
  const [perfiles, setPerfiles] = useState<PerfilRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingRol, setUpdatingRol] = useState<string | null>(null);
  const [updatingPermisos, setUpdatingPermisos] = useState<string | null>(null);
  const [localOverrides, setLocalOverrides] = useState<Record<string, Record<string, boolean>>>({});

  const fetchPerfiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/perfiles');
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Error');
      const data = await res.json();
      setPerfiles(data.perfiles ?? []);
      const overrides: Record<string, Record<string, boolean>> = {};
      (data.perfiles ?? []).forEach((p: PerfilRow) => {
        overrides[p.id] = { ...(p.module_overrides ?? {}) };
      });
      setLocalOverrides(overrides);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) fetchPerfiles();
  }, [isAdmin, fetchPerfiles]);

  const updateRol = async (userId: string, rol: ProfileRole) => {
    setUpdatingRol(userId);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userId === myProfile?.id ? { rol } : { rol, user_id: userId }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setPerfiles((prev) => prev.map((p) => (p.id === userId ? { ...p, rol } : p)));
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error');
    } finally {
      setUpdatingRol(null);
    }
  };

  const setOverride = (userId: string, moduleKey: string, value: boolean) => {
    setLocalOverrides((prev) => ({
      ...prev,
      [userId]: { ...(prev[userId] ?? {}), [moduleKey]: value },
    }));
  };

  const savePermisos = async (userId: string) => {
    setUpdatingPermisos(userId);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, module_overrides: localOverrides[userId] ?? {} }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setPerfiles((prev) => prev.map((p) => (p.id === userId ? { ...p, module_overrides: localOverrides[userId] } : p)));
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error al guardar permisos');
    } finally {
      setUpdatingPermisos(null);
    }
  };

  if (!myProfile) return null;
  if (!isAdmin) {
    return (
      <main className="min-h-screen page-bg text-slate-50 p-8">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-slate-400">No tienes permiso para ver esta página.</p>
          <Link href="/" className="text-blue-400 hover:underline mt-2 inline-block">Volver al inicio</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen page-bg text-slate-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="inline-flex p-3 rounded-xl bg-violet-500/10">
              <UserCircleIcon className="h-8 w-8 text-violet-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold gradient-text">
                Control de usuarios
              </h1>
              <p className="text-slate-400 mt-1">Asigna roles y permisos por módulo. Pantalla de muestra para definir quién ve qué.</p>
            </div>
          </div>
          <LogoutButton />
        </header>

        <div className="rounded-xl bg-slate-800/30 border border-slate-700/50 p-4 text-slate-400 text-sm">
          <strong className="text-slate-300">Cómo funciona:</strong> El <strong>rol</strong> define el tipo de usuario (Admin ve todo y puede gestionar). Los <strong>permisos por módulo</strong> permiten ocultar secciones concretas: si desmarcas &quot;Puede ver Ventas&quot;, ese usuario no verá el enlace a Ventas en el menú ni podrá acceder. Deja todos marcados para acceso completo (por defecto).
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-10 h-10 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
          </div>
        )}
        {error && <div className="rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3">{error}</div>}

        {!loading && !error && (
          <div className="space-y-4">
            {perfiles.map((p) => (
              <div key={p.id} className="rounded-xl border border-slate-700/50 bg-slate-800/30 overflow-hidden">
                <div
                  className="flex flex-wrap items-center gap-4 p-4 cursor-pointer hover:bg-slate-800/50"
                  onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}
                >
                  {expandedId === p.id ? (
                    <ChevronDownIcon className="h-5 w-5 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronRightIcon className="h-5 w-5 text-slate-400 shrink-0" />
                  )}
                  <span className="font-medium text-slate-200">{p.nombre || p.email || p.id}</span>
                  <span className="text-slate-500 text-sm">{p.email}</span>
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-700 text-slate-300">
                    {rolLabel[p.rol] ?? p.rol}
                  </span>
                  {p.id === myProfile.id && <span className="text-slate-500 text-xs">(tú)</span>}
                  <div className="ml-auto flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={p.rol}
                      disabled={updatingRol === p.id}
                      onChange={(e) => updateRol(p.id, e.target.value as ProfileRole)}
                      className="bg-slate-800 border border-slate-600 rounded-lg px-2 py-1 text-sm text-slate-200"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>{rolLabel[r]}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {expandedId === p.id && (
                  <div className="border-t border-slate-700/50 p-4 bg-slate-900/30">
                    <h3 className="text-sm font-medium text-slate-300 mb-3">Permisos por módulo (qué puede ver)</h3>
                    <p className="text-slate-500 text-xs mb-3">Marcado = puede ver el módulo. Desmarcado = oculto en su menú y sin acceso.</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {MODULE_KEYS.map((key) => (
                        <label key={key} className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={(localOverrides[p.id] ?? {})[key] !== false}
                            onChange={(e) => setOverride(p.id, key, e.target.checked)}
                            className="rounded border-slate-600 bg-slate-800 text-violet-500"
                          />
                          {moduleLabels[key] ?? key}
                        </label>
                      ))}
                    </div>
                    <button
                      onClick={() => savePermisos(p.id)}
                      disabled={updatingPermisos === p.id}
                      className="mt-4 btn-primary text-sm"
                    >
                      {updatingPermisos === p.id ? 'Guardando...' : 'Guardar permisos'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <p className="text-slate-500 text-sm">
          Los cambios de permisos se aplican al recargar o al navegar. Admin siempre tiene acceso a todo.
        </p>
      </div>
    </main>
  );
}
