'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import Input from '@/components/ui/input';
import Button from '@/components/ui/button';
import { useAuth } from '@/lib/auth';

export default function TwoFaVerifyPage() {
  const t = useTranslations();
  const router = useRouter();
  const { login: performLogin, pending2faSession } = useAuth();
  const [totpCode, setTotpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await performLogin(pending2faSession ?? '', totpCode);

      if (result?.access_token) {
        // Successful 2FA
        router.push('/clinic');
      }
    } catch (err: any) {
      setError(err?.message || t('2fa_invalid'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center bg-gradient-to-b from-blue-50 to-white p-8">
      <div className="max-w-md w-full space-y-6 p-8 bg-white rounded-xl shadow-xl border border-gray-200" dir={t('direction')}>
        <h2 className="text-2xl font-bold text-center text-gray-900">
          {t('auth.2fa_setup')}
        </h2>

        {error && (
          <p className="text-red-600 text-sm text-center">
            {error}
          </p>
        )}

        <p className="text-center text-sm text-gray-500 mb-6">
          {t('enter_2fa_code')}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="text"
            placeholder={t('placeholder.totp')}
            value={totpCode}
            onChange={(e) => setTotpCode(e.target.value)}
            required
            maxLength={6}
          />

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? t('verifying') : t('verify')}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          {t('resend_code')}{' '}
          <span className="font-medium text-terracotta-600">
            {t('here')}
          </span>
        </p>
      </div>
    </div>
  );
}
