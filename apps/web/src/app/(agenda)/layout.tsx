'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import Button from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from '@/components/i18n-provider';

const NAV = [
  { href: '/agenda', label: 'Agenda', exact: true },
  { href: '/agenda/working-hours', label: 'Horaires' },
  { href: '/agenda/time-off', label: 'Absences' },
];

export default function AgendaLayout({
  children,
}: { children: React.ReactNode }) {
  const t = useTranslations();
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  if (!user) {
    return null;
  }

  const isDoctor = user.role === 'doctor';

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link href="/agenda" className="text-blue-600 font-semibold text-lg flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600" aria-hidden="true" />
              SaaS Docteurs Maroc
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              {NAV.map((item) => {
                const active = item.exact
                  ? pathname === item.href
                  : pathname?.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <span className="text-sm text-gray-600 hidden sm:inline">
              {user.full_name || user.email}
              <span className="text-gray-400"> · </span>
              <span className="text-gray-500 font-medium">
                {user.role === 'doctor' ? 'Médecin' : 'Secrétaire'}
              </span>
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (confirm(t('logout_confirm') || 'Voulez-vous vous déconnecter ?')) logout();
              }}
            >
              {t('logout') || 'Déconnexion'}
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-4 py-6">
        <div className="flex gap-6">
          <aside className="hidden lg:block w-56 shrink-0">
            <nav className="space-y-1">
              {NAV.map((item) => {
                const active = item.exact
                  ? pathname === item.href
                  : pathname?.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </aside>

          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
