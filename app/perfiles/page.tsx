'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Perfiles se unificó con Control de Usuarios (/usuarios).
 * La gestión de roles, permisos y API key del bot está en /usuarios.
 */
export default function PerfilesPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/usuarios');
  }, [router]);
  return (
    <main className="min-h-screen page-bg flex items-center justify-center text-slate-400">
      Redirigiendo a Control de usuarios…
    </main>
  );
}
