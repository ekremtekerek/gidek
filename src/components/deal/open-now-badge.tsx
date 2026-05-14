import { Clock } from 'lucide-react';
import { isOpenNow, todaySummary, type WorkingHours } from '@/lib/utils/working-hours';

interface Props {
  hours: WorkingHours;
}

/**
 * "Şu an açık" / "Şu an kapalı" rozeti. working_hours yoksa hiç render edilmez.
 */
export function OpenNowBadge({ hours }: Props) {
  const open = isOpenNow(hours);
  if (open === null) return null;
  const today = todaySummary(hours);

  return (
    <span
      className={
        open
          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium'
          : 'border-rose-500/30 bg-rose-500/10 text-rose-800 dark:text-rose-200 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium'
      }
    >
      <span
        aria-hidden="true"
        className={
          open
            ? 'bg-emerald-500 inline-block size-1.5 animate-pulse rounded-full'
            : 'bg-rose-500 inline-block size-1.5 rounded-full'
        }
      />
      <Clock className="size-3" aria-hidden="true" />
      {open ? `Şu an açık · bugün ${today}` : `Şu an kapalı${today ? ` · bugün ${today}` : ''}`}
    </span>
  );
}
