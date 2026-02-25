'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  CurrencyDollarIcon,
  CubeIcon,
  UserGroupIcon,
  TruckIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  BuildingStorefrontIcon,
  BanknotesIcon,
  UserCircleIcon,
  ArrowTrendingUpIcon,
  ShoppingCartIcon,
  UsersIcon,
  ChevronDownIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  CurrencyDollarIcon as CurrencyDollarIconSolid,
  CubeIcon as CubeIconSolid,
  UserGroupIcon as UserGroupIconSolid,
  TruckIcon as TruckIconSolid,
  CalendarDaysIcon as CalendarDaysIconSolid,
  ChartBarIcon as ChartBarIconSolid,
  BuildingStorefrontIcon as BuildingStorefrontIconSolid,
  BanknotesIcon as BanknotesIconSolid,
  UserCircleIcon as UserCircleIconSolid,
  ArrowTrendingUpIcon as ArrowTrendingUpIconSolid,
  ShoppingCartIcon as ShoppingCartIconSolid,
  UsersIcon as UsersIconSolid,
  DocumentTextIcon as DocumentTextIconSolid,
} from '@heroicons/react/24/solid';
import LogoutButton from './LogoutButton';
import CurrencyToggle from './CurrencyToggle';
import { useProfileOptional } from '@/lib/profileContext';
import { useEmpresaOptional } from '@/lib/empresaContext';
import { EMPRESAS, EMPRESA_THEMES, type EmpresaSlug } from '@/lib/empresaContext';

const navItems: { href: string; label: string; moduleKey: string; Icon: typeof HomeIcon; IconActive: typeof HomeIconSolid; euromexOnly?: boolean }[] = [
  { href: '/', label: 'Inicio', moduleKey: 'inicio', Icon: HomeIcon, IconActive: HomeIconSolid },
  { href: '/financiero', label: 'Financiero', moduleKey: 'financiero', Icon: CurrencyDollarIcon, IconActive: CurrencyDollarIconSolid },
  { href: '/ventas', label: 'Ventas', moduleKey: 'ventas', Icon: ArrowTrendingUpIcon, IconActive: ArrowTrendingUpIconSolid },
  { href: '/compras', label: 'Compras', moduleKey: 'compras', Icon: ShoppingCartIcon, IconActive: ShoppingCartIconSolid },
  { href: '/cotizador', label: 'Cotizador', moduleKey: 'cotizador', Icon: DocumentTextIcon, IconActive: DocumentTextIconSolid, euromexOnly: true },
  { href: '/mercancia', label: 'Mercancía', moduleKey: 'mercancia', Icon: CubeIcon, IconActive: CubeIconSolid },
  { href: '/clientes', label: 'Clientes', moduleKey: 'clientes', Icon: UserGroupIcon, IconActive: UserGroupIconSolid },
  { href: '/proveedores', label: 'Proveedores', moduleKey: 'proveedores', Icon: BuildingStorefrontIcon, IconActive: BuildingStorefrontIconSolid },
  { href: '/gastos', label: 'Gastos', moduleKey: 'gastos', Icon: BanknotesIcon, IconActive: BanknotesIconSolid },
  { href: '/contenedores', label: 'Contenedores', moduleKey: 'contenedores', Icon: TruckIcon, IconActive: TruckIconSolid },
  { href: '/promesas', label: 'Promesas de pago', moduleKey: 'promesas', Icon: CalendarDaysIcon, IconActive: CalendarDaysIconSolid },
  { href: '/dinamico', label: 'Datos en vivo', moduleKey: 'dinamico', Icon: ChartBarIcon, IconActive: ChartBarIconSolid },
];

const rolLabel: Record<string, string> = {
  admin: 'Admin',
  ventas: 'Ventas',
  logistica: 'Logística',
  finanzas: 'Finanzas',
  usuario: 'Usuario',
};

