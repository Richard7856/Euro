'use client';

import { useRouter } from 'next/navigation';
import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';

export default function LogoutButton() {
  const router = useRouter();

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;

  const handleLogout = async () => {
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // Ignorar si Supabase no está configurado
    }
    router.push('/login');
    router.refresh();
  };

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800/60 transition-colors text-sm"
      type="button"
    >
      <ArrowRightOnRectangleIcon className="w-5 h-5" />
      Cerrar sesión
    </button>
  );
}
