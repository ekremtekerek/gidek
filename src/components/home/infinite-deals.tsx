'use client';

import { useEffect, useRef } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { DealCard } from '@/components/deal/deal-card';
import { Skeleton } from '@/components/ui/skeleton';
import type { DealWithMerchant } from '@/lib/db/queries/deals';

interface Props {
  initialDeals: DealWithMerchant[];
  /** Şehir bağlamı — değişince queryKey değişir, cache miss → yeni fetch. */
  city: string;
  pageSize?: number;
}

interface PageResponse {
  deals: DealWithMerchant[];
  nextOffset: number | null;
}

/**
 * Anasayfa "Tüm fırsatlar" infinite scroll. İlk sayfa SSR'den geçiyor —
 * useInfiniteQuery `initialData` ile bunu kullanır, hidrate olur, scroll'la
 * sentinel görünür olunca sıradaki sayfayı çeker. Şehir cookie'si server
 * tarafında otomatik uygulanır, queryKey'e şehir eklenerek cache şehir
 * değişimine duyarlı kalır.
 */
export function InfiniteDeals({ initialDeals, city, pageSize = 12 }: Props) {
  const firstNextOffset = initialDeals.length === pageSize ? pageSize : null;

  const query = useInfiniteQuery<PageResponse, Error>({
    queryKey: ['deals', 'list', city, pageSize],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const offset = Number(pageParam ?? 0);
      const res = await fetch(`/api/deals/list?offset=${offset}&limit=${pageSize}`);
      if (!res.ok) throw new Error('fetch failed');
      return (await res.json()) as PageResponse;
    },
    getNextPageParam: (last) => last.nextOffset ?? undefined,
    initialData: {
      pages: [{ deals: initialDeals, nextOffset: firstNextOffset }],
      pageParams: [0],
    },
    staleTime: 60_000,
  });

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && query.hasNextPage && !query.isFetchingNextPage) {
            void query.fetchNextPage();
          }
        }
      },
      { rootMargin: '600px 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [query]);

  // Defensive dedupe — Postgres pagination boundary'lerinde nadiren aynı deal
  // iki sayfada da gelebilir (sort tie + race). Server'da `id` tiebreaker
  // koyduk; bu, sürpriz hidrasyon hatalarına karşı bir net daha.
  const flat = query.data?.pages.flatMap((p) => p.deals) ?? initialDeals;
  const seen = new Set<string>();
  const deals: DealWithMerchant[] = [];
  for (const d of flat) {
    if (!seen.has(d.id)) {
      seen.add(d.id);
      deals.push(d);
    }
  }

  if (deals.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center">
        Henüz fırsat yok. Yakında burada olacaklar!
      </p>
    );
  }

  return (
    <>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {deals.map((deal) => (
          <li key={deal.id}>
            <DealCard deal={deal} />
          </li>
        ))}
        {query.isFetchingNextPage
          ? Array.from({ length: pageSize }).map((_, i) => (
              <li key={`s-${i}`}>
                <div className="flex flex-col gap-3">
                  <Skeleton className="aspect-[4/3] w-full rounded-lg" />
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </li>
            ))
          : null}
      </ul>

      <div ref={sentinelRef} className="h-10" aria-hidden="true" />

      {query.isFetchingNextPage ? (
        <p className="text-muted-foreground mt-4 inline-flex w-full items-center justify-center gap-2 text-sm">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Daha fazla fırsat
          yükleniyor…
        </p>
      ) : !query.hasNextPage && deals.length > pageSize ? (
        <p className="text-muted-foreground mt-4 text-center text-sm">
          Tüm fırsatları gördün.
        </p>
      ) : null}
    </>
  );
}
