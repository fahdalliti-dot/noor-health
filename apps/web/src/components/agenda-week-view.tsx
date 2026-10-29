import { useMemo } from 'react';
import { DateTime } from 'luxon';
import { AppointmentStatusBadge } from './appointment-status-badge';
import type { Slot, Appointment } from '../hooks/use-agenda';

const STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-gray-200',
  confirmed: 'bg-blue-200',
  arrived: 'bg-amber-200',
  in_progress: 'bg-green-200',
  completed: 'bg-emerald-200',
  cancelled: 'bg-red-200',
  no_show: 'bg-rose-200',
};

const DAY_NAMES = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

interface Props {
  weekStart: Date;
  timezone: string;
  slotMinutes: number;
  appointments: Appointment[];
  doctors: { id: string; full_name: string }[];
  onSlotClick: (doctorId: string, slot: Slot) => void;
  onAppointmentClick: (appt: Appointment) => void;
}

export function AgendaWeekView({
  weekStart,
  timezone,
  slotMinutes,
  appointments,
  doctors,
  onSlotClick,
  onAppointmentClick,
}: Props) {
  const tz = timezone || 'Africa/Casablanca';

  const days = useMemo(() => {
    const start = DateTime.fromJSDate(weekStart).setZone(tz).startOf('day');
    return Array.from({ length: 7 }).map((_, i) => start.plus({ days: i }));
  }, [weekStart, tz]);

  const hours = useMemo(() => {
    const first = days[0];
    const last = days[6].endOf('day');
    const rows: DateTime[] = [];
    let h = first;
    while (h < last) {
      rows.push(h);
      h = h.plus({ hours: 1 });
    }
    return rows;
  }, [days]);

  const placed = useMemo(() => {
    return appointments.map((a) => {
      const s = DateTime.fromISO(a.starts_at).setZone(tz);
      const e = DateTime.fromISO(a.ends_at).setZone(tz);
      const dayIndex = s.diff(days[0], 'days').days;
      const top = s.diff(s.startOf('hour'), 'minutes').as('minutes');
      const height = e.diff(s).as('minutes');
      return {
        a,
        dayIndex: Math.floor(dayIndex),
        top,
        height,
      };
    });
  }, [appointments, days, tz]);

  return (
    <div className="sheet-card shadow-sm overflow-hidden">
      <div
        className="grid"
        style={{ gridTemplateColumns: `60px repeat(${doctors.length}, 1fr)` }}
      >
        <div className="border-b border-r border-gray-200 bg-gray-50 p-2">
          <div className="text-xs font-semibold text-gray-500 uppercase">Heure</div>
        </div>
        {doctors.map((d) => (
          <div key={d.id} className="border-b border-gray-200 bg-gray-50 p-2">
            <div className="text-xs font-semibold text-gray-900 truncate">
              {d.full_name}
            </div>
            <div className="text-[10px] text-gray-500 truncate">{d.id.slice(0, 8)}</div>
          </div>
        ))}

        {hours.map((hour) => (
          <div key={hour.toISO()} className="contents">
            <div className="border-b border-r border-gray-200 px-2 py-2 text-xs text-gray-500">
              {hour.toFormat('HH:mm')}
            </div>
            {doctors.map((doctor) => {
              const cellStart = hour;
              const cellEnd = hour.plus({ hours: 1 });

              const appts = placed.filter(
                (p) =>
                  p.a.doctor_id === doctor.id &&
                  p.dayIndex >= 0 &&
                  p.dayIndex < 7 &&
                  p.top < 60 &&
                  p.top + p.height > 0 &&
                  DateTime.fromISO(p.a.starts_at).setZone(tz) < cellEnd &&
                  DateTime.fromISO(p.a.ends_at).setZone(tz) > cellStart,
              );

              return (
                <div
                  key={doctor.id}
                  className="relative border-b border-gray-200"
                  style={{ minHeight: '48px' }}
                >
                  {appts.map((p) => {
                    const topPct = (p.top % 60) / 60;
                    const heightPct = p.height / 60;
                    return (
                      <button
                        key={p.a.id}
                        type="button"
                        onClick={() => onAppointmentClick(p.a)}
                        className="absolute left-0.5 right-0.5 rounded-md border border-gray-300 bg-white px-2 py-1 text-left hover:shadow-md transition-shadow overflow-hidden"
                        style={{
                          top: `${topPct * 100}%`,
                          height: `${Math.max(heightPct * 100, 16)}%`,
                        }}
                      >
                        <div className="flex items-center gap-1">
                          <span
                            className={`inline-block w-2 h-2 rounded-full ${STATUS_COLORS[p.a.status] || 'bg-gray-200'}`}
                          />
                          <span className="text-xs font-medium text-gray-900 truncate">
                            {DateTime.fromISO(p.a.starts_at).setZone(tz).toFormat('HH:mm')} –{' '}
                            {DateTime.fromISO(p.a.ends_at).setZone(tz).toFormat('HH:mm')}
                          </span>
                        </div>
                        <div className="text-[11px] text-gray-600 truncate">
                          {p.a.reason || '—'}
                        </div>
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() =>
                      onSlotClick(doctor.id, {
                        start: cellStart.toISO()!,
                        end: cellEnd.toISO()!,
                        available: true,
                      })
                    }
                    className="absolute inset-0 hover:bg-terracotta-50 transition-colors"
                    aria-label={`Créer un rendez-vous pour ${doctor.full_name} à ${hour.toFormat('HH:mm')}`}
                  />
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}