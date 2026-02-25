'use client';

import { useEffect } from 'react';
import { useEmpresaOptional } from '@/lib/empresaContext';

/** Sincroniza data-empresa en body para temas CSS cuando hay EmpresaProvider (dashboard). */
export default function EmpresaBodySync() {
  const ctx = useEmpresaOptional();
  const empresa = ctx?.empresa;

  useEffect(() => {
    if (typeof document === 'undefined' || !empresa) return;
    document.body.setAttribute('data-empresa', empresa);
    return () => {
      document.body.removeAttribute('data-empresa');
    };
  }, [empresa]);

  return null;
}
