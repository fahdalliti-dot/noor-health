'use client';

import { useState } from 'react';
import Button from '@/components/ui/button';
import type { Appointment } from '@/hooks/use-agenda';
import { api } from '@/lib/api';
import { DateTime } from 'luxon';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: Appointment | null;
  timezone?: string;
  clinicName?: string;
  clinicAddress?: string;
  onReminderSent?: () => void;
}

export function WhatsAppReminderModal({
  open,
  onOpenChange,
  appointment,
  timezone = 'Africa/Casablanca',
  clinicName = 'Cabinet Dr. Amine Benali',
  clinicAddress = '45 Bd Zerktouni, 3ème étage, Casablanca',
  onReminderSent,
}: Props) {
  const [lang, setLang] = useState<'fr' | 'ar'>('ar'); // Default to Moroccan Darija
  const [sendingApi, setSendingApi] = useState(false);
  const [apiSuccess, setApiSuccess] = useState<any | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
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

Veuillez confirmer votre présence en cliquant ci-dessous :`;

  const messageAr = `السلام عليكم ${patientName}،

تذكير بموعدكم الطبي لدى ${clinicName} يوم ${dateStrFr} على الساعة ${timeStrFr}.
العنوان: ${clinicAddress}
الموقع على الخريطة: https://maps.google.com/?q=Casablanca+Zerktouni

يرجى تأكيد الحضور بالضغط على الزر أسفله:`;

  const currentMessage = lang === 'fr' ? messageFr : messageAr;
  const whatsappUrl = `https://wa.me/${cleanPhone.startsWith('0') ? '212' + cleanPhone.slice(1) : cleanPhone}?text=${encodeURIComponent(
    currentMessage + '\n\n1. Confirmer / تأكيد\n2. Annuler / إلغاء'
  )}`;

  function handleCopy() {
    navigator.clipboard.writeText(currentMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  function handleManualSend() {
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  }

  async function handleCloudApiSend() {
    if (!appointment) return;
    setSendingApi(true);
    setApiError(null);
    setApiSuccess(null);
    try {
      const response = await api.post<any>(`/notifications/send-reminder/${appointment.id}`, {
        language: lang === 'ar' ? 'ar_MA' : 'fr_MA',
      });
      const data = (response as any)?.data || response;
      setApiSuccess(data);
      if (onReminderSent) {
        onReminderSent();
      }
    } catch (err: any) {
      setApiError(err?.message || 'Échec de l’envoi via l’API WhatsApp Cloud.');
    } finally {
      setSendingApi(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-xl border border-slate-200 max-w-lg w-full p-5 space-y-4 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-base">
              💬
            </span>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Rappels WhatsApp & SMS Automatisés</h3>
              <p className="text-[11px] text-slate-500 font-mono">
                Patient: <span className="font-semibold text-slate-700">{patientName}</span> • {rawPhone || 'Sans téléphone'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="text-slate-400 hover:text-slate-600 p-1 text-sm rounded cursor-pointer"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        {/* API Notification Status Alert */}
        {apiSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs space-y-1 text-emerald-900">
            <div className="flex items-center gap-1.5 font-bold">
              <span>✅</span> Message interactif envoyé au patient !
            </div>
            <p className="text-[11px] text-emerald-800">
              Canal: <span className="font-semibold uppercase">{apiSuccess.channel || 'whatsapp'}</span> • 
              Numéro: <span className="font-mono">{apiSuccess.recipient}</span>
            </p>
            {apiSuccess.provider_message_id && (
              <p className="font-mono text-[10px] text-emerald-700 truncate">
                ID Meta: {apiSuccess.provider_message_id}
              </p>
            )}
          </div>
        )}

        {apiError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex items-center gap-1.5">
            <span>⚠️</span> {apiError}
          </div>
        )}

        {/* Language selector */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700">Langue du modèle interactif :</span>
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-100 text-xs">
            <button
              type="button"
              onClick={() => setLang('ar')}
              className={`px-3 py-1 rounded-md transition cursor-pointer ${
                lang === 'ar' ? 'bg-white font-semibold text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              العربية (الدارجة) 🇲🇦
            </button>
            <button
              type="button"
              onClick={() => setLang('fr')}
              className={`px-3 py-1 rounded-md transition cursor-pointer ${
                lang === 'fr' ? 'bg-white font-semibold text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Français
            </button>
          </div>
        </div>

        {/* Realistic WhatsApp Chat Bubble Preview */}
        <div className="rounded-xl border border-slate-200 bg-slate-100/70 p-3 space-y-2">
          <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            <span>Aperçu écran WhatsApp du patient</span>
            <span>Meta Verified Cabinet</span>
          </div>

          <div className={`p-3 bg-white border border-emerald-200/80 rounded-xl rounded-tl-none text-xs text-slate-800 leading-relaxed font-sans shadow-2xs ${lang === 'ar' ? 'text-right' : 'text-left'}`}>
            <div className="font-bold text-[11px] text-emerald-800 mb-1 border-b border-emerald-100 pb-1">
              {lang === 'ar' ? '🏥 تذكير بموعد طبي' : '🏥 Rappel de Rendez-vous Médical'}
            </div>
            <div className="whitespace-pre-line text-slate-700">{currentMessage}</div>
            
            {/* Interactive 1-click CTA buttons simulation */}
            <div className="mt-3 pt-2 border-t border-slate-100 space-y-1.5">
              <div className="w-full py-1.5 px-3 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-800 font-semibold text-[11px] flex items-center justify-center gap-1.5 shadow-2xs">
                <span>✅</span>
                <span>{lang === 'ar' ? 'تأكيد الحضور (1-Clic)' : 'Confirmer ma présence (1-Clic)'}</span>
              </div>
              <div className="w-full py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium text-[11px] flex items-center justify-center gap-1.5">
                <span>❌</span>
                <span>{lang === 'ar' ? 'إلغاء أو طلب تأجيل' : 'Annuler ou Demander un report'}</span>
              </div>
            </div>

            <div className="text-[10px] text-slate-400 text-right mt-1 font-mono">
              {timeStrFr} • Envoyé avec Meta Cloud API ✓✓
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleCopy}
              className="px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition cursor-pointer"
            >
              {copied ? '✓ Copié' : '📋 Copier'}
            </button>
            <button
              type="button"
              onClick={handleManualSend}
              className="px-2.5 py-1.5 text-xs text-slate-700 hover:text-slate-900 border border-slate-300 rounded-lg hover:bg-slate-50 transition cursor-pointer flex items-center gap-1"
              title="Ouvrir WhatsApp Web manuellement"
            >
              <span>Manuel</span>
              <span>↗</span>
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
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
              onClick={handleCloudApiSend}
              disabled={sendingApi || !appointment.patient?.phone}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {sendingApi ? (
                <>
                  <span className="animate-spin inline-block">⏳</span>
                  <span>Envoi en cours...</span>
                </>
              ) : (
                <>
                  <span>⚡ Envoyer via Cloud API</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WhatsAppReminderModal;
