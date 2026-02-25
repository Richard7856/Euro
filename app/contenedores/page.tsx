'use client';

import Link from 'next/link';
import { ArrowLeftIcon, MapPinIcon } from '@heroicons/react/24/outline';

/**
 * Contenedores: en el futuro aquí irá el mapa de rastreo de contenedores (temperatura, ubicación, etc.).
 * La tabla de envíos y logística está en Compras.
 */
export default function ContenedoresPage() {
  return (
    <main className="min-h-screen page-bg text-slate-50 p-4 md:p-8">
      <div className="max-w-[900px] mx-auto">
        <div className="flex flex-wrap items-center gap-4 mb-8">
          <Link href="/" className="p-2 rounded-lg hover:bg-slate-800 transition-colors">
            <ArrowLeftIcon className="w-6 h-6 text-slate-400" />
          </Link>
          <div className="inline-flex p-3 rounded-xl bg-sky-500/10">
            <MapPinIcon className="h-8 w-8 text-sky-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-100">Contenedores</h1>
            <p className="text-slate-400 mt-1">
              Rastreo de contenedores en tránsito (mapa, temperatura, ubicación). Próximamente.
            </p>
          </div>
        </div>

        <div className="rounded-xl bg-slate-800/40 border border-slate-700/50 p-8 md:p-12 text-center">
          <div className="inline-flex p-4 rounded-2xl bg-sky-500/10 mb-6">
            <MapPinIcon className="h-16 w-16 text-sky-400" />
          </div>
          <h2 className="text-xl font-semibold text-slate-200 mb-2">Mapa de rastreo (próximamente)</h2>
          <p className="text-slate-400 max-w-md mx-auto mb-6">
            Aquí podrás ver en un mapa la ubicación de los contenedores, temperatura y estado del envío en tiempo real.
          </p>
          <Link
            href="/compras"
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-colors text-sm font-medium"
          >
            Ver envíos y logística en Compras
          </Link>
        </div>
      </div>
    </main>
  );
}
