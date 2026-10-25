'use client';

import { useEffect, useState } from 'react';
import { DateTime } from 'luxon';
import { useAuth } from '@/lib/auth';
import { useAgenda } from '@/hooks/use-agenda';
import { AgendaDayView } from '@/components/agenda-day-view';
import { AgendaWeekView } from '@/components/agenda-week-view';
import { NewAppointmentModal } from '@/components/new-appointment-modal';
import { AppointmentDetailModal } from '@/components/appointment-detail-modal';
import Button from '@/components/ui/button';
import { AppointmentStatusBadge } from '@/components/appointment-status-badge';

const TZ = 'Africa/Casablanca';

export default function AgendaPage() {
  const { user } = useAuth();
  const {
    fetchAppointments,
    fetchAvailability,
    createAppointment,
    reschedule,
    changeStatus,
  } = useAgenda();

  const [view, setView] = useState<'day' | 'week'>('day');
  const [cursor, setCursor] = useState(new Date());
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [detailAppt, setDetailAppt] = useState<any>(null);
  const [toast, setToast] = useState<string | null>(null);

  const isDoctor = user?.role === 'doctor';
  const doctorId = isDoctor ? user.id : null;

  async function load() {
    if (!user) return;
    setLoading(true);
    try {
      const start = DateTime.fromJSDate(cursor).setZone(TZ).startOf(view === 'day' ? 'day' : 'week').toISO();
      const end = DateTime.fromJSDate(cursor).setZone(TZ).endOf(view === 'day' ? 'day' : 'week').toISO();
      const list = await fetchAppointments({
        from: start!,
        to: end!,
        doctor_id: doctorId || undefined,
      });
      setAppointments(list);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursor, view, user?.id, user?.role]);

  function shift(delta: number) {
    setCursor((c) => {
      const d = DateTime.fromJSDate(c).setZone(TZ);
      return d.plus({ [view === 'day' ? 'days' : 'weeks']: delta }).toJSDate();
    });
  }

  function title() {
    const d = DateTime.fromJSDate(cursor).setZone(TZ);
    if (view === 'day') return d.toFormat('cccc d LLLL yyyy');
    const start = d.startOf('week');
    return `Semaine du ${start.toFormat('dd LLL')} – ${start.plus({ days: 6 }).toFormat('dd LLL yyyy')}`;
  }

  function handleSlotClick(slot: any) {
    setSelectedSlot(slot);
    setModalOpen(true);
  }

  async function handleCreate() {
    await load();
    setModalOpen(false);
    setToast('Rendez-vous créé');
  }

  async function handleUpdated() {
    await load();
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => shift(-1)}>
            ‹ Précédent
          </Button>
          <h2 className="text-lg font-bold text-gray-900 min-w-[220px] text-center">
            {title()}
          </h2>
          <Button variant="outline" size="sm" onClick={() => shift(1)}>
            Suivant ›
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCursor(new Date())}
          >
            Aujourd&apos;hui
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            <button
              type="button"
              onClick={() => setView('day')}
              className={`px-3 py-1.5 text-sm font-medium ${
                view === 'day' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Jour
            </button>
            <button
              type="button"
              onClick={() => setView('week')}
              className={`px-3 py-1.5 text-sm font-medium ${
                view === 'week' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Semaine
            </button>
          </div>
          <Button
            size="sm"
            onClick={() => {
              setSelectedSlot(null);
              setModalOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            + Nouveau
          </Button>
        </div>
      </div>

      {/* View */}
      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-10 text-center text-gray-500">
          Chargement...
        </div>
      ) : view === 'day' ? (
        <AgendaDayView
          date={cursor}
          timezone={TZ}
          slotMinutes={30}
          appointments={appointments}
          onSlotClick={handleSlotClick}
          onAppointmentClick={setDetailAppt}
          doctorId={doctorId || undefined}
        />
      ) : (
        <AgendaWeekView
          weekStart={DateTime.fromJSDate(cursor).setZone(TZ).startOf('week').toJSDate()}
          timezone={TZ}
          slotMinutes={30}
          appointments={appointments}
          doctors={[] as any[]}
          onSlotClick={(docId, slot) => {
            setSelectedSlot(slot);
            setModalOpen(true);
          }}
          onAppointmentClick={setDetailAppt}
        />
      )}

      {/* Modals */}
      <NewAppointmentModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        doctorId={doctorId || ''}
        doctorName={user?.full_name || ''}
        timezone={TZ}
        defaultSlot={selectedSlot || undefined}
        defaultDate={cursor}
        onSuccess={handleCreate}
      />

      <AppointmentDetailModal
        open={!!detailAppt}
        onOpenChange={(o) => !o && setDetailAppt(null)}
        appointment={detailAppt}
        timezone={TZ}
        isDoctor={isDoctor}
        isSecretary={user?.role === 'secretary'}
        doctorId={doctorId || undefined}
        onUpdated={handleUpdated}
      />

      {toast && (
        <div className="fixed bottom-4 right-4 bg-green-50 text-green-800 border border-green-200 rounded-lg px-4 py-2 shadow-lg z-50">
          {toast}
        </div>
      )}
    </div>
  );
}