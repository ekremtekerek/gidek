import { Trophy } from 'lucide-react';
import type { BadgeRow } from '@/lib/gamification/badges';
import { cn } from '@/lib/utils/cn';

interface Props {
  badges: BadgeRow[];
  /** Kompakt mod — public profilde / kart altında kullanılır */
  compact?: boolean;
}

const TIER_RING = {
  bronze: 'ring-orange-500/40',
  silver: 'ring-slate-400/40',
  gold: 'ring-amber-500/50',
  platinum: 'ring-violet-500/50',
} as const;

const TIER_BG = {
  bronze: 'bg-gradient-to-br from-orange-500/15 to-amber-500/10',
  silver: 'bg-gradient-to-br from-slate-400/15 to-slate-300/10',
  gold: 'bg-gradient-to-br from-amber-500/20 to-yellow-400/15',
  platinum: 'bg-gradient-to-br from-violet-500/20 to-fuchsia-500/15',
} as const;

/**
 * Rozet vitrini — profil sayfasında kullanıcının kazandıkları parlak,
 * kazanılmayanlar greyscale + opaklık düşük. Hover'da tooltip ile detay.
 */
export function BadgesGrid({ badges, compact = false }: Props) {
  if (badges.length === 0) return null;

  const earnedCount = badges.filter((b) => b.earned).length;

  return (
    <section
      className={cn(
        'border-border bg-background rounded-xl border',
        compact ? 'p-4' : 'p-5 sm:p-6',
      )}
    >
      <header className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="inline-flex items-center gap-2 text-base font-semibold tracking-tight">
          <Trophy className="size-4 text-amber-500" aria-hidden="true" />
          Rozetler
          <span className="text-muted-foreground text-xs font-normal tabular-nums">
            {earnedCount} / {badges.length}
          </span>
        </h2>
      </header>

      <ul
        className={cn(
          'grid gap-2',
          compact
            ? 'grid-cols-6 sm:grid-cols-8'
            : 'grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7',
        )}
      >
        {badges.map((b) => (
          <li key={b.id} className="group/badge relative">
            <div
              className={cn(
                'flex aspect-square flex-col items-center justify-center rounded-xl text-center transition-all',
                'ring-1 ring-inset',
                b.earned
                  ? cn('ring-2', TIER_RING[b.tier], TIER_BG[b.tier], 'hover:-translate-y-0.5 hover:shadow-md')
                  : 'border-border bg-muted/30 opacity-50 grayscale',
              )}
              aria-label={`${b.name} — ${b.earned ? 'kazanıldı' : 'henüz kazanılmadı'}`}
            >
              <span
                className={cn(
                  'text-2xl sm:text-3xl',
                  !b.earned ? 'grayscale' : null,
                )}
                aria-hidden="true"
              >
                {b.emoji}
              </span>
              {!compact ? (
                <span className="text-foreground/80 mt-1 line-clamp-2 px-1 text-[10px] font-medium leading-tight">
                  {b.name}
                </span>
              ) : null}
            </div>

            {/* Tooltip — hover'da detay */}
            <span
              role="tooltip"
              className="bg-foreground text-background pointer-events-none absolute left-1/2 top-full z-20 mt-2 hidden w-44 -translate-x-1/2 rounded-md px-2.5 py-1.5 text-[11px] leading-snug shadow-xl group-hover/badge:block"
            >
              <span className="font-semibold">{b.name}</span>
              <br />
              <span className="opacity-80">{b.description}</span>
              {b.earned && b.earnedAt ? (
                <>
                  <br />
                  <span className="opacity-60 text-[10px]">
                    {new Date(b.earnedAt).toLocaleDateString('tr-TR', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </>
              ) : null}
              <span
                aria-hidden="true"
                className="bg-foreground absolute -top-1 left-1/2 size-2 -translate-x-1/2 rotate-45"
              />
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
