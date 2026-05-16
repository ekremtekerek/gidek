import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Sparkles, Star } from 'lucide-react';
import { BLUR_DATA_URL } from '@/lib/utils/blur';
import { formatTRY } from '@/lib/utils/format';
import {
  enrichSimilarDeals,
  fetchSimilarTravelDeals,
} from '@/lib/ai/similar-travel-deals';

/**
 * Tatil detayda "Buna benzer tatiller" bölümü. pgvector cosine
 * similarity ile öneri. Rakiplerde "popüler", "yakındaki" var ama
 * AI embedding tabanlı benzerlik yok.
 *
 * Server component — RSC içinde async data fetch.
 */
export async function SimilarTravelDealsSection({ dealId }: { dealId: string }) {
  const matches = await fetchSimilarTravelDeals(dealId, 6);
  if (matches.length === 0) return null;

  const enriched = await enrichSimilarDeals(matches);
  if (enriched.length === 0) return null;

  return (
    <section className="space-y-4">
      <header>
        <p className="text-sky-700 dark:text-sky-300 inline-flex items-center gap-1.5 text-xs font-bold tracking-widest uppercase">
          <Sparkles className="size-3.5" aria-hidden="true" />
          AI farkımız · embedding similarity
        </p>
        <h2 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">
          Bunu beğendiysen şunlar da hoşuna gider
        </h2>
        <p className="text-muted-foreground mt-0.5 text-sm">
          Yapay zeka, otelin atmosferine + konseptine en benzer{' '}
          {enriched.length} fırsat seçti.
        </p>
      </header>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
        {enriched.map((d, idx) => {
          const showDiscount = Number(d.discounted_price) < Number(d.original_price);
          const discount = showDiscount
            ? Math.round((1 - Number(d.discounted_price) / Number(d.original_price)) * 100)
            : 0;
          const location = [d.district, d.city].filter(Boolean).join(', ');
          const similarity = Math.round((matches[idx]?.similarity ?? 0) * 100);
          return (
            <li key={d.id}>
              <Link
                href={`/f/${d.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-background shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="relative aspect-square overflow-hidden">
                  <Image
                    src={d.cover_image}
                    alt={d.title}
                    fill
                    sizes="(min-width:1024px) 16vw, (min-width:640px) 33vw, 50vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    placeholder="blur"
                    blurDataURL={BLUR_DATA_URL}
                  />
                  {similarity > 0 ? (
                    <span className="bg-sky-500/95 absolute left-2 top-2 inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold text-white shadow backdrop-blur">
                      <Sparkles className="size-2.5" aria-hidden="true" />
                      %{similarity}
                    </span>
                  ) : null}
                  {discount > 0 ? (
                    <span className="bg-rose-600 absolute right-2 top-2 inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-bold text-white shadow">
                      -%{discount}
                    </span>
                  ) : null}
                </div>
                <div className="flex flex-1 flex-col gap-1 p-2.5">
                  <p className="text-muted-foreground text-[10px] uppercase tracking-wide">
                    {location}
                  </p>
                  <p className="line-clamp-2 text-xs font-bold leading-snug">{d.title}</p>
                  <div className="mt-auto flex items-baseline justify-between gap-1">
                    <span className="text-xs font-bold tracking-tight">
                      {formatTRY(Number(d.discounted_price))}
                    </span>
                    {d.rating_avg ? (
                      <span className="text-amber-500 inline-flex items-center gap-0.5 text-[10px] font-bold">
                        <Star className="size-2.5 fill-current" aria-hidden="true" />
                        {Number(d.rating_avg).toFixed(1)}
                      </span>
                    ) : null}
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="text-center">
        <Link
          href="/tatil/ara"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs font-semibold transition-colors"
        >
          Tüm tatilleri keşfet
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
