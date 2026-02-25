'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

export type ProfileRole = 'admin' | 'ventas' | 'logistica' | 'finanzas' | 'usuario';

export interface Profile {
  id: string;
  email: string | null;
  nombre: string | null;
  rol: ProfileRole;
  activo: boolean;
  module_overrides?: Record<string, boolean>;
}

/** Módulos que se pueden restringir por usuario (clave = ruta o identificador) */
export const MODULE_KEYS = ['inicio', 'financiero', 'ventas', 'compras', 'mercancia', 'clientes', 'proveedores', 'gastos', 'contenedores', 'promesas', 'dinamico', 'cobranza', 'cotizador', 'perfiles', 'usuarios'] as const;
export type ModuleKey = (typeof MODULE_KEYS)[number];

interface ProfileContextValue {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  isAdmin: boolean;
  hasRole: (...roles: ProfileRole[]) => boolean;
  /** Si el usuario puede ver este módulo (admin siempre true; si no, depende de module_overrides) */
  canAccessModule: (module: string) => boolean;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/profile');
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      } else {
        if (res.status === 401) setProfile(null);
        else setError(await res.json().then((j) => j.error).catch(() => 'Error al cargar perfil'));
      }
    } catch {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const isAdmin = profile?.rol === 'admin';
  const hasRole = useCallback(
    (...roles: ProfileRole[]) => (profile ? roles.includes(profile.rol) : false),
    [profile]
  );
  const canAccessModule = useCallback(
    (module: string) => {
      if (!profile) return true;
      if (isAdmin) return true;
      const overrides = profile.module_overrides ?? {};
      return overrides[module] !== false;
    },
    [profile, isAdmin]
  );

  return (
    <ProfileContext.Provider
      value={{
        profile,
        loading,
        error,
        refetch: fetchProfile,
        isAdmin,
        hasRole,
        canAccessModule,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile debe usarse dentro de ProfileProvider');
  return ctx;
}

export function useProfileOptional() {
  return useContext(ProfileContext);
}
