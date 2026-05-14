import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { loyaltyState, POINTS_PER_BOOKING } from '@/lib/utils/loyalty';

interface Props {
  points: number;
}

/**
 * Profil sayfası için loyalty kartı — emoji rozet + puan + sonraki tier'a
 * progress bar. Sıfır puanlıda dahi gösterilir (motivasyon).
 */
export function LoyaltyCard({ points }: Props) {
  const s = loyaltyState(points);

  const accent =
    s.tier === 'gold'
      ? 'from-amber-500/15 via-background to-background border-amber-500/30 text-amber-700 dark:text-amber-300'
      : s.tier === 'silver'
        ? 'from-slate-500/15 via-background to-background border-slate-500/30 text-slate-700 dark:text-slate-200'
        : 'from-orange-500/10 via-background to-background border-orange-500/30 text-orange-700 dark:text-orange-300';

  // Progress: mevcut tier min'inden sonraki tier min'ine kadar
  let progressPct = 100;
  if (s.nextTierMin !== null) {
    const span = s.nextTierMin - s.currentTierMin;
    const inTier = s.points - s.currentTierMin;
    progressPct = Math.min(100, Math.max(0, Math.round((inTier / span) * 100)));
  }

  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-xl border bg-gradient-to-br p-5 sm:p-6',
        accent,
      )}
    >
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            gidek loyalty
          </p>
          <p className="mt-1 inline-flex items-baseline gap-2 text-2xl font-semibold tracking-tight">
            <span aria-hidden="true">{s.emoji}</span>
            <span>{s.label}</span>
            <span className="text-foreground/60 ms-1 text-base font-normal">üye</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold tabular-nums">{s.points}</p>
          <p className="text-muted-foreground text-[11px]">puan</p>
        </div>
      </header>

      {s.nextTierMin !== null ? (
        <div className="mt-4">
          <div className="flex items-baseline justify-between text-[11px]">
            <span className="text-muted-foreground">
              {s.pointsToNext} puan kaldı
            </span>
            <span className="text-foreground/70 font-medium">
              {s.points} / {s.nextTierMin}
            </span>
          </div>
          <div className="bg-muted mt-1.5 h-2 overflow-hidden rounded-full">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                s.tier === 'silver' ? 'bg-slate-500' : 'bg-orange-500',
              )}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      ) : (
        <p className="mt-3 inline-flex items-center gap-1.5 text-xs">
          <Sparkles className="size-3" aria-hidden="true" />
          En üst seviyedeysin — burdan ileri sadece daha çok deneyim.
        </p>
      )}

      <p className="text-muted-foreground mt-4 text-[11px] leading-relaxed">
        Her tamamlanmış rezervasyon <strong className="text-foreground">+{POINTS_PER_BOOKING}</strong> puan
        kazandırır. Gümüş ve Altın üyelere yakında özel kampanyalar.
      </p>
    </section>
  );
}
