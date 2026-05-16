import Link from 'next/link';
import Image from 'next/image';
import {
  Calendar,
  Clock,
  Coffee,
  MapPin,
  Mountain,
  PencilLine,
  Plane,
  Sparkles,
  Utensils,
  Waves,
  Wand2,
} from 'lucide-react';
import type { TravelDayPlan } from '@/lib/ai/travel-day-plan';
import type { DealWithMerchant } from '@/lib/db/queries/deals';
import { BLUR_DATA_URL } from '@/lib/utils/blur';
import { cn } from '@/lib/utils/cn';
import { formatTRY } from '@/lib/utils/format';

interface Props {
  plan: TravelDayPlan;
  destination: string;
  nights: number;
  travelers: { adults: number; kids: number };
  inventory: DealWithMerchant[];
}

const KIND_ICON = {
  yemek: Utensils,
  aktivite: Mountain,
  gezi: MapPin,
  dinlence: Waves,
  ulasim: Plane,
  oda: Coffee,
} as const;

const KIND_ACCENT = {
  yemek: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
  aktivite: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  gezi: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30',
  dinlence: 'bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30',
  ulasim: 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30',
  oda: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
} as const;

const KIND_LABEL = {
  yemek: 'Yemek',
  aktivite: 'Aktivite',
  gezi: 'Gezi',
  dinlence: 'Dinlence',
  ulasim: 'Ulaşım',
  oda: 'Konaklama',
} as const;

/**
 * AI tarafından üretilen plan'ı görsel timeline olarak göster.
 * Saat saat aktiviteler, gerçek deal'lara link, toplam tahmini maliyet.
 */
