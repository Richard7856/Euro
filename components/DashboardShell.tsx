'use client';

import { usePathname } from 'next/navigation';
import DashboardNav from './DashboardNav';
import ChatRegistro from './ChatRegistro';
import { useEmpresaOptional } from '@/lib/empresaContext';

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showNav = pathname !== '/login' && pathname !== '/configurar-2fa';
  const empresaContext = useEmpresaOptional();
  const shellBg = empresaContext?.theme?.shellBg ?? '#0a0a0a';

  if (!showNav) {
    return (
      <>
        {children}
      </>
    );
  }

  const empresaSlug = empresaContext?.empresa;

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ backgroundColor: shellBg }}
      {...(empresaSlug ? { 'data-empresa': empresaSlug } : {})}
    >
      <DashboardNav />
      <main className="flex-1 overflow-auto min-w-0 min-h-0" {...(empresaSlug ? { 'data-empresa': empresaSlug } : {})}>
        {children}
      </main>
      <ChatRegistro />
    </div>
  );
}
