'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * "Datos en vivo" se unificó con Financiero. Redirigir a /financiero (datos en tiempo real).
 */
export default function DinamicoPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/financiero');
  }, [router]);
  return (
    <main className="min-h-screen page-bg flex items-center justify-center text-slate-400">
      Redirigiendo a Financiero…
    </main>
  );
}
