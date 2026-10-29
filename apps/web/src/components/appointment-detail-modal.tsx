'use client';

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { DateTime } from 'luxon';
import { useTranslations } from 'next-intl';
import Button from '@/components/ui/button';
import { AppointmentStatusBadge } from './appointment-status-badge';
import { useAgenda } from '../hooks/use-agenda';
import type { Appointment } from '../hooks/use-agenda';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: Appointment | null;
  timezone: string;
  isDoctor: boolean;
  isSecretary: boolean;
  doctorId?: string;
  onUpdated: () => void;
}

export function AppointmentDetailModal({
  open,
  onOpenChange,
  appointment,
  timezone,
  isDoctor,
  isSecretary,
  doctorId,
  onUpdated,
}: Props) {
  const t = useTranslations();
  const { changeStatus } = useAgenda();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!appointment) return null;

  const appt = appointment;
  const tz = timezone || 'Africa/Casablanca';
  const start = DateTime.fromISO(appt.starts_at).setZone(tz);
  const end = DateTime.fromISO(appt.ends_at).setZone(tz);

  const canCancel = (isDoctor && appt.doctor_id === doctorId) || isSecretary;
  const canMarkArrived = isSecretary;
  const canMarkCompleted = isDoctor && appt.doctor_id === doctorId;

  async function markStatus(status: string, cancel_reason?: string | null) {
    setBusy(true);
    setError(null);
    try {
      await changeStatus(appt.id, { status, cancel_reason: cancel_reason ?? null });
      onUpdated();
      onOpenChange(false);
    } catch (e: any) {
      setError(e.message || 'Impossible de modifier le statut');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 transition-opacity" />
        <Dialog.Content
          className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md sheet-card shadow-2xl p-6"
          aria-label="Détail du rendez-vous"
        >
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
            <Dialog.Title className="text-lg font-bold text-gray-900">
              Détail du rendez-vous
            </Dialog.Title>
            <AppointmentStatusBadge status={appt.status} />
          </div>

          <div className="space-y-3 text-sm">
            <div>
              <span className="text-gray-500">Date & heure : </span>
              <span className="text-gray-900 font-semibold">
                {start.toFormat('dd LLL yyyy')} · {start.toFormat('HH:mm')} – {end.toFormat('HH:mm')}
              </span>
            </div>

            {appt.patient && (
              <div className="p-2.5 bg-terracotta-50/70 border border-terracotta-100 rounded-lg">
                <span className="text-xs font-semibold text-blue-800 uppercase tracking-wide block mb-0.5">
                  Patient
                </span>
                <span className="text-gray-900 font-medium">
                  {appt.patient.first_name} {appt.patient.last_name}
                </span>
                {appt.patient.phone && (
                  <span className="text-gray-600 text-xs block">
                    {appt.patient.phone}
                  </span>
                )}
                {appt.patient.cin && (
                  <span className="text-gray-500 text-xs block">
                    CIN : {appt.patient.cin}
                  </span>
                )}
              </div>
            )}

            <div>
              <span className="text-gray-500">Médecin : </span>
              <span className="text-gray-900 font-medium">{appointment.doctor?.full_name || '—'}</span>
            </div>

            <div>
              <span className="text-gray-500">Motif de consultation : </span>
              <span className="text-gray-900">{appointment.reason || '—'}</span>
            </div>

            {appt.cancel_reason && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                <span className="font-semibold block">Raison de l&apos;annulation :</span>
                {appt.cancel_reason}
              </div>
            )}
          </div>

          {error && (
            <div
              role="alert"
              className="mt-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-2.5"
            >
              {error}
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-2 pt-3 border-t border-gray-100">
            {canMarkArrived && appt.status === 'confirmed' && (
              <Button
                size="sm"
                isLoading={busy}
                disabled={busy}
                onClick={() => markStatus('arrived')}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                Marquer comme Arrivé
              </Button>
            )}
            {canMarkCompleted && appt.status === 'in_progress' && (
              <Button
                size="sm"
                isLoading={busy}
                disabled={busy}
                onClick={() => markStatus('completed')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Marquer comme Terminé
              </Button>
            )}
            {canCancel && appt.status !== 'cancelled' && (
              <Button
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() => {
                  const reason = window.prompt('Raison de l&apos;annulation (optionnelle) :');
                  markStatus('cancelled', reason);
                }}
                className="border-red-300 text-red-700 hover:bg-red-50"
              >
                Annuler le rendez-vous
              </Button>
            )}
          </div>

          <div className="mt-4 flex justify-end">
            <Dialog.Close asChild>
              <Button variant="outline" size="sm" type="button">
                Fermer
              </Button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default AppointmentDetailModal;
