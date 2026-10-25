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
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center bg-gradient-to-b from-blue-50 to-white p-8">
      <div className="max-w-md w-full space-y-6 p-8 bg-white rounded-xl shadow-xl border border-gray-200" dir={t('direction')}>
        <h2 className="text-2xl font-bold text-center text-gray-900">{t('auth.login')}</h2>

        {error && (
          <p className="text-red-600 text-sm text-center">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            placeholder={t('placeholder.email')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            type="password"
            placeholder={t('placeholder.password')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? t('submitting') : t('login')}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500">
          {t('no_account')}{' '}
          <span className="font-medium text-blue-600">
            {t('register')}
          </span>
        </p>
      </div>
    </div>
  );
}
