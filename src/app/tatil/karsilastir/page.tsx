import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle2,
  GitCompare,
  Sparkles,
  Star,
  XCircle,
} from 'lucide-react';
import { compareHotelsWithAI } from '@/lib/ai/travel-comparison';
import { Container } from '@/components/ui/container';
import { getServiceClient } from '@/lib/db/service';
import type { DealWithMerchant } from '@/lib/db/queries/deals';
import {
  CONCEPT_ACCENT,
  CONCEPT_LABEL,
  enrichTravelDeal,
  FEATURE_LABEL,
} from '@/lib/travel/enrich';
import { BLUR_DATA_URL } from '@/lib/utils/blur';
import { cn } from '@/lib/utils/cn';
import { formatTRY } from '@/lib/utils/format';

export const metadata: Metadata = {
  title: 'Karşılaştır · gidek Tatil',
  description: 'AI ile 2-3 tatil paketini yan yana karşılaştır.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ ids?: string }>;
}

async function fetchDeals(ids: string[]): Promise<DealWithMerchant[]> {
  if (ids.length === 0) return [];
  const supabase = getServiceClient();
  const { data } = await supabase
    .from('deals')
    .select(`*, merchant:merchants ( name, slug, city, district, lat, lng, working_hours )`)
    .in('id', ids);
  // ids sırasını koru
  const map = new Map((data ?? []).map((d) => [d.id, d as unknown as DealWithMerchant]));
  return ids.map((id) => map.get(id)).filter((d): d is DealWithMerchant => !!d);
}

