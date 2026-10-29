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
    : 'PT';

  return (
    <motion.aside
      initial={{ x: 340, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 340, opacity: 0 }}
      transition={{ type: 'spring', damping: 30, stiffness: 300, mass: 0.8 }}
      className="w-84 shrink-0 bg-white border-l border-slate-200 h-full flex flex-col shadow-xs"
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2.5">
          <span className="w-7 h-7 rounded-lg bg-terracotta-100 text-terracotta-700 font-bold text-xs flex items-center justify-center">
            {initials}
          </span>
          <div>
            <h3 className="font-semibold text-xs text-slate-900 leading-tight">
              {patientName}
            </h3>
            <span className="font-mono text-[10px] text-slate-500">
              {appointment.patient?.cin ? `CIN: ${appointment.patient.cin}` : 'Sans CIN'}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition cursor-pointer"
          aria-label="Fermer l'inspecteur"
        >
          ✕
        </button>
      </div>

      {/* Body details */}
      <div className="p-4 space-y-4 flex-1 overflow-y-auto text-xs">
        {/* Status & Time */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-0.5">
              Horaire
            </span>
            <span className="font-mono text-xs font-semibold text-slate-900">
              {start.toFormat('HH:mm')} – {end.toFormat('HH:mm')}
            </span>
          </div>
          <AppointmentStatusBadge status={appointment.status} />
        </div>

        {/* Contact info */}
        {appointment.patient?.phone && (
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-0.5">
              Téléphone
            </span>
            <a
              href={`tel:${appointment.patient.phone}`}
              className="font-mono text-xs text-terracotta-700 hover:underline font-medium"
            >
              {appointment.patient.phone}
            </a>
          </div>
        )}

        {/* WhatsApp Cloud API Reminder Status Badge */}
        <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/80 space-y-1.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1">
              <span>💬</span> Rappel WhatsApp (Cloud API)
            </span>
            {notificationLog ? (
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                  appointment.status === 'confirmed'
                    ? 'bg-emerald-100 text-emerald-800'
                    : appointment.status === 'cancelled'
                    ? 'bg-rose-100 text-rose-800'
                    : notificationLog.status === 'delivered'
                    ? 'bg-purple-100 text-purple-800'
                    : notificationLog.status === 'sent'
                    ? 'bg-terracotta-100 text-blue-800'
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
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-200 text-slate-600">
                Non envoyé
              </span>
            )}
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-600">
            <span className="truncate max-w-[160px] font-mono text-[10px]">
              {notificationLog?.recipient_phone || appointment.patient?.phone || 'Sans contact'}
            </span>
            {onOpenWhatsApp && (
              <button
                type="button"
                onClick={onOpenWhatsApp}
                className="text-emerald-700 hover:text-emerald-900 font-semibold hover:underline cursor-pointer text-[11px]"
              >
                {notificationLog ? 'Renvoyer ↗' : 'Envoyer ↗'}
              </button>
            )}
          </div>
        </div>

        {/* Doctor & Motive */}
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-0.5">
            Motif de consultation
          </span>
          <p className="text-slate-800 bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 leading-relaxed">
            {appointment.reason || 'Consultation standard'}
          </p>
        </div>

        {/* Clinical notes (role gated) */}
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
            Notes cliniques {isDoctor ? '(Médecin)' : '🔒 (Confidentiel)'}
          </span>
          {isDoctor ? (
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Saisir les observations cliniques..."
              className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:ring-1 focus:ring-terracotta-500 focus:outline-none"
            />
          ) : (
            <p className="text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded border border-slate-200">
              Accès réservé au médecin traitant (Loi 09-08).
            </p>
          )}
        </div>

        {/* Clinical & Secretary Suite Tools */}
        <div className="pt-2 border-t border-slate-100 space-y-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
            Modules Cliniques & Gestion
          </span>

          <div className="grid grid-cols-2 gap-1.5">
            {onOpenWhatsApp && (
              <button
                type="button"
                onClick={onOpenWhatsApp}
                className="p-2 rounded-lg border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/70 text-emerald-800 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <span>💬</span> WhatsApp
              </button>
            )}

            {onOpenCashDesk && (
              <button
                type="button"
                onClick={onOpenCashDesk}
                className="p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <span>💰</span> Règlements
              </button>
            )}

            {onOpenPrescription && (
              <button
                type="button"
                onClick={onOpenPrescription}
                className="p-2 rounded-lg border border-terracotta-200 bg-terracotta-50/60 hover:bg-terracotta-100/70 text-terracotta-600 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer col-span-2"
              >
                <span>💊</span> Rédiger Ordonnance (DMP)
              </button>
            )}

            {onOpenInsuranceClaim && (
              <button
                type="button"
                onClick={onOpenInsuranceClaim}
                className="p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-[11px] font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <span>📑</span> Feuille de Soins (AMO)
              </button>
            )}

            {onOpenCertificate && (
              <button
                type="button"
                onClick={onOpenCertificate}
                className="p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-[11px] font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <span>📜</span> Certificat Médical
              </button>
            )}

            {onOpenPediatric && (
              <button
                type="button"
                onClick={onOpenPediatric}
                className="p-2 rounded-lg border border-pink-200 bg-pink-50/70 hover:bg-pink-100 text-pink-900 text-[11px] font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <span>👶</span> Suivi PNI Pédiatrie
              </button>
            )}

            {onOpenDental && (
              <button
                type="button"
                onClick={onOpenDental}
                className="p-2 rounded-lg border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-blue-900 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <span>🦷</span> Schéma Dentaire
              </button>
            )}

            {onOpenObstetric && (
              <button
                type="button"
                onClick={onOpenObstetric}
                className="p-2 rounded-lg border border-rose-200 bg-rose-50/70 hover:bg-rose-100 text-rose-900 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <span>🤰</span> Suivi Obstétrique
              </button>
            )}

            {onOpenTeleconsult && (
              <button
                type="button"
                onClick={onOpenTeleconsult}
                className="p-2 rounded-lg border border-purple-200 bg-purple-50/70 hover:bg-purple-100 text-purple-900 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <span>📹</span> Téléconsultation
              </button>
            )}

            {onOpenCmiPayment && (
              <button
                type="button"
                onClick={onOpenCmiPayment}
                className="p-2 rounded-lg border border-terracotta-200 bg-terracotta-50/70 hover:bg-terracotta-100 text-blue-900 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer col-span-2"
              >
                <span>💳</span> Paiement en Ligne (CMI Maroc)
              </button>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="pt-2 border-t border-slate-100 space-y-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
            Actions du rendez-vous
          </span>

          <div className="space-y-1.5">
            {canMarkArrived && (
              <Button
                variant="outline"
                size="sm"
                isLoading={busy}
                disabled={busy}
                onClick={() => handleStatus('arrived')}
                className="w-full justify-center border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100 text-xs font-semibold"
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
                className="w-full justify-center bg-terracotta-600 hover:bg-terracotta-700 text-white text-xs font-semibold"
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
                className="w-full justify-center bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
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
                className="w-full justify-center text-red-600 hover:bg-red-50 text-xs"
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
