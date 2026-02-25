'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

function getSupabase() {
  try {
    const { createClient } = require('@/lib/supabase/client');
    return createClient();
  } catch {
    return null;
  }
}

export default function Configurar2FAPage() {
  const router = useRouter();
  const [supabase, setSupabase] = useState<ReturnType<typeof getSupabase>>(null);

  useEffect(() => {
    const s = getSupabase();
    setSupabase(s);
    if (!s) setLoading(false);
  }, []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [factorId, setFactorId] = useState('');
  const [secret, setSecret] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [enrolled, setEnrolled] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/login?redirect=/configurar-2fa');
        return;
      }
      const { data: factors } = await supabase.auth.mfa.listFactors();
      if (factors?.totp?.length) {
        setEnrolled(true);
      } else {
        const { data, error: enrollError } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
        if (enrollError) {
          setError(enrollError.message);
        } else if (data) {
          setFactorId(data.id);
          setQrCode(data.totp.qr_code);
          setSecret(data.totp.secret);
        }
      }
      setLoading(false);
    };
    check();
  }, [supabase, router]);

  const handleVerify = async (e: React.FormEvent) => {
    if (!supabase || !factorId) return;
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data: challenge, error: challengeErr } = await supabase.auth.mfa.challenge({ factorId });
      if (challengeErr) {
        setError(challengeErr.message);
        return;
      }
      if (!challenge?.id) {
        setError('Error al crear el desafío');
        return;
      }
      const { error: verifyErr } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.id,
        code: verifyCode.trim(),
      });
      if (verifyErr) {
        setError(verifyErr.message);
        return;
      }
      setEnrolled(true);
    } finally {
      setLoading(false);
    }
  };

  if (supabase === null && !loading) {
    return (
      <div className="min-h-screen page-bg flex items-center justify-center p-4">
        <div className="rounded-2xl bg-slate-800/60 border border-slate-700/50 p-8 max-w-md text-center">
          <p className="text-slate-400 mb-4">Configura Supabase para habilitar la verificación en 2 pasos.</p>
          <a href="/" className="theme-accent-light hover:underline">Ir al dashboard</a>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen page-bg flex items-center justify-center">
        <div className="animate-pulse text-slate-400">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen page-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-slate-800/60 border border-slate-700/50 p-8 shadow-xl">
          <h1 className="text-xl font-bold text-slate-100 mb-2">Verificación en 2 pasos</h1>

          {enrolled ? (
            <div>
              <p className="text-slate-400 mb-4">Ya tienes la verificación en 2 pasos activada.</p>
              <a href="/" className="inline-block py-2 px-4 rounded-lg text-white font-medium theme-accent-bg hover:opacity-90">
                Ir al dashboard
              </a>
            </div>
          ) : qrCode ? (
            <form onSubmit={handleVerify} className="space-y-5 mt-4">
              <p className="text-slate-400 text-sm">
                Escanea el código QR con tu app de autenticación (Google Authenticator, Authy, etc.) y luego introduce el código de 6 dígitos (cambia cada 30 s).
              </p>
              <div className="flex justify-center p-4 rounded-lg bg-white">
                <img
                  src={qrCode.startsWith('data:') ? qrCode : `data:image/svg+xml;utf8,${encodeURIComponent(qrCode)}`}
                  alt="QR para 2FA"
                  className="w-48 h-48"
                />
              </div>
              <p className="text-xs text-slate-500">
                O introduce manualmente: <code className="bg-slate-900 px-2 py-1 rounded break-all">{secret}</code>
              </p>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Código de verificación</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="w-full px-4 py-3 rounded-lg bg-slate-900/80 border border-slate-600 text-slate-100 placeholder-slate-500 focus:ring-2 outline-none text-center text-xl tracking-[0.5em] theme-focus-ring"
                />
              </div>
              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={verifyCode.length !== 6}
                className="w-full py-3 rounded-lg text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed theme-accent-bg hover:opacity-90"
              >
                Activar 2FA
              </button>
            </form>
          ) : (
            <p className="text-red-400">{error || 'No se pudo generar el código QR'}</p>
          )}
        </div>
        <p className="text-center mt-6">
          <a href="/" className="text-slate-500 hover:text-slate-300 text-sm">
            ← Volver al dashboard
          </a>
        </p>
      </div>
    </div>
  );
}
