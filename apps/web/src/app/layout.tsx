import Button from '@/components/ui/button';
import { AuthProvider } from '@/lib/auth';
import { I18nProvider, LanguageSwitcher } from '@/components/i18n-provider';
import { NoorMark } from '@/components/nura-mark';
import { SiteNav } from '@/components/site-nav';
import { routing } from '@/i18n/routing';
import { displayFont, sansFont } from '@/lib/fonts';
import './globals.css';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const metadata = {
  title: 'Noor — soin numérique',
  description: 'Noor : gestion de cabinet médical multi-clinique au Maroc',
};

export default function RootLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <html lang={routing.defaultLocale} dir="ltr" suppressHydrationWarning>
      <body className={`${sansFont.variable} ${displayFont.variable} font-sans antialiased`}>
        <I18nProvider>
          <AuthProvider>
            <SiteNav />
            <main className="min-h-[calc(100vh-140px)] px-4 py-8 max-w-[1400px] mx-auto">
              {children}
            </main>

            <footer className="border-t border-gray-200 py-6 text-center text-xs text-gray-500">
              <p>SaaS pour médecins au Maroc • Protection des données de santé conforme CNDP (Loi 09-08)</p>
            </footer>
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}