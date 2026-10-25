import Link from 'next/link';
import Button from '@/components/ui/button';
import { AuthProvider } from '@/lib/auth';
import { NextIntlClientProvider } from 'next-intl';
import messages from '../messages/fr.json';
import './globals.css';

export const metadata = {
  title: 'SaaS pour médecins',
  description: 'Gestion de cabinet médical multi-clinique au Maroc',
};

export default function RootLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="font-sans antialiased bg-gray-50 text-gray-900">
        <NextIntlClientProvider locale="fr" messages={messages}>
          <AuthProvider>
            <nav className="border-b border-gray-200 bg-white shadow-sm">
              <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center justify-between flex-wrap gap-4">
                <Link
                  href="/"
                  className="text-blue-600 hover:text-blue-800 font-semibold text-lg"
                >
                  SaaS Docteurs Maroc
                </Link>

                <div className="hidden md:flex items-center gap-6">
                  <Link href="/clinic" className="text-sm text-gray-600 hover:text-gray-900">
                    Cabinet
                  </Link>
                  <Link href="/team" className="text-sm text-gray-600 hover:text-gray-900">
                    Équipe
                  </Link>
                </div>

                <div className="flex items-center gap-3">
                  <Link href="/auth/login">
                    <Button variant="outline" size="sm">
                      Connexion
                    </Button>
                  </Link>
                </div>
              </div>
            </nav>

            <main className="min-h-[calc(100vh-120px)] px-4 py-8 max-w-[1400px] mx-auto">
              {children}
            </main>

            <footer className="border-t border-gray-200 py-6 text-center text-sm text-gray-500">
              <p>SaaS pour médecins • Conforme CNDP Maroc (Loi 09-08)</p>
            </footer>
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
