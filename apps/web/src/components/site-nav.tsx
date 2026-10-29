'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Button from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/i18n-provider';
import { NuraMark } from '@/components/nura-mark';
import { useAuth, type AuthContextType } from '@/lib/auth';
import { NotificationCenter } from '@/components/notifications/notification-center';
import { OnlineStatusPill } from '@/components/offline/offline-banner';

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
    <nav className="border-b border-sand-300/80 bg-white/95 backdrop-blur-md shadow-xs sticky top-0 z-40">
      <div className="max-w-[1400px] mx-auto px-4 py-2.5 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-6">
          <Link
            href="/agenda"
            className="flex items-center gap-2.5 text-charcoal hover:text-terracotta-700 transition-colors"
            aria-label="Noor — accueil"
          >
            <NuraMark size={30} />
            <div className="flex items-baseline gap-1.5">
              <span className="font-display text-2xl font-bold leading-none tracking-tight text-charcoal">
                Noor
              </span>
              <span className="font-serif text-sm font-bold text-terracotta-600 opacity-90">
                نُور
              </span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-2">
            {PRIMARY_LINKS.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${
                    isActive
                      ? 'text-terracotta-800 bg-terracotta-50/90 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-sand-100/70'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            {extra}
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <OnlineStatusPill />
          <NotificationCenter />
          <LanguageSwitcher />
          {activeUser ? (
            <>
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-sand-100/90 border border-sand-300 shadow-2xs">
                <div className="w-6 h-6 rounded-lg bg-terracotta-700 text-white font-bold text-[10px] flex items-center justify-center">
                  {(activeUser.full_name || 'AB').split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold text-charcoal leading-none">
                    {activeUser.full_name || activeUser.email}
                  </span>
                  <span className="text-[10px] text-terracotta-700 font-bold uppercase tracking-wider mt-0.5">
                    {activeUser.role === 'doctor' ? 'Médecin' : 'Secrétaire'}
                  </span>
                </div>
              </div>
              {handleLogout && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="text-xs hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition rounded-xl h-8"
                >
                  Déconnexion
                </Button>
              )}
            </>
          ) : (
            <Link href="/auth/login">
              <Button variant="outline" size="sm" className="rounded-xl h-8">
                Connexion
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}