export default function DashboardNav() {
  const pathname = usePathname();
  const profileContext = useProfileOptional();
  const profile = profileContext?.profile;
  const isAdmin = profile?.rol === 'admin';
  const empresaContext = useEmpresaOptional();
  const theme = empresaContext?.theme ?? EMPRESA_THEMES.euromex;
  const empresaInfo = empresaContext?.empresaInfo ?? EMPRESAS[0];
  const setEmpresa = empresaContext?.setEmpresa;

  const [selectorOpen, setSelectorOpen] = useState(false);
  const selectorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (selectorRef.current && !selectorRef.current.contains(e.target as Node)) {
        setSelectorOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const visibleItems = navItems.filter((item) => {
    if (!profileContext?.canAccessModule(item.moduleKey)) return false;
    if (item.euromexOnly && empresaContext?.empresa !== 'euromex') return false;
    return true;
  });

  const navLink = (isActive: boolean) =>
    isActive
      ? `${theme.navActiveBg} ${theme.navActiveText}`
      : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200';

  return (
    <aside className="w-56 shrink-0 flex flex-col border-r border-zinc-800/80 min-h-screen" style={{ backgroundColor: 'var(--sidebar-bg)' }}>
      <div className="p-3 border-b border-zinc-800/80" ref={selectorRef}>
        {setEmpresa ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => setSelectorOpen((o) => !o)}
              className="w-full flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left bg-zinc-800/50 border border-zinc-700/50 hover:border-zinc-600 transition-colors"
              aria-expanded={selectorOpen}
              aria-haspopup="listbox"
              aria-label="Cambiar empresa"
            >
              <span className={`text-sm font-bold bg-gradient-to-r ${theme.logoGradient} bg-clip-text text-transparent truncate`}>
                {empresaInfo.name}
              </span>
              <ChevronDownIcon className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform ${selectorOpen ? 'rotate-180' : ''}`} />
            </button>
            {selectorOpen && (
              <ul
                className="absolute top-full left-0 right-0 mt-1 py-1 rounded-lg bg-zinc-900 border border-zinc-700 shadow-xl z-50"
                role="listbox"
              >
                {EMPRESAS.map((e) => {
                  const t = EMPRESA_THEMES[e.slug];
                  const isSelected = empresaInfo.slug === e.slug;
                  return (
                    <li key={e.slug} role="option" aria-selected={isSelected}>
                      <button
                        type="button"
                        onClick={() => {
                          setEmpresa(e.slug);
                          setSelectorOpen(false);
                        }}
                        className={`w-full flex flex-col items-start px-3 py-2.5 text-left rounded-md transition-colors ${
                          isSelected ? 'bg-zinc-800' : 'hover:bg-zinc-800/70'
                        }`}
                      >
                        <span className={`text-sm font-semibold bg-gradient-to-r ${t.logoGradient} bg-clip-text text-transparent`}>
                          {e.name}
                        </span>
                        <span className="text-xs text-zinc-500 mt-0.5">{e.subtitle}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        ) : (
          <Link href="/" className="flex items-center gap-2">
            <span className="text-lg font-bold gradient-text">
              Euromex · Import/Export
            </span>
          </Link>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {visibleItems.map(({ href, label, Icon, IconActive }) => {
          const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
          const IconC = isActive ? IconActive : Icon;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${navLink(isActive)}`}
            >
              <IconC className="h-5 w-5 shrink-0" />
              <span>{label}</span>
            </Link>
          );
        })}

        {isAdmin && (
          <>
            <div className="my-2 border-t border-zinc-800/80 pt-2">
              <div className="px-3 py-1.5 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Admin</div>
            </div>
            <Link
              href="/perfiles"
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                pathname === '/perfiles'
                  ? 'bg-amber-500/20 text-amber-300'
                  : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
              }`}
            >
              {pathname === '/perfiles' ? <UserCircleIconSolid className="h-5 w-5 shrink-0" /> : <UserCircleIcon className="h-5 w-5 shrink-0" />}
              <span>Perfiles</span>
            </Link>
            <Link
              href="/usuarios"
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${navLink(pathname === '/usuarios')}`}
            >
              {pathname === '/usuarios' ? <UsersIconSolid className="h-5 w-5 shrink-0" /> : <UsersIcon className="h-5 w-5 shrink-0" />}
              <span>Usuarios</span>
            </Link>
          </>
        )}
      </nav>

      <div className="p-3 border-t border-zinc-800/80 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-zinc-500">Moneda</span>
          <CurrencyToggle />
        </div>
        {profile && (
          <div className="rounded-lg bg-zinc-800/50 px-3 py-2 border border-zinc-700/50">
            <p className="text-zinc-300 text-sm truncate" title={profile.email ?? undefined}>
              {profile.nombre || profile.email || 'Usuario'}
            </p>
            <p className={`text-xs font-medium mt-0.5 ${theme.navActiveText}`}>
              {rolLabel[profile.rol] ?? profile.rol}
            </p>
          </div>
        )}
        <LogoutButton />
      </div>
    </aside>
  );
}