export default async function CompareTravelPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const ids = (sp.ids ?? '').split(',').map((s) => s.trim()).filter(Boolean).slice(0, 3);

  if (ids.length < 2) notFound();

  const deals = await fetchDeals(ids);
  if (deals.length < 2) notFound();

  // AI yorumu — server-side, sayfa açılırken hesaplanır
  let ai: Awaited<ReturnType<typeof compareHotelsWithAI>> | null = null;
  let aiError: string | null = null;
  try {
    ai = await compareHotelsWithAI(deals);
  } catch (err) {
    aiError = err instanceof Error ? err.message : 'AI yorumu alınamadı';
  }

  // Tüm özelliklerin birleşik listesi — matris için
  const allFeatures = new Set<string>();
  for (const d of deals) {
    for (const f of enrichTravelDeal(d).features) allFeatures.add(f);
  }
  const featureList = [...allFeatures];

  const colsCls = deals.length === 2 ? 'lg:grid-cols-2' : 'lg:grid-cols-3';

  return (
    <Container className="py-8 sm:py-12">
      <Link
        href="/tatil/ara"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Aramaya dön
      </Link>

      <header className="mt-4 mb-6 flex flex-col gap-2">
        <p className="text-sky-700 dark:text-sky-300 inline-flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase">
          <GitCompare className="size-3.5" aria-hidden="true" />
          Karşılaştırma
        </p>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          <strong className="tabular-nums">{deals.length}</strong> tatil paketi yan yana
        </h1>
        <p className="text-muted-foreground text-sm">
          Yapay zeka her seçeneği kullanıcı kriterlerine göre yorumladı. Aşağıdaki tablo
          objektif özellikler; aşağıda AI değerlendirmesi.
        </p>
      </header>

      {/* AI yorum kartı */}
      <section className="from-sky-500/10 via-background to-cyan-500/5 border-sky-500/30 mb-8 overflow-hidden rounded-2xl border bg-gradient-to-br p-5 sm:p-6">
        <header className="mb-3 inline-flex items-center gap-2">
          <span className="from-sky-600 via-cyan-500 to-teal-400 inline-flex size-10 items-center justify-center rounded-full bg-gradient-to-br shadow-md">
            <Sparkles className="size-5 text-white" aria-hidden="true" />
          </span>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-sky-700 dark:text-sky-300">
              AI değerlendirmesi
            </p>
            <p className="text-muted-foreground text-xs">
              Gemini 2.5 Flash · spesifik artı/eksi analizi
            </p>
          </div>
        </header>

        {ai ? (
          <>
            <p className="text-foreground text-base leading-relaxed sm:text-lg">
              {ai.verdict}
            </p>
            <div className={cn('mt-5 grid gap-4', colsCls)}>
              {ai.hotels.map((h, idx) => {
                const deal = deals.find((d) => d.id === h.id);
                if (!deal) return null;
                return (
                  <article
                    key={h.id}
                    className="border-border bg-background/80 rounded-xl border p-4 backdrop-blur"
                  >
                    <header className="border-border mb-3 border-b pb-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Seçenek {idx + 1}
                      </p>
                      <p className="line-clamp-2 text-sm font-bold leading-snug">
                        {deal.title}
                      </p>
                      <p className="text-sky-700 dark:text-sky-300 mt-1 text-xs font-semibold">
                        {h.bestFor}
                      </p>
                    </header>

                    {h.pros.length > 0 ? (
                      <div className="mb-3">
                        <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                          Artılar
                        </p>
                        <ul className="space-y-1">
                          {h.pros.map((p, i) => (
                            <li key={i} className="text-foreground/90 flex items-start gap-1.5 text-xs leading-snug">
                              <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-500" aria-hidden="true" />
                              <span>{p}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    {h.cons.length > 0 ? (
                      <div>
                        <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-rose-700 dark:text-rose-400">
                          Dikkat
                        </p>
                        <ul className="space-y-1">
                          {h.cons.map((c, i) => (
                            <li key={i} className="text-foreground/90 flex items-start gap-1.5 text-xs leading-snug">
                              <XCircle className="mt-0.5 size-3.5 shrink-0 text-rose-500" aria-hidden="true" />
                              <span>{c}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </>
        ) : (
          <p className="text-muted-foreground text-sm italic">
            AI yorumu şu an alınamadı{aiError ? ` (${aiError})` : ''}. Aşağıdaki objektif
            karşılaştırma tablosunu inceleyebilirsin.
          </p>
        )}
      </section>

      {/* Objektif özellik matrisi */}
      <section className="mb-6">
        <h2 className="text-muted-foreground mb-3 text-xs font-bold tracking-wider uppercase">
          Yan yana karşılaştırma
        </h2>
        <div className={cn('grid gap-4', colsCls)}>
          {deals.map((d, idx) => {
            const meta = enrichTravelDeal(d);
            const price = Number(d.discounted_price);
            const original = Number(d.original_price);
            const discount = price < original ? Math.round((1 - price / original) * 100) : 0;
            const location = [d.district, d.city].filter(Boolean).join(', ');
            return (
              <article
                key={d.id}
                className="border-border bg-background flex flex-col overflow-hidden rounded-xl border shadow-sm"
              >
                {/* Görsel + konsept */}
                <div className="relative aspect-[16/10] overflow-hidden">
                  <Image
                    src={d.cover_image}
                    alt={d.title}
                    fill
                    sizes="(min-width:1024px) 33vw, 100vw"
                    className="object-cover"
                    placeholder="blur"
                    blurDataURL={BLUR_DATA_URL}
                    priority={idx < 2}
                  />
                  <span
                    className={cn(
                      'absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-gradient-to-r px-2.5 py-0.5 text-[11px] font-bold text-white shadow-md',
                      CONCEPT_ACCENT[meta.concept],
                    )}
                  >
                    {CONCEPT_LABEL[meta.concept]}
                  </span>
                  {discount > 0 ? (
                    <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-rose-600 px-2.5 py-0.5 text-[11px] font-bold text-white shadow-md">
                      %{discount}
                    </span>
                  ) : null}
                </div>

                {/* Bilgi */}
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <p className="text-muted-foreground text-[11px] uppercase tracking-wide">
                    {location || 'Türkiye'}
                  </p>
                  <h3 className="line-clamp-2 text-sm font-semibold leading-snug">{d.title}</h3>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: meta.stars }).map((_, i) => (
                      <Star
                        key={i}
                        className="size-3.5 fill-amber-500 text-amber-500"
                        aria-hidden="true"
                      />
                    ))}
                  </div>

                  {/* Özellik checkbox matrisi */}
                  <ul className="mt-2 space-y-1">
                    {featureList.map((f) => {
                      const has = meta.features.includes(f as typeof meta.features[number]);
                      return (
                        <li
                          key={f}
                          className={cn(
                            'flex items-center gap-1.5 text-xs',
                            !has && 'text-muted-foreground/50',
                          )}
                        >
                          {has ? (
                            <CheckCircle2 className="size-3.5 text-emerald-500" aria-hidden="true" />
                          ) : (
                            <XCircle className="size-3.5 text-muted-foreground/30" aria-hidden="true" />
                          )}
                          {FEATURE_LABEL[f as keyof typeof FEATURE_LABEL] ?? f}
                        </li>
                      );
                    })}
                  </ul>

                  <div className="border-border mt-auto border-t pt-3">
                    <p className="text-muted-foreground text-[11px]">
                      {meta.nights > 1 ? `${meta.nights} gece` : 'Konaklama'} · 2 yetişkin
                    </p>
                    {price < original ? (
                      <p className="text-muted-foreground text-[10px] line-through tabular-nums">
                        {formatTRY(original)}
                      </p>
                    ) : null}
                    <p className="text-lg font-bold tabular-nums">
                      {formatTRY(price)}
                      <span className="text-muted-foreground text-[10px] font-normal">
                        {' '}
                        kişi başı
                      </span>
                    </p>
                    <Link
                      href={`/f/${d.slug}`}
                      className="bg-foreground text-background hover:bg-foreground/90 mt-3 inline-flex h-9 w-full items-center justify-center rounded-md text-xs font-bold transition-colors"
                    >
                      Detayı gör
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </Container>
  );
}
