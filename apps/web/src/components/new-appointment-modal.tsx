import { useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useTranslations } from 'next-intl';
import { DateTime } from 'luxon';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import { useAgenda, type Slot } from '../hooks/use-agenda';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  doctorId: string;
  doctorName: string;
  timezone: string;
  defaultSlot?: Slot;
  defaultDate: Date;
  onSuccess: () => void;
}

export function NewAppointmentModal({
  open,
  onOpenChange,
  doctorId,
  doctorName,
  timezone,
  defaultSlot,
  defaultDate,
  onSuccess,
}: Props) {
  const t = useTranslations();
  const { createAppointment } = useAgenda();
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (defaultSlot) {
      setStartsAt(defaultSlot.start);
      setEndsAt(defaultSlot.end);
    } else {
      const d = DateTime.fromJSDate(defaultDate).setZone(timezone || 'Africa/Casablanca');
      setStartsAt(d.toISO() || '');
      setEndsAt(d.plus({ minutes: 30 }).toISO() || '');
    }
  }, [defaultSlot, defaultDate, timezone]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!startsAt || !endsAt) {
      setError('start/end required');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await createAppointment({
        doctor_id: doctorId,
        starts_at: startsAt,
        ends_at: endsAt,
        reason: reason || null,
        source: 'staff',
      });
      setReason('');
      onOpenChange(false);
      onSuccess();
    } catch (e: any) {
      setError(e.message || 'slot_unavailable');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40" />
        <Dialog.Content
          className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-xl border border-gray-200 shadow-xl p-6"
          aria-label="Nouveau rendez-vous"
        >
          <Dialog.Title className="text-lg font-bold text-gray-900 mb-1">
            Nouveau rendez-vous
          </Dialog.Title>
          <p className="text-sm text-gray-500 mb-4">
            Dr. {doctorName}
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Début
              </label>
              <Input
                type="datetime-local"
                value={startsAt ? startsAt.slice(0, 16) : ''}
                onChange={(e) => {
                  const local = e.target.value;
                  if (!local) return;
                  const iso = new Date(local).toISOString();
                  setStartsAt(iso);
                  setEndsAt(new Date(new Date(iso).getTime() + 30 * 60000).toISOString());
                }}
                className="text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Fin
              </label>
              <Input
                type="datetime-local"
                value={endsAt ? endsAt.slice(0, 16) : ''}
                onChange={(e) => setEndsAt(new Date(e.target.value).toISOString())}
                className="text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Motif
              </label>
              <Input
                type="text"
                placeholder="Ex: Suivi, Contrôle..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="text-sm"
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Dialog.Close asChild>
                <Button variant="outline" size="sm" type="button">
                  Annuler
                </Button>
              </Dialog.Close>
              <Button
                size="sm"
                type="submit"
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}