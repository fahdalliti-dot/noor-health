import Link from 'next/link';
import Button from '@/components/ui/button';
import { AuthProvider } from '@/lib/auth';
import { I18nProvider, LanguageSwitcher } from '@/components/i18n-provider';
import './globals.css';

export const metadata = {
  title: 'SaaS pour médecins',
  description: 'Gestion de cabinet médical multi-clinique au Maroc',
};

export default function RootLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <html lang="fr" dir="ltr">
      <body className="font-sans antialiased bg-gray-50 text-gray-900">
        <I18nProvider>
          <AuthProvider>
            <nav className="border-b border-gray-200 bg-white shadow-xs">
              <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-6">
                  <Link
                    href="/"
                    className="text-blue-600 hover:text-blue-800 font-semibold text-lg flex items-center gap-2"
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600" aria-hidden="true" />
                    SaaS Docteurs Maroc
                  </Link>

                  <div className="hidden md:flex items-center gap-5">
                    <Link
                      href="/agenda"
                      className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      Agenda
                    </Link>
                    <Link
                      href="/clinic"
                      className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      Cabinet
                    </Link>
                    <Link
                      href="/team"
                      className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      Équipe
                    </Link>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <LanguageSwitcher />
                  <Link href="/auth/login">
                    <Button variant="outline" size="sm">
                      Connexion
                    </Button>
                  </Link>
                </div>
              </div>
            </nav>

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
