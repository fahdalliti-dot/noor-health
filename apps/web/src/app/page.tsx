import Link from 'next/link';
import Button from '@/components/ui/button';
import { NoorMark } from '@/components/nura-mark';

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="max-w-3xl space-y-8">
        <span className="inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-terracotta-700 bg-terracotta-50 rounded-full">
          <NoorMark size={14} className="text-terracotta-600" surface="#FFF3EC" />
          Slice 1 • Auth, Cliniques &amp; Rôles
        </span>
        <h1 className="font-display text-6xl sm:text-7xl font-medium text-charcoal tracking-tight leading-[1.0]">
          Votre cabinet,
          <br />
          <span className="text-terracotta-600">unifié.</span>
        </h1>
        <p className="text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto">
          Noor centralise les dossiers patients, les rendez-vous et la
          facturation de vos cliniques. Chaque clinique reste strictement
          cloisonnée — vos données de santé ne quittent jamais votre équipe.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link href="/auth/login">
            <Button size="lg" className="bg-terracotta-600 hover:bg-terracotta-700 text-white font-medium px-6 py-3">
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

        {/* One dominant feature + two supporting rows, not three equal cards. */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-16 text-left">
          <Link
            href="/clinic"
            className="sheet-card p-6 flex flex-col gap-3 hover:border-terracotta-300 hover:shadow-md transition-colors"
          >
            <NoorMark size={24} surface="#FFFFFF" className="text-terracotta-600" />
            <div>
              <h3 className="font-display text-xl font-semibold text-charcoal">
                Isolation multi-tenant
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Données de chaque clinique strictement cloisonnées par
                clinic_id et vérifiées à chaque requête.
              </p>
            </div>
          </Link>

          <div className="sheet-card p-6 flex flex-col gap-3">
            <span className="text-2xl text-terracotta-600" aria-hidden="true">
              ◯
            </span>
            <div>
              <h3 className="font-display text-xl font-semibold text-charcoal">
                Authentification &amp; 2FA
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Hachage Argon2id, 2FA obligatoire pour médecins et
                administrateurs, rotation des sessions.
              </p>
            </div>
          </div>

          <div className="sheet-card p-6 flex flex-col gap-3">
            <span className="text-2xl text-terracotta-600" aria-hidden="true">
              ◈
            </span>
            <div>
              <h3 className="font-display text-xl font-semibold text-charcoal">
                Journal d&apos;audit légal
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Traçabilité append-only sans exposition de données médicales
                selon les exigences CNDP.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}