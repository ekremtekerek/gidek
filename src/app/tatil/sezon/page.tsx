import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowLeft,
  CalendarRange,
  Coins,
  PartyPopper,
  Sparkles,
  Sun,
  Users,
  Wand2,
} from 'lucide-react';
import { TravelSeasonForm } from '@/components/travel/travel-season-form';
import { Container } from '@/components/ui/container';
import { generateSeasonAdvice } from '@/lib/ai/travel-season-advice';
import { listTravelLocations } from '@/lib/db/queries/travel';
import { cn } from '@/lib/utils/cn';
import { SITE } from '@/lib/utils/site-config';

export const metadata: Metadata = {
  title: 'AI Sezon Tavsiyesi · gidek Tatil',
  description:
    'Hangi ayda gitmek daha iyi? AI fiyat trendi, hava, kalabalık ve bayramları analiz eder.',
  alternates: { canonical: '/tatil/sezon' },
  openGraph: {
    title: 'gidek AI Sezon Tavsiyesi',
    description: 'Eylül mü Ekim mi? AI cevaplasın.',
    url: `${SITE.url}/tatil/sezon`,
  },
};

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ dest?: string }>;
}

const CROWD_LABEL = {
  sakin: 'Sakin',
  orta: 'Orta',
  kalabalik: 'Kalabalık',
} as const;

const CROWD_ACCENT = {
  sakin: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  orta: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
  kalabalik: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
} as const;

const PRICE_LABEL = {
  ucuz: 'Ucuz',
  orta: 'Orta',
  pahali: 'Pahalı',
} as const;

const PRICE_ACCENT = {
  ucuz: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  orta: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
  pahali: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
} as const;

