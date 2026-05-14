import { Activity } from 'lucide-react';
import { getServiceClient } from '@/lib/db/service';

interface Props {
  dealId: string;
}

/**
 * Walk-in baskı göstergesi — bu fırsata bugün ve son 1 saatte yapılmış
 * onaylanmış rezervasyon sayısını gösterir. "Şu an popüler" sinyali.
 *
 * 0 ise hiç gösterilmez (gürültü yapmasın).
 */
export async function WalkInPressure({ dealId }: Props) {
  const supabase = getServiceClient();

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  const [{ count: todayCount }, { count: hourCount }] = await Promise.all([
    supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('deal_id', dealId)
      .in('status', ['confirmed', 'used'])
      .gte('created_at', todayStart.toISOString()),
    supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('deal_id', dealId)
      .in('status', ['confirmed', 'used'])
      .gte('created_at', hourAgo.toISOString()),
  ]);

  const today = todayCount ?? 0;
  const lastHour = hourCount ?? 0;
  if (today === 0) return null;

  const intensity: 'low' | 'mid' | 'high' =
    lastHour >= 3 ? 'high' : lastHour >= 1 ? 'mid' : 'low';

  const accent =
    intensity === 'high'
      ? 'border-rose-500/30 bg-rose-500/10 text-rose-800 dark:text-rose-200'
      : intensity === 'mid'
        ? 'border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200'
        : 'border-sky-500/30 bg-sky-500/10 text-sky-800 dark:text-sky-200';

  const label =
    intensity === 'high'
      ? 'Şu an çok hareketli'
      : intensity === 'mid'
        ? 'Bu saatte popüler'
        : 'Bugün ilgi görüyor';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${accent}`}
    >
      <Activity
        className={
          intensity === 'high'
            ? 'size-3 animate-pulse'
            : 'size-3'
        }
        aria-hidden="true"
      />
      {label} · bugün {today}
    </span>
  );
}
