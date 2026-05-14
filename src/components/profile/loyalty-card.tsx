import { Flame, Gift, Sparkles } from 'lucide-react';
import type { LoyaltyReward } from '@/lib/gamification/loyalty-rewards';
import { LOYALTY_THRESHOLDS } from '@/lib/gamification/loyalty-rewards';
import { cn } from '@/lib/utils/cn';
import { loyaltyState, POINTS_PER_BOOKING } from '@/lib/utils/loyalty';

interface Props {
  points: number;
  /** Haftalık aktiflik serisi (streak_weeks) — 0 ise gösterilmez */
  streakWeeks?: number;
  /** Kazanılan otomatik kuponlar — son birkaçı küçük chip olarak gözükür */
  rewards?: LoyaltyReward[];
}

/**
 * Profil sayfası için loyalty kartı — emoji rozet + puan + sonraki tier'a
 * progress bar. Sıfır puanlıda dahi gösterilir (motivasyon).
 */
export function LoyaltyCard({ points, streakWeeks = 0, rewards = [] }: Props) {
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
          {streakWeeks > 0 ? (
            <p
              className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-0.5 text-[11px] font-medium text-rose-700 dark:text-rose-300"
              aria-label={`${streakWeeks} hafta art arda aktif`}
            >
              <Flame className="size-3 animate-pulse" aria-hidden="true" />
              {streakWeeks} hafta seri
            </p>
          ) : null}
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
        kazandırır. Belirli eşiklerde otomatik kupon kazanırsın.
      </p>

      {rewards.length > 0 ? (
        <div className="mt-4 border-t border-current/10 pt-3">
          <p className="mb-2 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide opacity-80">
            <Gift className="size-3" aria-hidden="true" />
            Kazandığın kuponlar
          </p>
          <ul className="flex flex-wrap gap-1.5">
            {rewards.map((r) => {
              const cfg = LOYALTY_THRESHOLDS.find((t) => t.threshold === r.threshold);
              return (
                <li
                  key={r.threshold}
                  className="inline-flex items-center gap-1 rounded-full border border-current/30 bg-current/5 px-2 py-0.5 text-[11px] font-mono"
                  title={`Kupon: ${r.couponCode}`}
                >
                  <span className="font-bold">{r.threshold}p</span>
                  <span className="opacity-60">→</span>
                  <span>%{cfg?.percent ?? '?'}</span>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
