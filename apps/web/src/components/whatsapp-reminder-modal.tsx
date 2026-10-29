'use client';

import { useState } from 'react';
import Button from '@/components/ui/button';
import type { Appointment } from '@/hooks/use-agenda';
import { DateTime } from 'luxon';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: Appointment | null;
  timezone?: string;
  clinicName?: string;
  clinicAddress?: string;
}

export function WhatsAppReminderModal({
  open,
  onOpenChange,
  appointment,
  timezone = 'Africa/Casablanca',
  clinicName = 'Cabinet Dr. Amine Benali',
  clinicAddress = '45 Bd Zerktouni, 3ème étage, Casablanca',
}: Props) {
  const [lang, setLang] = useState<'fr' | 'ar'>('fr');
  const [copied, setCopied] = useState(false);

  if (!open || !appointment || !appointment.patient) return null;

  const start = DateTime.fromISO(appointment.starts_at).setZone(timezone);
  const patientName = `${appointment.patient.first_name} ${appointment.patient.last_name}`;
  const rawPhone = appointment.patient.phone || '';
  const cleanPhone = rawPhone.replace(/[^0-9]/g, '');

  const dateStrFr = start.toFormat('dd/MM/yyyy');
  const timeStrFr = start.toFormat('HH:mm');

  const messageFr = `Bonjour ${patientName},

Rappel de votre rendez-vous chez ${clinicName} le ${dateStrFr} à ${timeStrFr}.
Adresse : ${clinicAddress}
Localisation GPS : https://maps.google.com/?q=Casablanca+Zerktouni

En cas d'empêchement ou pour modifier l'horaire, merci de nous répondre directement sur ce numéro.

Cabinet Médical.`;

  const messageAr = `السلام عليكم ${patientName}،

تذكير بموعدكم الطبي في ${clinicName} يوم ${dateStrFr} على الساعة ${timeStrFr}.
العنوان: ${clinicAddress}
الموقع على الخريطة: https://maps.google.com/?q=Casablanca+Zerktouni

في حال تعذر الحضور أو الرغبة في تعديل الموعد، يرجى الرد على هذه الرسالة.

العيادة الطبية.`;

  const currentMessage = lang === 'fr' ? messageFr : messageAr;
  const whatsappUrl = `https://wa.me/${cleanPhone.startsWith('0') ? '212' + cleanPhone.slice(1) : cleanPhone}?text=${encodeURIComponent(currentMessage)}`;

  function handleCopy() {
    navigator.clipboard.writeText(currentMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  function handleSend() {
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    onOpenChange(false);
  }

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-xl border border-slate-200 max-w-lg w-full p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-base">
              💬
            </span>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Rappel WhatsApp & SMS</h3>
              <p className="text-[11px] text-slate-500 font-mono">Patient: {patientName} • {rawPhone}</p>
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

        {/* Language selector */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700">Modèle de notification :</span>
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-100 text-xs">
            <button
              type="button"
              onClick={() => setLang('fr')}
              className={`px-3 py-1 rounded-md transition ${lang === 'fr' ? 'bg-white font-semibold text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Français
            </button>
            <button
              type="button"
              onClick={() => setLang('ar')}
              className={`px-3 py-1 rounded-md transition ${lang === 'ar' ? 'bg-white font-semibold text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              العربية (الدارجة)
            </button>
          </div>
        </div>

        {/* Preview box */}
        <div className={`p-3.5 bg-emerald-50/50 border border-emerald-200/80 rounded-xl text-xs text-slate-800 leading-relaxed font-sans whitespace-pre-line ${lang === 'ar' ? 'text-right' : 'text-left'}`}>
          {currentMessage}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={handleCopy}
            className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition cursor-pointer"
          >
            {copied ? '✓ Copié dans le presse-papier' : '📋 Copier le texte'}
          </button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs"
            >
              Fermer
            </Button>
            <Button
              size="sm"
              onClick={handleSend}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5"
            >
              <span>Envoyer via WhatsApp</span>
              <span>↗</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WhatsAppReminderModal;
