'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

export const EMPRESAS = [
  { slug: 'euromex' as const, name: 'Euromex', subtitle: 'Import/Export' },
  { slug: 'garritas' as const, name: 'Garritas', subtitle: 'Croquetas' },
  { slug: 'cigarros' as const, name: 'Cigarros', subtitle: 'Cigarros' },
];

export type EmpresaSlug = (typeof EMPRESAS)[number]['slug'];

export interface EmpresaTheme {
  /** Clases para acento principal (botones, links activos, títulos) */
  accent: string;
  accentMuted: string;
  /** Nav: item activo */
  navActiveBg: string;
  navActiveText: string;
  /** Selector: borde/icono de la empresa */
  selectorAccent: string;
  /** Fondo del shell (sidebar + main) cuando aplica */
  shellBg: string;
  /** Logo/texto del selector */
  logoGradient: string;
}

export const EMPRESA_THEMES: Record<EmpresaSlug, EmpresaTheme> = {
  euromex: {
    accent: 'emerald',
    accentMuted: 'emerald-500/20',
    navActiveBg: 'bg-emerald-500/20',
    navActiveText: 'text-emerald-300',
    selectorAccent: 'emerald',
    shellBg: '#0a0a0a',
    logoGradient: 'from-emerald-400 to-teal-400',
  },
  garritas: {
    accent: 'red',
    accentMuted: 'red-500/20',
    navActiveBg: 'bg-red-500/20',
    navActiveText: 'text-red-300',
    selectorAccent: 'red',
    shellBg: '#0a0a0a',
    logoGradient: 'from-red-400 to-red-600',
  },
  cigarros: {
    accent: 'amber',
    accentMuted: 'amber-200/20',
    navActiveBg: 'bg-amber-200/15',
    navActiveText: 'text-amber-100',
    selectorAccent: 'stone',
    shellBg: '#292524',
    logoGradient: 'from-amber-100 to-stone-300',
  },
};

const STORAGE_KEY = 'dashboard_empresa';

interface EmpresaContextValue {
  empresa: EmpresaSlug;
  setEmpresa: (slug: EmpresaSlug) => void;
  theme: EmpresaTheme;
  empresaInfo: (typeof EMPRESAS)[number];
}

const EmpresaContext = createContext<EmpresaContextValue | null>(null);

export function EmpresaProvider({ children }: { children: React.ReactNode }) {
  const [empresa, setEmpresaState] = useState<EmpresaSlug>('euromex');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as EmpresaSlug | null;
      if (stored && EMPRESAS.some((e) => e.slug === stored)) {
        setEmpresaState(stored);
        document.cookie = `empresa=${stored}; path=/; max-age=31536000; SameSite=Lax`;
      }
    } catch {
      // ignore
    }
    setMounted(true);
  }, []);

  const setEmpresa = useCallback((slug: EmpresaSlug) => {
    setEmpresaState(slug);
    try {
      localStorage.setItem(STORAGE_KEY, slug);
      document.cookie = `empresa=${slug}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {
      // ignore
    }
  }, []);

  const empresaInfo = EMPRESAS.find((e) => e.slug === empresa) ?? EMPRESAS[0];
  const theme = EMPRESA_THEMES[empresa];

  return (
    <EmpresaContext.Provider
      value={{
        empresa,
        setEmpresa,
        theme,
        empresaInfo,
      }}
    >
      {children}
    </EmpresaContext.Provider>
  );
}

export function useEmpresa() {
  const ctx = useContext(EmpresaContext);
  if (!ctx) throw new Error('useEmpresa debe usarse dentro de EmpresaProvider');
  return ctx;
}

export function useEmpresaOptional() {
  return useContext(EmpresaContext);
}
