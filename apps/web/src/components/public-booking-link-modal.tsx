'use client';

import { useState } from 'react';
import Button from '@/components/ui/button';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  doctorName?: string;
  doctorSlug?: string;
  specialty?: string;
  clinicAddress?: string;
}

export function PublicBookingLinkModal({
  open,
  onOpenChange,
  doctorName = 'Dr. Amine Benali',
  doctorSlug = 'dr-amine-benali',
  specialty = 'Cardiologie & Maladies Vasculaires',
  clinicAddress = '45 Boulevard Zerktouni, 3ème étage, Casablanca',
}: Props) {
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const bookingUrl = `${origin}/book/${doctorSlug}`;
  const whatsappMessage = encodeURIComponent(
    `Bonjour,\n\nVous pouvez prendre rendez-vous en ligne avec le ${doctorName} (${specialty}) via ce lien direct :\n${bookingUrl}\n\n📍 ${clinicAddress}\nCabinet Noor Healthcare`,
  );
  const whatsappShareUrl = `https://api.whatsapp.com/send?text=${whatsappMessage}`;

  function handleCopy() {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(bookingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in font-sans">
      <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 space-y-5 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-terracotta-100 text-terracotta-700 flex items-center justify-center text-xl font-bold">
              🌐
            </span>
            <div>
              <h2 className="font-bold text-sm text-slate-900">
                Lien de Prise de Rendez-Vous Public
              </h2>
              <p className="text-xs text-slate-500">
                Page blanche patient personnalisée pour le cabinet
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="text-slate-400 hover:text-slate-600 p-1 text-sm rounded cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Doctor Summary Banner */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between gap-3 text-xs">
          <div>
            <div className="font-bold text-slate-900">{doctorName}</div>
            <div className="text-terracotta-600 font-medium">{specialty}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">📍 {clinicAddress}</div>
          </div>
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-1 rounded-md font-semibold text-[11px] shrink-0">
            ● Actif & Ouvert
          </span>
        </div>

        {/* Direct Link Input with 1-Click Copy */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 block">
            Adresse URL publique directe :
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={bookingUrl}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 select-all focus:outline-none"
            />
            <button
              type="button"
              onClick={handleCopy}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-900 hover:bg-slate-800 text-white shadow-xs'
              }`}
            >
              <span>{copied ? '✓' : '📋'}</span>
              <span>{copied ? 'Copié !' : 'Copier'}</span>
            </button>
          </div>
          {copied && (
            <p className="text-[11px] text-emerald-600 font-medium">
              ✓ L&apos;adresse du portail a été copiée dans votre presse-papier.
            </p>
          )}
        </div>

        {/* QR Code & Sharing Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* WhatsApp Sharing Card */}
          <div className="border border-slate-200 rounded-xl p-3 bg-white space-y-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                <span>💬</span>
                <span>Partage WhatsApp</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Envoyer le lien directement à un patient avec message pré-rempli.
              </p>
            </div>
            <a
              href={whatsappShareUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition shadow-2xs"
            >
              <span>Envoyer sur WhatsApp</span>
              <span>→</span>
            </a>
          </div>

          {/* Test Page Patient Card */}
          <div className="border border-slate-200 rounded-xl p-3 bg-white space-y-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                <span>👁</span>
                <span>Aperçu Patient</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Tester le formulaire de réservation tel que vu par les patients.
              </p>
            </div>
            <a
              href={bookingUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-terracotta-50 hover:bg-terracotta-100 text-terracotta-700 border border-terracotta-200 text-xs font-semibold rounded-lg transition"
            >
              <span>Ouvrir la page</span>
              <span>↗</span>
            </a>
          </div>
        </div>

        {/* Counter QR Code Notice */}
        <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-3 flex items-center gap-3 text-xs text-amber-900">
          <div className="w-10 h-10 rounded-lg bg-white border border-amber-300 flex items-center justify-center text-lg shrink-0">
            📱
          </div>
          <div>
            <span className="font-semibold">À afficher au cabinet : </span>
            <span className="text-[11px] text-amber-800">
              Imprimez ce QR code à l&apos;accueil du cabinet pour permettre aux patients de reprendre RDV en autonomie depuis leur smartphone.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-slate-100">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="text-xs"
          >
            Fermer
          </Button>
        </div>
      </div>
    </div>
  );
}

export default PublicBookingLinkModal;
