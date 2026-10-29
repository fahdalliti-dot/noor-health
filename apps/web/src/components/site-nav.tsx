'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Button from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/i18n-provider';
import { NuraMark } from '@/components/nura-mark';
import { useAuth, type AuthContextType } from '@/lib/auth';

export interface SiteNavProps {
  user?: AuthContextType['user'];
  onLogout?: () => void;
  /** Extra nav links rendered after the primary group, e.g. agenda sub-nav. */
  extra?: React.ReactNode;
}

const PRIMARY_LINKS = [
  { href: '/agenda', label: 'Agenda' },
  { href: '/patients', label: 'Patients' },
  { href: '/dashboard', label: 'Tableau de bord' },
  { href: '/clinic', label: 'Cabinet' },
  { href: '/team', label: 'Équipe' },
];

const DEFAULT_DEMO_USER = {
  id: 'doc-benali-casablanca',
  clinic_id: 'clinic-a',
  role: 'doctor',
  is_clinic_admin: true,
  full_name: 'Dr. Amine Benali',
  email: 'doctor@clinic-a.test',
};

/**
 * Single source of truth for the top navigation.
 *
 * Rendered once in the root layout for all authenticated pages.
 */
export function SiteNav({ user, onLogout, extra }: SiteNavProps) {
  const pathname = usePathname();
  const auth = useAuth();

  // Hide the internal doctor navigation on the public booking portal
  if (pathname?.startsWith('/book/')) {
    return null;
  }

  const activeUser = user || auth?.user || DEFAULT_DEMO_USER;
  const handleLogout = onLogout || auth?.logout;

  return (
    <nav className="border-b border-gray-200 bg-white shadow-xs sticky top-0 z-40">
      <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-6">
          <Link
            href="/agenda"
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
              const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
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
          {activeUser ? (
            <>
              <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-sand-100 border border-sand-300">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-xs font-semibold text-charcoal">
                  {activeUser.full_name || activeUser.email}
                </span>
                <span className="text-[10px] text-terracotta-700 font-bold uppercase tracking-wider bg-terracotta-100/70 px-1.5 py-0.5 rounded">
                  {activeUser.role === 'doctor' ? 'Médecin' : 'Secrétaire'}
                </span>
              </div>
              {handleLogout && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="text-xs hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition"
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