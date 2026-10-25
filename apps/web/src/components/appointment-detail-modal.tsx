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

  const tz = timezone || 'Africa/Casablanca';
  const start = DateTime.fromISO(appointment.starts_at).setZone(tz);
  const end = DateTime.fromISO(appointment.ends_at).setZone(tz);

  const canCancel = (isDoctor && appointment.doctor_id === doctorId) || isSecretary;
  const canMarkArrived = isSecretary;
  const canMarkCompleted = isDoctor && appointment.doctor_id === doctorId;

  async function markStatus(status: string, cancel_reason?: string | null) {
    setBusy(true);
    setError(null);
    try {
      await changeStatus(appointment.id, { status, cancel_reason: cancel_reason ?? null });
      onUpdated();
      onOpenChange(false);
    } catch (e: any) {
      setError(e.message || 'Cannot change status');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40" />
        <Dialog.Content
          className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-xl border border-gray-200 shadow-xl p-6"
          aria-label="Détail du rendez-vous"
        >
          <div className="flex items-center justify-between mb-3">
            <Dialog.Title className="text-lg font-bold text-gray-900">
              Détail du rendez-vous
            </Dialog.Title>
            <AppointmentStatusBadge status={appointment.status} />
          </div>

          <div className="space-y-2 text-sm">
            <div>
              <span className="text-gray-500">Date / heure : </span>
              <span className="text-gray-900">
                {start.toFormat('dd LLL yyyy')} · {start.toFormat('HH:mm')} – {end.toFormat('HH:mm')}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Médecin : </span>
              <span className="text-gray-900">{appointment.doctor?.full_name || '—'}</span>
            </div>
            <div>
              <span className="text-gray-500">Motif : </span>
              <span className="text-gray-900">{appointment.reason || '—'}</span>
            </div>
            {appointment.cancel_reason && (
              <div>
                <span className="text-gray-500">Raison de l'annulation : </span>
                <span className="text-gray-900">{appointment.cancel_reason}</span>
              </div>
            )}
          </div>

          {error && (
            <div className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-2">
            {canMarkArrived && appointment.status === 'confirmed' && (
              <Button
                size="sm"
                disabled={busy}
                onClick={() => markStatus('arrived')}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                Arrivé
              </Button>
            )}
            {canMarkCompleted && appointment.status === 'in_progress' && (
              <Button
                size="sm"
                disabled={busy}
                onClick={() => markStatus('completed')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Terminé
              </Button>
            )}
            {canCancel && appointment.status !== 'cancelled' && (
              <Button
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() => {
                  const reason = window.prompt('Raison (optionnelle) :');
                  markStatus('cancelled', reason);
                }}
                className="border-red-300 text-red-700 hover:bg-red-50"
              >
                Annuler
              </Button>
            )}
          </div>

          <div className="mt-6 flex justify-end">
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