export default async function TatilSezonPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const dest = sp.dest?.trim();
  const locations = await listTravelLocations();

  if (!dest) {
    return (
      <Container className="py-10 sm:py-14">
        <Link
          href="/tatil"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Tatil ana sayfa
        </Link>

        <header className="mt-4 mb-8 text-center">
          <span className="bg-gradient-to-br from-amber-500 to-orange-500 inline-flex size-14 items-center justify-center rounded-full shadow-lg">
            <CalendarRange className="size-7 text-white" aria-hidden="true" />
          </span>
          <p className="text-amber-700 dark:text-amber-300 mt-3 inline-flex items-center gap-1.5 text-xs font-bold tracking-widest uppercase">
            <Sparkles className="size-3.5" aria-hidden="true" />
            AI Sezon Tavsiyesi
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Hangi ayda gitmek daha{' '}
            <span className="bg-gradient-to-r from-amber-600 to-orange-500 bg-clip-text text-transparent">
              akıllıca
            </span>
            ?
          </h1>
          <p className="text-muted-foreground mx-auto mt-3 max-w-xl text-sm leading-relaxed sm:text-base">
            Eylül mü Ekim mi? AI; fiyat trendi, hava, kalabalık, tatil günleri ve festivalleri
            birlikte değerlendirir. <strong>Rakiplerde olmayan bir analiz.</strong>
          </p>
        </header>

        <div className="mx-auto max-w-xl">
          <TravelSeasonForm locations={locations} />
        </div>
      </Container>
    );
  }

  let advice: Awaited<ReturnType<typeof generateSeasonAdvice>>;
  try {
    advice = await generateSeasonAdvice(dest);
  } catch (err) {
    return (
      <Container className="py-12 sm:py-16">
        <Link
          href="/tatil/sezon"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Yeniden seç
        </Link>
        <div className="mt-6 rounded-xl border border-rose-500/30 bg-rose-50 p-6 text-rose-900 dark:bg-rose-950/30 dark:text-rose-100">
          <p className="font-bold">AI tavsiye alınamadı</p>
          <p className="mt-1 text-sm">
            {err instanceof Error ? err.message : 'Bilinmeyen hata'}
          </p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-8 sm:py-12">
      <article className="mx-auto max-w-4xl">
        <Link
          href="/tatil/sezon"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Başka destinasyon
        </Link>

        <header className="mt-4 mb-6">
          <p className="text-amber-700 dark:text-amber-300 inline-flex items-center gap-1.5 text-xs font-bold tracking-widest uppercase">
            <Sparkles className="size-3.5" aria-hidden="true" />
            AI Sezon Tavsiyesi
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-4xl">
            {dest}{' '}
            <span className="text-muted-foreground font-medium">— en iyi aylar</span>
          </h1>
        </header>

        {/* AI özet */}
        <section className="from-amber-500/10 via-background to-orange-500/5 border-amber-500/30 mb-8 overflow-hidden rounded-2xl border bg-gradient-to-br p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="from-amber-500 to-orange-500 inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br shadow-md">
              <Wand2 className="size-5 text-white" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-widest text-amber-700 dark:text-amber-300">
                AI değerlendirmesi
              </p>
              <p className="text-foreground/90 mt-1 text-sm leading-relaxed sm:text-base">
                {advice.summary}
              </p>
            </div>
          </div>
        </section>

        {/* En iyi aylar */}
        <section className="mb-8">
          <h2 className="text-muted-foreground mb-3 text-xs font-bold uppercase tracking-wider">
            🏆 En iyi {advice.bestMonths.length} ay
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {advice.bestMonths.map((m, idx) => (
              <li key={m.month}>
                <article className="border-border bg-background h-full rounded-xl border p-4 shadow-sm">
                  <header className="flex items-baseline justify-between gap-2">
                    <h3 className="text-lg font-bold">
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'} {m.month}
                    </h3>
                    <span className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-bold tabular-nums">
                      {m.score}/10
                    </span>
                  </header>

                  <p className="text-foreground/85 mt-2 text-sm leading-snug">{m.why}</p>

                  <ul className="mt-3 space-y-1.5">
                    <li className="text-muted-foreground inline-flex items-start gap-1.5 text-xs">
                      <Sun className="mt-0.5 size-3 shrink-0 text-amber-500" aria-hidden="true" />
                      <span>{m.weather}</span>
                    </li>
                    <li className="text-xs">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium',
                          CROWD_ACCENT[m.crowd],
                        )}
                      >
                        <Users className="size-3" aria-hidden="true" />
                        {CROWD_LABEL[m.crowd]}
                      </span>
                      <span
                        className={cn(
                          'ml-1.5 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium',
                          PRICE_ACCENT[m.priceLevel],
                        )}
                      >
                        <Coins className="size-3" aria-hidden="true" />
                        {PRICE_LABEL[m.priceLevel]}
                      </span>
                    </li>
                  </ul>
                </article>
              </li>
            ))}
          </ul>
        </section>

        {/* Avoid + Events */}
        <section className="mb-8 grid gap-4 sm:grid-cols-2">
          {advice.avoidMonths.length > 0 ? (
            <div className="border-rose-500/30 bg-rose-500/5 rounded-xl border p-4">
              <h3 className="text-rose-700 dark:text-rose-300 mb-2 text-xs font-bold uppercase tracking-wider">
                ⚠ Kaçın
              </h3>
              <ul className="space-y-2">
                {advice.avoidMonths.map((a) => (
                  <li key={a.month} className="text-xs">
                    <p className="text-foreground font-semibold">{a.month}</p>
                    <p className="text-muted-foreground mt-0.5">{a.reason}</p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {advice.events.length > 0 ? (
            <div className="border-sky-500/30 bg-sky-500/5 rounded-xl border p-4">
              <h3 className="text-sky-700 dark:text-sky-300 mb-2 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider">
                <PartyPopper className="size-3" aria-hidden="true" />
                Özel tarihler
              </h3>
              <ul className="space-y-2">
                {advice.events.map((ev) => (
                  <li key={ev.name} className="text-xs">
                    <p className="text-foreground font-semibold">
                      {ev.name}{' '}
                      <span className="text-muted-foreground font-normal">· {ev.date}</span>
                    </p>
                    <p className="text-muted-foreground mt-0.5">{ev.impact}</p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>

        {/* CTA — plan kur */}
        <footer className="border-border mt-12 flex flex-wrap items-center justify-center gap-3 border-t pt-8">
          <Link
            href={`/tatil/plan?dest=${encodeURIComponent(dest)}`}
            className="from-sky-600 to-cyan-500 inline-flex h-11 items-center gap-2 rounded-full bg-gradient-to-r px-5 text-sm font-bold text-white shadow-md transition-all hover:scale-105"
          >
            <Wand2 className="size-4" aria-hidden="true" />
            {dest} için AI plan kur
          </Link>
          <Link
            href={`/tatil/ara?dest=${encodeURIComponent(dest)}`}
            className="border-border hover:bg-muted inline-flex h-11 items-center gap-2 rounded-full border px-5 text-sm font-semibold transition-colors"
          >
            Oteller
          </Link>
        </footer>
      </article>
    </Container>
  );
}
