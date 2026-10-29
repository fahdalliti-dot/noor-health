'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Button from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/i18n-provider';
import { NuraMark } from '@/components/nura-mark';
import type { AuthContextType } from '@/lib/auth';

export interface SiteNavProps {
  user?: AuthContextType['user'];
  onLogout?: () => void;
  /** Extra nav links rendered after the primary group, e.g. agenda sub-nav. */
  extra?: React.ReactNode;
}

const PRIMARY_LINKS = [
  { href: '/agenda', label: 'Agenda' },
  { href: '/dashboard', label: 'Tableau de bord' },
  { href: '/clinic', label: 'Cabinet' },
  { href: '/team', label: 'Équipe' },
];

/**
 * Single source of truth for the top navigation.
 *
 * Both the public root layout and the authenticated agenda layout render
 * this — so the brand mark, wordmark and link styling can never drift apart.
 */
export function SiteNav({ user, onLogout, extra }: SiteNavProps) {
  const pathname = usePathname();

  return (
    <nav className="border-b border-gray-200 bg-white shadow-xs">
      <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-2.5 text-charcoal hover:text-terracotta-700 transition-colors"
            aria-label="Noor — accueil"
          >
            <NuraMark size={28} />
            <div className="flex items-baseline gap-1.5">
              <span className="font-display text-2xl font-semibold leading-none tracking-tight text-charcoal">
                Noor
              </span>
              <span className="font-serif text-sm font-bold text-terracotta-600 opacity-90">
                نُور
              </span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {PRIMARY_LINKS.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-terracotta-700 font-semibold border-b-2 border-terracotta-600 pb-0.5'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            {extra}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          {user ? (
            <>
              <span className="text-sm text-gray-600 hidden sm:inline">
                {user.full_name || user.email}
                <span className="text-gray-400"> · </span>
                <span className="text-gray-500 font-medium">
                  {user.role === 'doctor' ? 'Médecin' : 'Secrétaire'}
                </span>
              </span>
              {onLogout && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onLogout}
                >
                  Déconnexion
                </Button>
              )}
            </>
          ) : (
            <Link href="/auth/login">
              <Button variant="outline" size="sm">
                Connexion
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}