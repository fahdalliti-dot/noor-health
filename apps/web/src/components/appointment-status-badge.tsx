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
  scheduled: 'bg-gray-100 text-gray-700',
  confirmed: 'bg-blue-100 text-blue-700',
  arrived: 'bg-amber-100 text-amber-700',
  in_progress: 'bg-green-100 text-green-700',
  completed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
  no_show: 'bg-rose-100 text-rose-700',
};

export function AppointmentStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold',
        STATUS_CLASSES[status] || 'bg-gray-100 text-gray-700',
      )}
    >
      {STATUS_LABELS[status] || status}
    </span>
  );
}