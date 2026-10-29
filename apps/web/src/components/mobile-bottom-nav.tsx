'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface TabItem {
  href: string;
  label: string;
  icon: string;
  badge?: string;
}

const TABS: TabItem[] = [
  { href: '/agenda', label: 'Agenda', icon: '📅' },
  { href: '/patients', label: 'Patients', icon: '👥' },
  { href: '/dashboard', label: 'Stats', icon: '📊' },
  { href: '/clinic', label: 'Cabinet', icon: '🏥' },
  { href: '/team', label: 'Équipe', icon: '⚙️' },
];

export function MobileBottomNav() {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Hide on public patient booking portal or during server-render
  if (!mounted || pathname?.startsWith('/book/')) {
    return null;
  }

  return (
    <nav
      aria-label="Navigation Mobile"
      className="md:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-gray-200/90 z-40 pb-safe shadow-xl"
    >
      <div className="grid grid-cols-5 items-center justify-around h-14 max-w-lg mx-auto px-1">
        {TABS.map((tab) => {
          const isActive =
            pathname === tab.href ||
            (tab.href !== '/' && pathname?.startsWith(tab.href));

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all relative ${
                isActive
                  ? 'text-terracotta-700 font-bold scale-105'
                  : 'text-gray-500 hover:text-gray-900 active:scale-95'
              }`}
            >
              <span className="text-lg leading-none mb-0.5">{tab.icon}</span>
              <span className="text-[10px] tracking-tight">{tab.label}</span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-terracotta-600 absolute bottom-0.5" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
