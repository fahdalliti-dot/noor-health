'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';

interface NavItem {
  href: string;
  label: string;
  icon: string;
  exact?: boolean;
}

const NAV: NavItem[] = [
  { href: '/agenda', label: 'Agenda', icon: '📅', exact: true },
  { href: '/agenda/working-hours', label: 'Horaires', icon: '🕒' },
  { href: '/agenda/time-off', label: 'Absences', icon: '🏖️' },
];

const DEFAULT_DEMO_USER = {
  id: 'doc-benali-casablanca',
  clinic_id: 'clinic-a',
  role: 'doctor',
  is_clinic_admin: true,
  full_name: 'Dr. Amine Benali',
  email: 'doctor@clinic-a.test',
};

export default function AgendaLayout({
  children,
}: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();

  const activeUser = user || DEFAULT_DEMO_USER;
  const isAgendaSection = pathname.startsWith('/agenda');

  return (
    <div className="min-h-screen bg-gray-50">
      {!user && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200/80 px-4 py-2 text-xs text-amber-900 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>
              <strong>Cabinet Noor Casablanca · Démo Médicale Live :</strong> Connecté en tant que <strong>{activeUser.full_name}</strong> (Médecin Généraliste & Spécialiste).
            </span>
          </div>
          <Link
            href="/auth/login"
            className="font-semibold underline hover:text-amber-950 text-[11px] transition-colors"
          >
            Se connecter avec un compte dédié →
          </Link>
        </div>
      )}

      <div className="max-w-[1400px] mx-auto px-4 py-6">
        {isAgendaSection ? (
          <div>
            {/* Mobile & Tablet Horizontal Tab Switcher */}
            <div className="lg:hidden flex items-center gap-2 mb-4 p-1.5 bg-white border border-gray-200 rounded-2xl shadow-xs overflow-x-auto">
              {NAV.map((item) => (
                <AgendaNavPill key={item.href} item={item} pathname={pathname} />
              ))}
            </div>

            <div className="flex gap-6">
              <aside className="hidden lg:block w-56 shrink-0">
                <div className="bg-white rounded-2xl border border-gray-200 p-3 shadow-xs sticky top-20">
                  <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-1.5">
                    Module Agenda
                  </div>
                  <nav className="space-y-1">
                    {NAV.map((item) => (
                      <AgendaNavLink key={item.href} item={item} pathname={pathname} />
                    ))}
                  </nav>
                </div>
              </aside>

              <main className="flex-1 min-w-0">{children}</main>
            </div>
          </div>
        ) : (
          <main className="w-full">{children}</main>
        )}
      </div>
    </div>
  );
}

function AgendaNavLink({
  item,
  pathname,
}: {
  item: (typeof NAV)[number];
  pathname: string | null;
}) {
  const active = item.exact
    ? pathname === item.href
    : pathname?.startsWith(item.href) ?? false;

  return (
    <Link
      href={item.href}
      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
        active
          ? 'bg-terracotta-50 text-terracotta-700 shadow-2xs border border-terracotta-200/60'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
      }`}
    >
      <span className="text-base">{item.icon}</span>
      <span>{item.label}</span>
    </Link>
  );
}

function AgendaNavPill({
  item,
  pathname,
}: {
  item: (typeof NAV)[number];
  pathname: string | null;
}) {
  const active = item.exact
    ? pathname === item.href
    : pathname?.startsWith(item.href) ?? false;

  return (
    <Link
      href={item.href}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
        active
          ? 'bg-terracotta-600 text-white shadow-xs'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
      }`}
    >
      <span>{item.icon}</span>
      <span>{item.label}</span>
    </Link>
  );
}