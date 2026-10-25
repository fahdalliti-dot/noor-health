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

interface Props {
  date: Date;
  timezone: string;
  slotMinutes: number;
  appointments: Appointment[];
  onSlotClick: (slot: Slot) => void;
  onAppointmentClick: (appt: Appointment) => void;
  doctorId?: string;
}

export function AgendaDayView({
  date,
  timezone,
  slotMinutes,
  appointments,
  onSlotClick,
  onAppointmentClick,
  doctorId,
}: Props) {
  const tz = timezone || 'Africa/Casablanca';

  const dayStart = DateTime.fromJSDate(date).setZone(tz).startOf('day');
  const dayEnd = dayStart.endOf('day');

  // Build a list of hour rows from 00:00 to 23:00.
  const hours = useMemo(() => {
    const rows: DateTime[] = [];
    let h = dayStart;
    while (h < dayEnd) {
      rows.push(h);
      h = h.plus({ hours: 1 });
    }
    return rows;
  }, [dayStart, dayEnd]);

  // Map appointments to their column + pixel position.
  const placed = useMemo(() => {
    const list = appointments
      .filter((a) => {
        const s = DateTime.fromISO(a.starts_at).setZone(tz);
        const e = DateTime.fromISO(a.ends_at).setZone(tz);
        return s < dayEnd && e > dayStart;
      })
      .map((a) => {
        const s = DateTime.fromISO(a.starts_at).setZone(tz);
        const e = DateTime.fromISO(a.ends_at).setZone(tz);
        const top = Math.max(0, s.diff(dayStart).as('minutes'));
        const height = Math.max(1, e.diff(s).as('minutes'));
        return { a, top, height };
      })
      .sort((x, y) => x.top - y.top);

    // Simple column assignment: each overlapping appointment gets its own column.
    const columns: { a: Appointment; top: number; height: number; col: number }[] = [];
    for (const item of list) {
      let col = 0;
      while (true) {
        const clash = columns.find(
          (c) =>
            c.col === col &&
            item.top < c.top + c.height &&
            c.top < item.top + item.height,
        );
        if (!clash) break;
        col++;
      }
      columns.push({ ...item, col });
    }
    return columns;
  }, [appointments, dayStart, dayEnd, tz]);

  const totalCols = useMemo(
    () => Math.max(1, ...placed.map((p) => p.col + 1)),
    [placed],
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="grid" style={{ gridTemplateColumns: `80px repeat(${totalCols}, 1fr)` }}>
        <div className="border-b border-r border-gray-200 bg-gray-50 p-2">
          <div className="text-xs font-semibold text-gray-500 uppercase">Heure</div>
        </div>
        {Array.from({ length: totalCols }).map((_, i) => (
          <div key={i} className="border-b border-gray-200 bg-gray-50 p-2 text-xs text-gray-500">
            {doctorId ? 'Médecin' : `Colonne ${i + 1}`}
          </div>
        ))}

        {hours.map((hour) => (
          <div key={hour.toISO()} className="contents">
            <div className="border-b border-r border-gray-200 px-2 py-2 text-xs text-gray-500">
              {hour.toFormat('HH:mm')}
            </div>
            {Array.from({ length: totalCols }).map((_, col) => {
              const cellStart = hour;
              const cellEnd = hour.plus({ hours: 1 });

              const appts = placed.filter(
                (p) =>
                  p.col === col &&
                  DateTime.fromISO(p.a.starts_at).setZone(tz) < cellEnd &&
                  DateTime.fromISO(p.a.ends_at).setZone(tz) > cellStart,
              );

              return (
                <div
                  key={col}
                  className="relative border-b border-gray-200"
                  style={{ minHeight: '60px' }}
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
                          height: `${Math.max(heightPct * 100, 18)}%`,
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
                        <div className="text-xs text-gray-600 truncate">
                          {p.a.reason || '—'}
                        </div>
                      </button>
                    );
                  })}

                  {/* Empty-slot click target: only show on the first column if doctor view */}
                  {col === 0 && appts.length === 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        onSlotClick({
                          start: cellStart.toISO()!,
                          end: cellEnd.toISO()!,
                          available: true,
                        })
                      }
                      className="absolute inset-0 hover:bg-blue-50 transition-colors"
                      aria-label={`Créer un rendez-vous à ${hour.toFormat('HH:mm')}`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}