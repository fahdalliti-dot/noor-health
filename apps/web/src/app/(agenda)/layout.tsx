'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { SiteNav } from '@/components/site-nav';

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

export default function AgendaLayout({
  children,
}: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteNav
        user={user}
        onLogout={logout}
        extra={
          <nav className="hidden md:flex items-center gap-1">
            {NAV.map((item) => (
              <AgendaNavLink key={item.href} item={item} pathname={pathname} />
            ))}
          </nav>
        }
      />

      <div className="max-w-[1400px] mx-auto px-4 py-6">
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