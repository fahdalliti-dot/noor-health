'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';

interface NavItem {
  href: string;
  label: string;
  exact?: boolean;
}

const NAV: NavItem[] = [
  { href: '/agenda', label: 'Agenda', exact: true },
  { href: '/agenda/working-hours', label: 'Horaires' },
  { href: '/agenda/time-off', label: 'Absences' },
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
          <div className="flex gap-6">
            <aside className="hidden lg:block w-56 shrink-0">
              <nav className="space-y-1">
                {NAV.map((item) => (
                  <AgendaNavLink key={item.href} item={item} pathname={pathname} />
                ))}
              </nav>
            </aside>

            <main className="flex-1 min-w-0">{children}</main>
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
      className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        active
          ? 'bg-terracotta-50 text-terracotta-700'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
      }`}
    >
      {item.label}
    </Link>
  );
}