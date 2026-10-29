import Link from 'next/link';
import Button from '@/components/ui/button';
import { NuraMark } from '@/components/nura-mark';

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="max-w-3xl space-y-8">
        <span className="inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-terracotta-700 bg-terracotta-50 rounded-full">
          <NuraMark size={14} className="text-terracotta-600" surface="#FFF3EC" />
          Slice 1 • Auth, Cliniques &amp; Rôles
        </span>
        <h1 className="font-display text-5xl sm:text-6xl font-medium text-charcoal tracking-tight leading-[1.05]">
          Nura
        </h1>
        <p className="text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto">
          Gestion de cabinet médical multi-clinique au Maroc. Dossiers patients,
          rendez-vous, consultations et facturation avec isolation stricte des
          données de santé.
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-16 text-left">
          <div className="sheet-card p-6">
            <div className="text-terracotta-600 font-semibold mb-2 flex items-center gap-2">
              <NuraMark size={18} surface="#FFFFFF" /> Isolation multi-tenant
            </div>
            <p className="text-sm text-gray-600">
              Données de chaque clinique strictement cloisonnées par clinic_id et
              vérifiées à chaque requête.
            </p>
          </div>
          <div className="sheet-card p-6">
            <div className="text-terracotta-600 font-semibold mb-2 flex items-center gap-2">
              <NuraMark size={18} surface="#FFFFFF" /> Authentification &amp; 2FA
            </div>
            <p className="text-sm text-gray-600">
              Hachage Argon2id, 2FA obligatoire pour médecins et administrateurs,
              rotation des sessions.
            </p>
          </div>
          <div className="sheet-card p-6">
            <div className="text-terracotta-600 font-semibold mb-2 flex items-center gap-2">
              <NuraMark size={18} surface="#FFFFFF" /> Journal d&apos;audit légal
            </div>
            <p className="text-sm text-gray-600">
              Traçabilité append-only sans exposition de données médicales selon
              les exigences CNDP.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}