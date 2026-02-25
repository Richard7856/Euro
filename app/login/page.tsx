'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LockClosedIcon, EnvelopeIcon } from '@heroicons/react/24/outline';

type Step = 'email-password' | 'mfa' | 'mfa-error';

function useSupabase() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createClient } = require('@/lib/supabase/client');
    return createClient();
  } catch {
    return null;
  }
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  const supabase = useSupabase();

  const [step, setStep] = useState<Step>('email-password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    const checkSession = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
          if (aalData?.currentLevel === 'aal2' || aalData?.nextLevel === 'aal1') {
            router.push(redirect);
          } else if (aalData?.nextLevel === 'aal2') {
            setStep('mfa');
          } else {
            router.push(redirect);
          }
        }
      } catch {
        try {
          await supabase.auth.signOut({ scope: 'local' });
        } catch {
          // Ignorar si falla limpiar sesión local
        }
      }
    };
    checkSession();
  }, [supabase, router, redirect]);

  const handleEmailPassword = async (e: React.FormEvent) => {
    if (!supabase) return;
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;

      const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aalData?.nextLevel === 'aal2' && aalData?.nextLevel !== aalData?.currentLevel) {
        setStep('mfa');
      } else {
        router.push(redirect);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleMFA = async (e: React.FormEvent) => {
    if (!supabase) return;
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();
      if (factorsError) throw factorsError;
      const totpFactor = factorsData?.totp?.[0];
      if (!totpFactor) throw new Error('No hay factor 2FA configurado');

      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: totpFactor.id });
      if (challengeError) throw challengeError;
      if (!challenge?.id) throw new Error('Error al crear el desafío');

      const code = mfaCode.replace(/\s/g, '');
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: totpFactor.id,
        challengeId: challenge.id,
        code,
      });
      if (verifyError) throw verifyError;

      await supabase.auth.refreshSession();
      router.push(redirect);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Código inválido');
      setStep('mfa-error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (supabase) await supabase.auth.signOut();
    setStep('email-password');
    setMfaCode('');
    setError('');
  };

  if (!supabase) {
    return (
      <div className="min-h-screen page-bg flex items-center justify-center p-4">
        <div className="rounded-2xl bg-slate-800/60 border border-slate-700/50 p-8 max-w-md text-center">
          <p className="text-slate-400 mb-4">Configura Supabase en .env.local para habilitar el login.</p>
          <a href="/" className="theme-accent-light hover:underline">Ir al dashboard</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen page-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-slate-800/60 border border-slate-700/50 p-8 shadow-xl">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold gradient-text">
              Dashboard Financiero
            </h1>
            <p className="text-slate-400 mt-1 text-sm">Inicia sesión para continuar</p>
          </div>

          {step === 'email-password' && (
            <form onSubmit={handleEmailPassword} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Correo</label>
                <div className="relative">
                  <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="tu@email.com"
                    className="w-full pl-10 pr-4 py-3 rounded-lg bg-slate-900/80 border border-slate-600 text-slate-100 placeholder-slate-500 focus:ring-2 focus:border-transparent outline-none theme-focus-ring"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Contraseña</label>
                <div className="relative">
                  <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 rounded-lg bg-slate-900/80 border border-slate-600 text-slate-100 placeholder-slate-500 focus:ring-2 focus:border-transparent outline-none theme-focus-ring"
                  />
                </div>
              </div>
              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-lg text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed theme-accent-bg hover:opacity-90"
              >
                {loading ? 'Verificando...' : 'Iniciar sesión'}
              </button>
            </form>
          )}

          {(step === 'mfa' || step === 'mfa-error') && (
            <form onSubmit={handleMFA} className="space-y-5">
              <div className="text-center mb-4">
                <p className="text-slate-300">Verificación en 2 pasos</p>
                <p className="text-sm text-slate-500 mt-1">
                  Introduce el código de tu app de autenticación
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Código</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  autoFocus
                  className="w-full px-4 py-3 rounded-lg bg-slate-900/80 border border-slate-600 text-slate-100 placeholder-slate-500 focus:ring-2 focus:border-transparent outline-none text-center text-xl tracking-[0.5em] theme-focus-ring"
                />
              </div>
              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                  {error}
                </div>
              )}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex-1 py-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium transition-colors"
                >
                  Volver
                </button>
                <button
                  type="submit"
                  disabled={loading || mfaCode.length !== 6}
                  className="flex-1 py-3 rounded-lg text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed theme-accent-bg hover:opacity-90"
                >
                  {loading ? 'Verificando...' : 'Verificar'}
                </button>
              </div>
            </form>
          )}
        </div>
        <p className="text-center text-slate-500 text-sm mt-6">
          <a href="/configurar-2fa" className="theme-accent-light hover:underline">
            Configurar verificación en 2 pasos
          </a>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen page-bg flex items-center justify-center">
        <div className="animate-pulse text-slate-400">Cargando...</div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
