'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import Input from '@/components/ui/input';
import Button from '@/components/ui/button';
import { useAuth } from '@/lib/auth';

export default function LoginPage() {
  const t = useTranslations();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { login } = useAuth();

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

      // Successful login
      router.push('/clinic');
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
        </form>

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
