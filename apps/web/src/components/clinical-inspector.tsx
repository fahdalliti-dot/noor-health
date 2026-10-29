'use client';

import { useState, useEffect } from 'react';
import { DateTime } from 'luxon';
import { motion } from 'motion/react';
import Button from '@/components/ui/button';
import { AppointmentStatusBadge } from './appointment-status-badge';
import type { Appointment } from '@/hooks/use-agenda';
import { api } from '@/lib/api';

interface Props {
  appointment: Appointment | null;
  onClose: () => void;
  timezone: string;
  isDoctor: boolean;
  isSecretary: boolean;
  doctorId?: string;
  onStatusChange: (status: string, reason?: string | null) => Promise<void>;
  onOpenWhatsApp?: () => void;
  onOpenPrescription?: () => void;
  onOpenInsuranceClaim?: () => void;
  onOpenCashDesk?: () => void;
  onOpenCertificate?: () => void;
  onOpenPediatric?: () => void;
  onOpenDental?: () => void;
  onOpenObstetric?: () => void;
  onOpenTeleconsult?: () => void;
  onOpenCmiPayment?: () => void;
}

export function ClinicalInspector({
  appointment,
  onClose,
  timezone,
  isDoctor,
  isSecretary,
  doctorId,
  onStatusChange,
  onOpenWhatsApp,
  onOpenPrescription,
  onOpenInsuranceClaim,
  onOpenCashDesk,
  onOpenCertificate,
  onOpenPediatric,
  onOpenDental,
  onOpenObstetric,
  onOpenTeleconsult,
  onOpenCmiPayment,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [notes, setNotes] = useState('');
  const [notificationLog, setNotificationLog] = useState<any | null>(null);

  useEffect(() => {
    if (!appointment?.id) {
      setNotificationLog(null);
      return;
    }
    let isMounted = true;
    api.get<any>(`/notifications/logs?appointment_id=${appointment.id}`)
      .then((res: any) => {
        if (!isMounted) return;
        const logs = res?.data || res;
        if (Array.isArray(logs) && logs.length > 0) {
          setNotificationLog(logs[0]);
        } else {
          setNotificationLog(null);
        }
      })
      .catch(() => {
        if (isMounted) setNotificationLog(null);
      });

    return () => {
      isMounted = false;
    };
  }, [appointment?.id, appointment?.status]);

  if (!appointment) return null;

  const tz = timezone || 'Africa/Casablanca';
  const start = DateTime.fromISO(appointment.starts_at).setZone(tz);
  const end = DateTime.fromISO(appointment.ends_at).setZone(tz);

  const canCancel = (isDoctor && appointment.doctor_id === doctorId) || isSecretary;
  const canMarkArrived = isSecretary && (appointment.status === 'confirmed' || appointment.status === 'scheduled');
  const canMarkConsulting = isDoctor && appointment.status === 'arrived';
  const canMarkCompleted = isDoctor && appointment.status === 'in_progress';

  async function handleStatus(newStatus: string) {
    setBusy(true);
    try {
      await onStatusChange(newStatus);
    } finally {
      setBusy(false);
    }
  }

  const patientName = appointment.patient
    ? `${appointment.patient.first_name} ${appointment.patient.last_name}`
    : 'Patient sans dossier';

  const initials = appointment.patient
    ? `${appointment.patient.first_name[0] || ''}${appointment.patient.last_name[0] || ''}`.toUpperCase()
    : 'P';

  return (
    <motion.aside
      initial={{ x: 340, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 340, opacity: 0 }}
      transition={{ type: 'spring', damping: 30, stiffness: 300, mass: 0.8 }}
      className="w-96 shrink-0 bg-white border border-sand-300/80 rounded-2xl h-full flex flex-col shadow-lg overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b border-sand-200 bg-gradient-to-r from-sand-100/70 via-white to-sand-50/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-terracotta-600 to-terracotta-800 text-white font-bold text-sm flex items-center justify-center shadow-xs">
            {initials}
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 leading-tight">
              {patientName}
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="font-mono text-[11px] font-semibold text-slate-600 bg-sand-200/90 px-1.5 py-0.5 rounded">
                {appointment.patient?.cin ? `CIN: ${appointment.patient.cin}` : 'Sans CIN'}
              </span>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                AMO CNSS
              </span>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-sand-200/80 transition cursor-pointer"
          aria-label="Fermer l'inspecteur"
        >
          ✕
        </button>
      </div>

      {/* Body details */}
      <div className="p-4 space-y-4 flex-1 overflow-y-auto text-xs">
        {/* Status & Time Card */}
        <div className="p-3 rounded-xl bg-sand-50/80 border border-sand-200 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
              Créneau de consultation
            </span>
            <span className="font-mono text-xs font-bold text-slate-900">
              {start.toFormat('HH:mm')} – {end.toFormat('HH:mm')}
            </span>
          </div>
          <AppointmentStatusBadge status={appointment.status} />
        </div>

        {/* Vitals Quick Glance Bento */}
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
            Constantes Vitales Récents (DMP)
          </span>
          <div className="grid grid-cols-4 gap-1.5 text-center">
            <div className="p-2 rounded-xl bg-slate-50 border border-sand-200 shadow-2xs">
              <span className="text-[10px] text-slate-500 block">Tension</span>
              <span className="font-mono font-bold text-xs text-slate-900">120/80</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-50 border border-sand-200 shadow-2xs">
              <span className="text-[10px] text-slate-500 block">Pouls</span>
              <span className="font-mono font-bold text-xs text-slate-900">72 bpm</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-50 border border-sand-200 shadow-2xs">
              <span className="text-[10px] text-slate-500 block">IMC</span>
              <span className="font-mono font-bold text-xs text-emerald-700">22.4</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-50 border border-sand-200 shadow-2xs">
              <span className="text-[10px] text-slate-500 block">Temp.</span>
              <span className="font-mono font-bold text-xs text-slate-900">37.0°C</span>
            </div>
          </div>
        </div>

        {/* WhatsApp Cloud API Reminder Status Badge */}
        <div className="p-3 rounded-xl border border-sand-300 bg-sand-50/90 space-y-2 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <span>💬</span> Rappel WhatsApp (Cloud API)
            </span>
            {notificationLog ? (
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  appointment.status === 'confirmed'
                    ? 'bg-emerald-100 text-emerald-800'
                    : appointment.status === 'cancelled'
                    ? 'bg-rose-100 text-rose-800'
                    : notificationLog.status === 'delivered'
                    ? 'bg-purple-100 text-purple-800'
                    : notificationLog.status === 'sent'
                    ? 'bg-sky-100 text-sky-800'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {appointment.status === 'confirmed'
                  ? '✓ Confirmé (1-Clic)'
                  : appointment.status === 'cancelled'
                  ? '✕ Annulé'
                  : notificationLog.status === 'delivered'
                  ? '✓✓ Délivré'
                  : '✓ Envoyé'}
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sand-200 text-slate-600">
                Non envoyé
              </span>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-700">
            <span className="truncate max-w-[170px] font-mono text-[11px] font-medium">
              {notificationLog?.recipient_phone || appointment.patient?.phone || 'Sans contact'}
            </span>
            {onOpenWhatsApp && (
              <button
                type="button"
                onClick={onOpenWhatsApp}
                className="text-emerald-700 hover:text-emerald-900 font-bold hover:underline cursor-pointer text-xs"
              >
                {notificationLog ? 'Renvoyer ↗' : 'Envoyer ↗'}
              </button>
            )}
          </div>
        </div>

        {/* Doctor & Motive */}
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Motif de consultation
          </span>
          <p className="text-slate-800 bg-sand-50/70 p-3 rounded-xl border border-sand-200 leading-relaxed font-medium">
            {appointment.reason || 'Consultation standard'}
          </p>
        </div>

        {/* Clinical notes (role gated) */}
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Notes cliniques {isDoctor ? '(Médecin)' : '🔒 (Confidentiel)'}
          </span>
          {isDoctor ? (
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observations cliniques, diagnostic différentiel..."
              className="w-full rounded-xl border border-sand-300 p-2.5 text-xs focus:ring-2 focus:ring-terracotta-500/30 focus:border-terracotta-500 focus:outline-none transition shadow-2xs"
            />
          ) : (
            <p className="text-[11px] text-slate-500 italic bg-sand-50/70 p-2.5 rounded-xl border border-sand-200">
              Accès réservé au médecin traitant (CNDP Loi 09-08).
            </p>
          )}
        </div>

        {/* Clinical & Secretary Suite Tools */}
        <div className="pt-2 border-t border-sand-200 space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Modules Cliniques & Gestion Spécialisée
          </span>

          <div className="grid grid-cols-2 gap-2">
            {onOpenWhatsApp && (
              <button
                type="button"
                onClick={onOpenWhatsApp}
                className="p-2.5 rounded-xl border border-emerald-300 bg-emerald-50/80 hover:bg-emerald-100 text-emerald-900 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
              >
                <span>💬</span> WhatsApp
              </button>
            )}

            {onOpenCashDesk && (
              <button
                type="button"
                onClick={onOpenCashDesk}
                className="p-2.5 rounded-xl border border-sand-300 bg-white hover:bg-sand-50 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
              >
                <span>💰</span> Règlements
              </button>
            )}

            {onOpenPrescription && (
              <button
                type="button"
                onClick={onOpenPrescription}
                className="p-2.5 rounded-xl border border-terracotta-300 bg-terracotta-50/90 hover:bg-terracotta-100 text-terracotta-800 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer col-span-2 shadow-2xs"
              >
                <span>💊</span> Rédiger Ordonnance (DMP)
              </button>
            )}

            {onOpenInsuranceClaim && (
              <button
                type="button"
                onClick={onOpenInsuranceClaim}
                className="p-2 rounded-xl border border-sand-200 bg-sand-50/60 hover:bg-sand-100 text-slate-800 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <span>📑</span> Feuille Soins AMO
              </button>
            )}

            {onOpenCertificate && (
              <button
                type="button"
                onClick={onOpenCertificate}
                className="p-2 rounded-xl border border-sand-200 bg-sand-50/60 hover:bg-sand-100 text-slate-800 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <span>📜</span> Certificat Médical
              </button>
            )}

            {onOpenPediatric && (
              <button
                type="button"
                onClick={onOpenPediatric}
                className="p-2 rounded-xl border border-pink-200 bg-pink-50/70 hover:bg-pink-100 text-pink-900 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <span>👶</span> Suivi PNI Pédiatrie
              </button>
            )}

            {onOpenDental && (
              <button
                type="button"
                onClick={onOpenDental}
                className="p-2 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-blue-900 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <span>🦷</span> Schéma Dentaire
              </button>
            )}

            {onOpenObstetric && (
              <button
                type="button"
                onClick={onOpenObstetric}
                className="p-2 rounded-xl border border-rose-200 bg-rose-50/70 hover:bg-rose-100 text-rose-900 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <span>🤰</span> Suivi Obstétrique
              </button>
            )}

            {onOpenTeleconsult && (
              <button
                type="button"
                onClick={onOpenTeleconsult}
                className="p-2 rounded-xl border border-purple-200 bg-purple-50/70 hover:bg-purple-100 text-purple-900 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <span>📹</span> Téléconsultation
              </button>
            )}

            {onOpenCmiPayment && (
              <button
                type="button"
                onClick={onOpenCmiPayment}
                className="p-2 rounded-xl border border-terracotta-200 bg-sand-50/80 hover:bg-sand-100 text-terracotta-800 text-[11px] font-bold flex items-center justify-center gap-1.5 transition cursor-pointer col-span-2 shadow-2xs"
              >
                <span>💳</span> Paiement en Ligne (CMI Maroc)
              </button>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="pt-2 border-t border-sand-200 space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Actions du rendez-vous
          </span>

          <div className="space-y-2">
            {canMarkArrived && (
              <Button
                variant="outline"
                size="sm"
                isLoading={busy}
                disabled={busy}
                onClick={() => handleStatus('arrived')}
                className="w-full justify-center border-amber-300 text-amber-900 bg-amber-50 hover:bg-amber-100 text-xs font-bold rounded-xl h-9"
              >
                🪑 Marquer en salle d&apos;attente
              </Button>
            )}

            {canMarkConsulting && (
              <Button
                size="sm"
                isLoading={busy}
                disabled={busy}
                onClick={() => handleStatus('in_progress')}
                className="w-full justify-center bg-terracotta-600 hover:bg-terracotta-700 text-white text-xs font-bold rounded-xl h-9 shadow-xs"
              >
                🩺 Démarrer la consultation
              </Button>
            )}

            {canMarkCompleted && (
              <Button
                size="sm"
                isLoading={busy}
                disabled={busy}
                onClick={() => handleStatus('completed')}
                className="w-full justify-center bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl h-9 shadow-xs"
              >
                ✓ Terminer la consultation
              </Button>
            )}

            {canCancel && appointment.status !== 'cancelled' && (
              <Button
                variant="ghost"
                size="sm"
                disabled={busy}
                onClick={() => {
                  const reason = window.prompt('Raison de l&apos;annulation :');
                  if (reason !== null) onStatusChange('cancelled', reason);
                }}
                className="w-full justify-center text-rose-600 hover:bg-rose-50 text-xs font-medium rounded-xl"
              >
                Annuler ce rendez-vous
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.aside>
  );
}

export default ClinicalInspector;