export function TravelPlanResult({
  plan,
  destination,
  nights,
  travelers,
  inventory,
}: Props) {
  // Slug → Deal lookup, plan'da slug verilen aktiviteleri zenginleştir
  const dealBySlug = new Map(inventory.map((d) => [d.slug, d]));

  return (
    <article className="mx-auto max-w-4xl">
      <Link
        href="/tatil/plan"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
      >
        <PencilLine className="size-3.5" aria-hidden="true" />
        Tercihleri değiştir
      </Link>

      {/* Hero: özet */}
      <header className="mt-4 mb-8">
        <p className="text-sky-700 dark:text-sky-300 inline-flex items-center gap-1.5 text-xs font-bold tracking-widest uppercase">
          <Sparkles className="size-3.5" aria-hidden="true" />
          AI Tatil Planı
        </p>
        <h1 className="mt-2 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
          {destination} · {nights} gece
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {travelers.adults} yetişkin
          {travelers.kids > 0 ? ` + ${travelers.kids} çocuk` : ''} ·{' '}
          <span className="text-foreground font-semibold tabular-nums">
            {plan.days.length} günlük plan
          </span>
          {plan.totalEstimate > 0 ? (
            <>
              {' '}·{' '}
              <span className="text-foreground font-semibold tabular-nums">
                ~ {formatTRY(plan.totalEstimate)}
              </span>{' '}
              tahmini
            </>
          ) : null}
        </p>

        {/* AI özet kartı */}
        <div className="from-sky-500/10 via-background to-cyan-500/5 border-sky-500/30 mt-4 overflow-hidden rounded-2xl border bg-gradient-to-br p-5">
          <div className="flex items-start gap-3">
            <span className="from-sky-600 via-cyan-500 to-teal-400 inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br shadow-md">
              <Wand2 className="size-5 text-white" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-widest text-sky-700 dark:text-sky-300">
                AI özeti
              </p>
              <p className="text-foreground/90 mt-1 text-sm leading-relaxed sm:text-base">
                {plan.summary}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Günler */}
      <ol className="relative space-y-8 border-l-2 border-dashed border-[var(--border)] pl-6">
        {plan.days.map((day, di) => (
          <li key={day.dayIndex} className="relative">
            <span
              aria-hidden="true"
              className="bg-foreground text-background border-background absolute -left-[34px] top-0 inline-flex size-7 items-center justify-center rounded-full border-2 text-xs font-bold shadow-sm"
            >
              {day.dayIndex}
            </span>

            <header className="mb-3 flex items-baseline justify-between gap-3">
              <h2 className="text-lg font-bold tracking-tight sm:text-xl">{day.dayLabel}</h2>
              <p className="text-muted-foreground inline-flex items-center gap-1 text-xs">
                <Calendar className="size-3" aria-hidden="true" />
                {day.activities.length} aktivite
              </p>
            </header>

            <ul className="space-y-2.5">
              {day.activities.map((a, ai) => {
                const Icon = KIND_ICON[a.kind];
                const accent = KIND_ACCENT[a.kind];
                const deal = a.dealSlug ? dealBySlug.get(a.dealSlug) : null;
                return (
                  <li
                    key={ai}
                    className="border-border bg-background flex gap-3 rounded-xl border p-3 shadow-sm sm:p-4"
                  >
                    {/* Saat sütun */}
                    <div className="border-border w-16 shrink-0 border-r pr-3">
                      <p className="text-foreground inline-flex items-center gap-1 text-sm font-bold tabular-nums">
                        <Clock className="size-3 text-muted-foreground" aria-hidden="true" />
                        {a.time}
                      </p>
                      {a.durationMin > 0 ? (
                        <p className="text-muted-foreground mt-0.5 text-[10px]">
                          {a.durationMin >= 60
                            ? `${Math.round(a.durationMin / 60)}sa${a.durationMin % 60 ? ` ${a.durationMin % 60}dk` : ''}`
                            : `${a.durationMin}dk`}
                        </p>
                      ) : null}
                    </div>

                    {/* İçerik */}
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-1.5">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold',
                            accent,
                          )}
                        >
                          <Icon className="size-3" aria-hidden="true" />
                          {KIND_LABEL[a.kind]}
                        </span>
                        {a.costEstimate > 0 ? (
                          <span className="text-muted-foreground inline-flex items-center text-[10px] tabular-nums">
                            ~ {formatTRY(a.costEstimate)}
                          </span>
                        ) : null}
                      </div>

                      <p className="text-foreground text-sm font-semibold leading-snug">
                        {a.title}
                      </p>
                      <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                        {a.rationale}
                      </p>

                      {deal ? (
                        <Link
                          href={`/f/${deal.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:bg-muted mt-2 inline-flex items-center gap-2 rounded-md border border-border bg-muted/30 p-2 transition-colors"
                        >
                          <Image
                            src={deal.cover_image}
                            alt={deal.title}
                            width={56}
                            height={42}
                            className="aspect-[4/3] size-12 rounded object-cover"
                            placeholder="blur"
                            blurDataURL={BLUR_DATA_URL}
                          />
                          <span className="min-w-0">
                            <span className="text-[10px] text-sky-700 dark:text-sky-300 block">
                              gidek fırsatı
                            </span>
                            <span className="text-foreground line-clamp-1 text-xs font-semibold">
                              {deal.title}
                            </span>
                          </span>
                        </Link>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>

            {di < plan.days.length - 1 ? <div className="h-2" /> : null}
          </li>
        ))}
      </ol>

      {/* Footer CTA */}
      <footer className="border-border mt-12 flex flex-col items-center gap-3 border-t pt-8 text-center">
        <p className="text-muted-foreground text-sm">
          Plan beğenmediysen — kriterleri değiştirip yeniden AI plan kur.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Link
            href="/tatil/plan"
            className="border-border hover:bg-muted inline-flex h-10 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold transition-colors"
          >
            <PencilLine className="size-3.5" aria-hidden="true" />
            Yeni plan kur
          </Link>
          <Link
            href={`/tatil/ara?dest=${encodeURIComponent(destination)}`}
            className="from-sky-600 to-cyan-500 inline-flex h-10 items-center gap-1.5 rounded-full bg-gradient-to-r px-4 text-sm font-bold text-white shadow-sm"
          >
            <MapPin className="size-3.5" aria-hidden="true" />
            {destination} otelleri
          </Link>
        </div>
      </footer>
    </article>
  );
}
