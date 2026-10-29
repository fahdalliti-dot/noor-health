'use client';

import { useMemo, useEffect, useState } from 'react';
import { DateTime } from 'luxon';
import { AppointmentStatusBadge } from './appointment-status-badge';
import type { Slot, Appointment } from '../hooks/use-agenda';

const STATUS_CARD_STYLES: Record<string, { border: string; bg: string; dot: string }> = {
  scheduled: {
    border: 'border-l-sky-500 border-sand-200/90',
    bg: 'bg-white hover:bg-sky-50/20',
    dot: 'bg-sky-500',
  },
  confirmed: {
    border: 'border-l-emerald-500 border-sand-200/90',
    bg: 'bg-white hover:bg-emerald-50/20',
    dot: 'bg-emerald-500',
  },
  arrived: {
    border: 'border-l-amber-500 border-amber-200',
    bg: 'bg-amber-50/50 hover:bg-amber-50/80',
    dot: 'bg-amber-500 animate-pulse',
  },
  in_progress: {
    border: 'border-l-terracotta-600 border-terracotta-200',
    bg: 'bg-terracotta-50/40 hover:bg-terracotta-50/70',
    dot: 'bg-terracotta-600 animate-pulse',
  },
  completed: {
    border: 'border-l-slate-300 border-sand-200',
    bg: 'bg-slate-50/60 hover:bg-slate-50 opacity-90',
    dot: 'bg-slate-400',
  },
  cancelled: {
    border: 'border-l-rose-400 border-rose-200/60',
    bg: 'bg-rose-50/30 hover:bg-rose-50/50 opacity-75',
    dot: 'bg-rose-400',
  },
  no_show: {
    border: 'border-l-rose-400 border-rose-200/60',
    bg: 'bg-rose-50/30 hover:bg-rose-50/50 opacity-75',
    dot: 'bg-rose-400',
  },
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
    <div className="bg-white rounded-2xl border border-sand-300/80 overflow-hidden shadow-xs">
      {/* Table header */}
      <div className="grid grid-cols-[80px_1fr] border-b border-sand-200 bg-sand-50/80 text-xs font-semibold text-slate-500">
        <div className="py-3 px-3.5 border-r border-sand-200 font-mono text-[11px] uppercase tracking-wider text-slate-400">
          Heure
        </div>
        <div className="py-3 px-4 flex items-center justify-between text-slate-700">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">Consultations du jour</span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-terracotta-100 text-terracotta-800">
              {dayAppointments.length} RDV{dayAppointments.length > 1 ? 's' : ''}
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-3 text-[11px] text-slate-500 font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Confirmé</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Salle d&apos;attente</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-300" />
              <span>Terminé</span>
            </span>
          </div>
        </div>
      </div>

      {/* Grid container with relative positioning for playhead */}
      <div className="relative divide-y divide-sand-100">
        {/* Live red/terracotta time playhead for Africa/Casablanca */}
        {playheadTopPercent !== null && (
          <div
            className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
            style={{ top: `${playheadTopPercent}%` }}
          >
            <div className="w-[80px] text-right pe-2.5">
              <span className="bg-terracotta-600 text-white font-mono text-[10px] px-1.5 py-0.5 rounded-md font-bold shadow-xs">
                {now.toFormat('HH:mm')}
              </span>
            </div>
            <div className="flex-1 h-0.5 bg-terracotta-500 relative shadow-xs">
              <span className="absolute -left-1 -top-1 w-2.5 h-2.5 rounded-full bg-terracotta-600 animate-ping" />
              <span className="absolute -left-1 -top-1 w-2.5 h-2.5 rounded-full bg-terracotta-600" />
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
              className="grid grid-cols-[80px_1fr] min-h-[64px] group hover:bg-sand-50/40 transition-colors"
            >
              {/* Hour Label */}
              <div className="py-3.5 px-3 border-r border-sand-200 font-mono text-xs font-semibold text-slate-400 tabular select-none flex items-start justify-center">
                {hour.toFormat('HH:mm')}
              </div>

              {/* Hour Content */}
              <div className="p-2 flex flex-col gap-2 justify-center relative">
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
                    className="w-full h-full min-h-[48px] rounded-xl border border-dashed border-sand-200/80 hover:border-terracotta-400/80 hover:bg-terracotta-50/30 flex items-center justify-between px-3 text-slate-400 text-xs transition-all cursor-pointer group-hover:text-terracotta-700"
                    aria-label="Créer un rendez-vous"
                  >
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity font-medium flex items-center gap-1.5">
                      <span className="text-terracotta-600 font-bold text-sm">+</span>
                      <span>Créneau disponible</span>
                    </span>
                    <span className="text-[10px] text-slate-300 font-mono opacity-0 group-hover:opacity-100">
                      {slotMinutes} min
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

                    const initials = appt.patient
                      ? `${appt.patient.first_name[0] || ''}${appt.patient.last_name[0] || ''}`.toUpperCase()
                      : 'P';

                    const style = STATUS_CARD_STYLES[appt.status] || STATUS_CARD_STYLES.scheduled;

                    return (
                      <button
                        key={appt.id}
                        type="button"
                        onClick={() => onAppointmentClick(appt)}
                        className={`w-full text-left rtl:text-right p-3 rounded-xl border-l-[5px] border transition-all cursor-pointer shadow-2xs hover:shadow-sm ${
                          style.border
                        } ${style.bg} ${
                          isSelected
                            ? 'ring-2 ring-terracotta-500/30 shadow-md bg-white border-terracotta-400'
                            : ''
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          {/* Left: Patient ID, Avatar and Time */}
                          <div className="flex items-center gap-2.5 min-w-0">
                            {/* Avatar Badge */}
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-terracotta-600 to-terracotta-800 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                              {initials}
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-xs text-slate-900 truncate">
                                  {patientTitle}
                                </span>
                                {appt.patient?.cin && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-sand-200/80 text-slate-700">
                                    {appt.patient.cin}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                                <span className="font-mono font-semibold text-slate-700">
                                  {startLocal.toFormat('HH:mm')} – {endLocal.toFormat('HH:mm')}
                                </span>
                                {appt.reason && (
                                  <>
                                    <span className="text-slate-300">•</span>
                                    <span className="truncate text-slate-600 max-w-[320px]">
                                      {appt.reason}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Right: Badges and Quick Indicators */}
                          <div className="flex items-center gap-2 shrink-0">
                            {appt.status === 'confirmed' && (
                              <span
                                className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs"
                                title="Confirmé via WhatsApp (1-Clic)"
                              >
                                <span>💬</span>
                                <span className="hidden md:inline font-mono">1-Clic</span>
                              </span>
                            )}
                            <AppointmentStatusBadge status={appt.status} />
                          </div>
                        </div>
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
