'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import Input from '@/components/ui/input';
import Button from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { authenticateWithBiometrics } from '@/lib/native/biometrics';
import { triggerHaptic } from '@/lib/native/haptics';

export default function LoginPage() {
  const t = useTranslations();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { login, loginAsDemo } = useAuth();

  const handleBiometricLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authenticateWithBiometrics('Déverrouillez votre cabinet médical Noor');
      if (res.success) {
        triggerHaptic('success');
        loginAsDemo('doctor');
      } else {
        setError(res.error || 'Authentification biométrique annulée');
      }
    } catch {
      setError('Biométrie indisponible sur ce terminal');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await login(email, password);

      if (result.status === 'two_factor_required') {
        router.push('/auth/2fa-verify');
        return;
      }

      // Successful login -> go directly to clinical agenda
      router.push('/agenda');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err?.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4 sm:p-8">
      <div
        className="max-w-md w-full space-y-6 p-6 sm:p-8 bg-white rounded-xl shadow-lg border border-gray-200"
        dir={t('direction')}
      >
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-gray-900">{t('auth.login')}</h1>
          <p className="text-sm text-gray-500">Portail sécurisé des professionnels de santé</p>
        </div>

        {error && (
          <div
            role="alert"
            className="p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200 text-center"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 mb-1">
              Adresse e-mail
            </label>
            <Input
              id="login-email"
              type="email"
              name="email"
              autoComplete="email"
              placeholder={t('placeholder.email')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="login-password" className="block text-sm font-medium text-gray-700 mb-1">
              Mot de passe
            </label>
            <Input
              id="login-password"
              type="password"
              name="password"
              autoComplete="current-password"
              placeholder={t('placeholder.password')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button type="submit" isLoading={loading} disabled={loading} className="w-full">
            {loading ? t('submitting') : t('login')}
          </Button>

          {/* Native Mobile Biometric Quick-Unlock (Face ID / Empreinte) */}
          <button
            type="button"
            onClick={handleBiometricLogin}
            className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl border border-terracotta-200 bg-sand-100 hover:bg-sand-200 text-charcoal text-xs font-semibold shadow-2xs transition cursor-pointer"
          >
            <span className="text-base">🪪</span>
            <span>Déverrouiller avec Face ID / Empreinte digitale</span>
          </button>
        </form>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-gray-400 font-medium">Ou accès démo immédiat</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => loginAsDemo('doctor')}
            className="flex items-center justify-center gap-1.5 p-2.5 rounded-lg border border-terracotta-200 bg-terracotta-50/70 hover:bg-terracotta-100/70 text-terracotta-800 text-xs font-semibold transition cursor-pointer shadow-2xs"
          >
            <span>👨‍⚕️</span>
            <span>Dr. Amine Benali</span>
          </button>
          <button
            type="button"
            onClick={() => loginAsDemo('secretary')}
            className="flex items-center justify-center gap-1.5 p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition cursor-pointer shadow-2xs"
          >
            <span>👩‍💼</span>
            <span>Secrétaire Médicale</span>
          </button>
        </div>

        <p className="text-center text-sm text-gray-500">
          {t('no_account')}{' '}
          <span className="font-medium text-terracotta-600 hover:underline cursor-pointer">
            {t('register')}
          </span>
        </p>
      </div>
    </div>
  );
}
