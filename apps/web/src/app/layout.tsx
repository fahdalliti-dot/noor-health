import Button from '@/components/ui/button';
import { AuthProvider } from '@/lib/auth';
import { I18nProvider, LanguageSwitcher } from '@/components/i18n-provider';
import { NoorMark } from '@/components/nura-mark';
import { SiteNav } from '@/components/site-nav';
import { MobileBottomNav } from '@/components/mobile-bottom-nav';
import { PwaInstallPrompt } from '@/components/pwa-install-prompt';
import { PwaServiceWorkerRegister } from '@/components/pwa-sw-register';
import { OfflineBanner } from '@/components/offline/offline-banner';
import { routing } from '@/i18n/routing';
import { displayFont, sansFont } from '@/lib/fonts';
import type { Metadata, Viewport } from 'next';
import './globals.css';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  themeColor: '#B05A3A',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: 'Noor — soin numérique (نُور)',
  description: 'Plateforme médicale intelligente et gestion de cabinet au Maroc (CNDP Loi 09-08)',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Noor نُور',
  },
  icons: {
    icon: '/brand/icon-192.svg',
    apple: '/brand/apple-touch-icon.svg',
  },
};

export default function RootLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <html lang={routing.defaultLocale} dir="ltr" suppressHydrationWarning>
      <body className={`${sansFont.variable} ${displayFont.variable} font-sans antialiased bg-gray-50 text-gray-900 pb-16 md:pb-0`}>
        <I18nProvider>
          <AuthProvider>
            <PwaServiceWorkerRegister />
            <SiteNav />
            <OfflineBanner />
            <PwaInstallPrompt />
            <div className="min-h-[calc(100vh-140px)]">
              {children}
            </div>

            <MobileBottomNav />

            <footer className="hidden md:block border-t border-gray-200 py-6 text-center text-xs text-gray-500 bg-white">
              <p>SaaS pour médecins au Maroc • Protection des données de santé conforme CNDP (Loi 09-08)</p>
            </footer>
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}