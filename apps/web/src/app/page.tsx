import Link from 'next/link';
import Button from '@/components/ui/button';

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="max-w-3xl space-y-6">
        <span className="inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue-700 bg-blue-100 rounded-full">
          Slice 1 • Auth, Cliniques & Rôles
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight">
          SaaS pour cabinets et cliniques médicales au Maroc
        </h1>
        <p className="text-lg text-gray-600 leading-relaxed">
          Plateforme multi-tenant sécurisée conforme à la Loi 09-08 (CNDP). Gestion des dossiers patients, rendez-vous, consultations et facturation avec isolation stricte des données de santé.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link href="/auth/login">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3">
              Accéder à l&apos;espace praticien
            </Button>
          </Link>
          <Link href="/clinic">
            <Button variant="outline" size="lg" className="border-gray-300">
              Paramètres Cabinet
            </Button>
          </Link>
          <Link href="/team">
            <Button variant="outline" size="lg" className="border-gray-300">
              Gestion de l&apos;équipe
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 text-left">
          <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="text-blue-600 font-bold mb-2">🔒 Isolation multi-tenant</div>
            <p className="text-sm text-gray-600">
              Données de chaque clinique strictement cloisonnées par clinic_id et vérifiées à chaque requête.
            </p>
          </div>
          <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="text-blue-600 font-bold mb-2">🛡️ Authentification & 2FA</div>
            <p className="text-sm text-gray-600">
              Hachage Argon2id, 2FA obligatoire pour médecins et administrateurs, rotation des sessions.
            </p>
          </div>
          <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="text-blue-600 font-bold mb-2">📋 Journal d&apos;audit légal</div>
            <p className="text-sm text-gray-600">
              Traçabilité append-only sans exposition de données médicales selon les exigences CNDP.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
