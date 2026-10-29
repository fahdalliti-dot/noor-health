import { cn } from '@/lib/utils';

const STATUS_LABELS: Record<string, string> = {
  scheduled: 'En attente',
  confirmed: 'Confirmé',
  arrived: 'Arrivé',
  in_progress: 'En cours',
  completed: 'Terminé',
  cancelled: 'Annulé',
  no_show: 'Absent',
};

const STATUS_CLASSES: Record<string, string> = {
  scheduled: 'bg-gray-100 text-gray-700 border-gray-200',
  confirmed: 'bg-terracotta-50 text-terracotta-700 border-terracotta-200',
  arrived: 'bg-amber-50 text-amber-800 border-amber-200',
  in_progress: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  completed: 'bg-slate-100 text-slate-700 border-slate-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
  no_show: 'bg-rose-50 text-rose-700 border-rose-200',
};

const STATUS_DOTS: Record<string, string> = {
  scheduled: 'bg-gray-400',
  confirmed: 'bg-terracotta-500',
  arrived: 'bg-amber-500',
  in_progress: 'bg-emerald-500 animate-pulse',
  completed: 'bg-slate-500',
  cancelled: 'bg-red-500',
  no_show: 'bg-rose-500',
};

export function AppointmentStatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border',
        STATUS_CLASSES[status] || 'bg-gray-100 text-gray-700 border-gray-200',
        className,
      )}
    >
      <span
        className={cn(
          'w-1.5 h-1.5 rounded-full shrink-0',
          STATUS_DOTS[status] || 'bg-gray-400',
        )}
        aria-hidden="true"
      />
      <span>{STATUS_LABELS[status] || status}</span>
    </span>
  );
}

export default AppointmentStatusBadge;
