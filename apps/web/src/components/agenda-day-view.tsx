'use client';

import { useMemo, useEffect, useState } from 'react';
import { DateTime } from 'luxon';
import { AppointmentStatusBadge } from './appointment-status-badge';
import type { Slot, Appointment } from '../hooks/use-agenda';

const STATUS_SPINES: Record<string, string> = {
  scheduled: 'border-l-slate-400 bg-slate-50/70',
  confirmed: 'border-l-blue-500 bg-blue-50/50',
  arrived: 'border-l-amber-500 bg-amber-50/60',
  in_progress: 'border-l-emerald-500 bg-emerald-50/60',
  completed: 'border-l-slate-400 bg-slate-50/50 opacity-80',
  cancelled: 'border-l-red-400 bg-red-50/40 opacity-70',
  no_show: 'border-l-rose-400 bg-rose-50/40 opacity-70',
};

interface Props {
  date: Date;
  timezone: string;
  slotMinutes: number;
  appointments: Appointment[];
  onSlotClick: (slot: Slot) => void;
  onAppointmentClick: (appt: Appointment) => void;
  doctorId?: string;
  selectedApptId?: string | null;
}

export function AgendaDayView({
  date,
  timezone,
  slotMinutes,
  appointments,
  onSlotClick,
  onAppointmentClick,
  doctorId,
  selectedApptId,
}: Props) {
  const tz = timezone || 'Africa/Casablanca';
  const [now, setNow] = useState(() => DateTime.now().setZone(tz));

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(DateTime.now().setZone(tz));
    }, 60000);
    return () => clearInterval(timer);
  }, [tz]);

  // Clinical Practice Hours: 08:00 to 20:00 (12 hours)
  const START_HOUR = 8;
  const END_HOUR = 20;

  const dayStart = DateTime.fromJSDate(date).setZone(tz).startOf('day').set({ hour: START_HOUR });
  const dayEnd = DateTime.fromJSDate(date).setZone(tz).startOf('day').set({ hour: END_HOUR });

  // 12 hours array
  const hours = useMemo(() => {
    const rows: DateTime[] = [];
    for (let h = START_HOUR; h < END_HOUR; h++) {
      rows.push(dayStart.set({ hour: h }));
    }
    return rows;
  }, [dayStart]);

  const isToday = now.hasSame(DateTime.fromJSDate(date).setZone(tz), 'day');
  const nowMinutes = (now.hour - START_HOUR) * 60 + now.minute;
  const totalMinutes = (END_HOUR - START_HOUR) * 60;
  const showPlayhead = isToday && nowMinutes >= 0 && nowMinutes <= totalMinutes;
  const playheadTopPercent = showPlayhead ? (nowMinutes / totalMinutes) * 100 : null;

  // Filter appointments for the day
  const dayAppointments = useMemo(() => {
    return appointments
      .filter((a) => {
        const s = DateTime.fromISO(a.starts_at).setZone(tz);
        const e = DateTime.fromISO(a.ends_at).setZone(tz);
        return s < dayEnd && e > dayStart;
      })
      .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  }, [appointments, dayStart, dayEnd, tz]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
      {/* Table header */}
      <div className="grid grid-cols-[72px_1fr] border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-500">
        <div className="py-2.5 px-3 border-r border-slate-200 font-mono text-[11px] uppercase tracking-wider text-slate-400">
          Heure
        </div>
        <div className="py-2.5 px-4 flex items-center justify-between text-slate-700">
          <span>Consultations du jour</span>
          <span className="text-[11px] font-mono font-medium text-slate-500">
            {dayAppointments.length} rendez-vous programmé{dayAppointments.length > 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Grid container with relative positioning for playhead */}
      <div className="relative divide-y divide-slate-100">
        {/* Live red/teal time playhead for Africa/Casablanca */}
        {playheadTopPercent !== null && (
          <div
            className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
            style={{ top: `${playheadTopPercent}%` }}
          >
            <div className="w-[72px] text-right pe-2">
              <span className="bg-red-600 text-white font-mono text-[10px] px-1.5 py-0.5 rounded font-bold shadow-xs">
                {now.toFormat('HH:mm')}
              </span>
            </div>
            <div className="flex-1 h-0.5 bg-red-500 relative shadow-xs">
              <span className="absolute -left-1 -top-1 w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
              <span className="absolute -left-1 -top-1 w-2.5 h-2.5 rounded-full bg-red-600" />
            </div>
          </div>
        )}

        {/* 12 Practice Hour Rows */}
        {hours.map((hour) => {
          const hourStart = hour;
          const hourEnd = hour.plus({ hours: 1 });

          // Appointments falling in this hour
          const slotAppts = dayAppointments.filter((a) => {
            const s = DateTime.fromISO(a.starts_at).setZone(tz);
            return s >= hourStart && s < hourEnd;
          });

          return (
            <div
              key={hour.toISO()}
              className="grid grid-cols-[72px_1fr] min-h-[58px] group hover:bg-slate-50/40 transition-colors"
            >
              {/* Hour Label */}
              <div className="py-3 px-3 border-r border-slate-200 font-mono text-xs text-slate-400 tabular select-none">
                {hour.toFormat('HH:mm')}
              </div>

              {/* Hour Content */}
              <div className="p-1.5 flex flex-col gap-1.5 justify-center relative">
                {slotAppts.length === 0 ? (
                  /* Empty Clickable Slot */
                  <button
                    type="button"
                    onClick={() =>
                      onSlotClick({
                        start: hourStart.toISO()!,
                        end: hourStart.plus({ minutes: slotMinutes }).toISO()!,
                        available: true,
                      })
                    }
                    className="w-full h-full min-h-[44px] rounded-lg border border-dashed border-transparent hover:border-slate-300 hover:bg-blue-50/40 flex items-center px-3 text-slate-400 text-xs transition-all cursor-pointer group-hover:text-blue-600"
                    aria-label={`Créer un rendez-vous à ${hour.toFormat('HH:mm')}`}
                  >
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                      + Créneau disponible ({hour.toFormat('HH:mm')})
                    </span>
                  </button>
                ) : (
                  /* Appointments in this hour */
                  slotAppts.map((appt) => {
                    const startLocal = DateTime.fromISO(appt.starts_at).setZone(tz);
                    const endLocal = DateTime.fromISO(appt.ends_at).setZone(tz);
                    const isSelected = selectedApptId === appt.id;

                    const patientTitle = appt.patient
                      ? `${appt.patient.first_name} ${appt.patient.last_name}`
                      : 'Patient sans dossier';

                    return (
                      <button
                        key={appt.id}
                        type="button"
                        onClick={() => onAppointmentClick(appt)}
                        className={`w-full text-left rtl:text-right p-2.5 rounded-lg border-l-4 border transition-all cursor-pointer ${
                          STATUS_SPINES[appt.status] || 'border-l-slate-400 bg-slate-50'
                        } ${
                          isSelected
                            ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-sm'
                            : 'border-slate-200/80 hover:border-slate-300 hover:shadow-xs'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-semibold text-slate-900 tabular">
                              {startLocal.toFormat('HH:mm')} – {endLocal.toFormat('HH:mm')}
                            </span>
                            <span className="font-semibold text-xs text-slate-900">
                              {patientTitle}
                            </span>
                            {appt.patient?.cin && (
                              <span className="font-mono text-[11px] text-slate-400">
                                ({appt.patient.cin})
                              </span>
                            )}
                          </div>
                          <AppointmentStatusBadge status={appt.status} />
                        </div>
                        {appt.reason && (
                          <div className="text-[11px] text-slate-600 truncate mt-0.5">
                            {appt.reason}
                          </div>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default AgendaDayView;
