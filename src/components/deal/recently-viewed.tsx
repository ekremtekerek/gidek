'use client';

import { useEffect, useState } from 'react';
import { DealCard } from '@/components/deal/deal-card';
import type { DealWithMerchant } from '@/lib/db/queries/deals';

const STORAGE_KEY = 'gidek:recent-deals';
const MAX_STORED = 12;
const MAX_SHOWN = 4;

interface Props {
  /** Şu an görüntülenen deal — listeye eklenir, kendi listesinde gösterilmez. */
  currentSlug: string;
}

function readRecent(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.filter((s) => typeof s === 'string') : [];
  } catch {
    return [];
  }
}

/**
 * "İncelediğiniz Fırsatlar" — son görüntülenen deal'lar (localStorage). Mevcut
 * deal'i listeye yazar, önceki görüntülenenleri /api/deals/by-slugs ile çekip
 * gösterir. Tamamen client-side; kişiseldir, server'da tutulmaz.
 */
export function RecentlyViewed({ currentSlug }: Props) {
  const [deals, setDeals] = useState<DealWithMerchant[]>([]);

  useEffect(() => {
    const prev = readRecent();
    // Bu ziyaretten ÖNCE görüntülenenler (mevcut hariç) gösterilecek.
    const toShow = prev.filter((s) => s !== currentSlug).slice(0, MAX_SHOWN);

    // Mevcut deal'i listenin başına al, dedupe + cap, geri yaz.
    const updated = [currentSlug, ...prev.filter((s) => s !== currentSlug)].slice(0, MAX_STORED);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // sessizce yut
    }

    // Gösterilecek geçmiş yoksa hiçbir şey set etme (başlangıç [] kalır);
    // component detay sayfasında key={slug} ile remount olduğu için stale risk yok.
    if (toShow.length === 0) return;

    let cancelled = false;
    fetch(`/api/deals/by-slugs?slugs=${toShow.map(encodeURIComponent).join(',')}`)
      .then((r) => (r.ok ? r.json() : { deals: [] }))
      .then((d: { deals: DealWithMerchant[] }) => {
        if (!cancelled) setDeals(d.deals ?? []);
      })
      .catch(() => {
        if (!cancelled) setDeals([]);
      });
    return () => {
      cancelled = true;
    };
  }, [currentSlug]);

  if (deals.length === 0) return null;

  return (
    <section aria-labelledby="recent-heading" className="border-border border-t pt-10">
      <div className="mb-5 flex flex-col gap-1">
        <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
          Kaldığın yerden devam et
        </p>
        <h2 id="recent-heading" className="text-2xl font-semibold tracking-tight">
          İncelediğiniz fırsatlar
        </h2>
      </div>

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {deals.map((deal) => (
          <li key={deal.id}>
            <DealCard deal={deal} />
          </li>
        ))}
      </ul>
    </section>
  );
}
