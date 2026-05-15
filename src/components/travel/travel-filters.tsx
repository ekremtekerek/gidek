'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import { Star, X } from 'lucide-react';
import {
  CONCEPT_LABEL,
  FEATURE_LABEL,
  type Concept,
  type TravelFeature,
} from '@/lib/travel/enrich';
import { cn } from '@/lib/utils/cn';

interface Props {
  /** Sonuç envanterindeki bölge listesi (district + city karışık) */
  regions: string[];
}

const STARS_OPTIONS = [3, 4, 5] as const;
const CONCEPT_OPTIONS: Concept[] = ['all-inclusive', 'breakfast', 'half-board', 'room-only'];
const FEATURE_OPTIONS: TravelFeature[] = [
  'pool',
  'spa',
  'beach',
  'sea-view',
  'kids-club',
  'all-inclusive',
  'breakfast',
  'transfer',
  'tour-included',
];

/**
 * Sol sticky filtre paneli — URL searchParams ile state senkron.
 * Bir filtreye tıklayınca URL güncellenir, sayfa server-side yeniden çekilir.
 */
export function TravelFilters({ regions }: Props) {
  const router = useRouter();
  const sp = useSearchParams();

  // Mevcut filtreler
  const stars = useMemo(() => {
    const raw = sp?.get('stars') ?? '';
    return raw.split(',').map(Number).filter((n) => STARS_OPTIONS.includes(n as 3 | 4 | 5));
  }, [sp]);
  const concept = (sp?.get('concept') ?? '') as Concept | '';
  const features = useMemo(() => {
    const raw = sp?.get('feat') ?? '';
    return raw.split(',').filter(Boolean) as TravelFeature[];
  }, [sp]);
  const regionList = useMemo(() => {
    const raw = sp?.get('region') ?? '';
    return raw.split(',').filter(Boolean);
  }, [sp]);
  const minPrice = sp?.get('min') ?? '';
  const maxPrice = sp?.get('max') ?? '';

  const hasAnyFilter =
    stars.length > 0 ||
    concept !== '' ||
    features.length > 0 ||
    regionList.length > 0 ||
    minPrice !== '' ||
    maxPrice !== '';

  const updateParam = useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(Array.from(sp?.entries() ?? []));
      if (value === null || value === '') next.delete(key);
      else next.set(key, value);
      next.delete('page');
      router.push(`?${next.toString()}`, { scroll: false });
    },
    [sp, router],
  );

  function toggleStar(s: number) {
    const next = stars.includes(s) ? stars.filter((x) => x !== s) : [...stars, s];
    updateParam('stars', next.length > 0 ? next.sort().join(',') : null);
  }

  function toggleConcept(c: Concept) {
    updateParam('concept', concept === c ? null : c);
  }

  function toggleFeature(f: TravelFeature) {
    const next = features.includes(f) ? features.filter((x) => x !== f) : [...features, f];
    updateParam('feat', next.length > 0 ? next.join(',') : null);
  }

  function toggleRegion(r: string) {
    const next = regionList.includes(r) ? regionList.filter((x) => x !== r) : [...regionList, r];
    updateParam('region', next.length > 0 ? next.join(',') : null);
  }

  function setPrice(side: 'min' | 'max', value: string) {
    updateParam(side, value || null);
  }

  function clearAll() {
    const next = new URLSearchParams(Array.from(sp?.entries() ?? []));
    ['stars', 'concept', 'feat', 'region', 'min', 'max'].forEach((k) => next.delete(k));
    router.push(`?${next.toString()}`, { scroll: false });
  }

  return (
    <aside className="border-border bg-background sticky top-24 max-h-[calc(100svh-7rem)] overflow-y-auto rounded-xl border p-4 shadow-sm">
      <header className="border-border mb-4 flex items-center justify-between border-b pb-3">
        <p className="text-sm font-bold">Filtreler</p>
        {hasAnyFilter ? (
          <button
            type="button"
            onClick={clearAll}
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs transition-colors"
          >
            <X className="size-3" aria-hidden="true" />
            Temizle
          </button>
        ) : null}
      </header>

      {/* Fiyat */}
      <FilterGroup title="Kişi başı fiyat (₺)">
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            inputMode="numeric"
            placeholder="En az"
            value={minPrice}
            onChange={(e) => setPrice('min', e.target.value)}
            className="border-border bg-background focus:border-foreground/50 focus:ring-foreground/10 h-9 rounded-md border px-2.5 text-sm focus:ring-2 focus:outline-none"
            min="0"
          />
          <input
            type="number"
            inputMode="numeric"
            placeholder="En çok"
            value={maxPrice}
            onChange={(e) => setPrice('max', e.target.value)}
            className="border-border bg-background focus:border-foreground/50 focus:ring-foreground/10 h-9 rounded-md border px-2.5 text-sm focus:ring-2 focus:outline-none"
            min="0"
          />
        </div>
      </FilterGroup>

      {/* Yıldız */}
      <FilterGroup title="Otel sınıfı">
        <div className="flex flex-col gap-1.5">
          {STARS_OPTIONS.slice().reverse().map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => toggleStar(s)}
              className={cn(
                'flex items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-sm transition-colors',
                stars.includes(s)
                  ? 'bg-amber-500/15 text-amber-800 dark:text-amber-200 font-semibold'
                  : 'hover:bg-muted',
              )}
            >
              <span className="inline-flex items-center gap-0.5">
                {Array.from({ length: s }).map((_, i) => (
                  <Star
                    key={i}
                    className="size-3.5 fill-amber-500 text-amber-500"
                    aria-hidden="true"
                  />
                ))}
              </span>
              <span className="text-muted-foreground text-xs">
                {stars.includes(s) ? '✓' : ''}
              </span>
            </button>
          ))}
        </div>
      </FilterGroup>

      {/* Konsept */}
      <FilterGroup title="Konsept">
        <div className="flex flex-col gap-1">
          {CONCEPT_OPTIONS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => toggleConcept(c)}
              className={cn(
                'flex items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-sm transition-colors',
                concept === c
                  ? 'bg-sky-500/15 text-sky-800 dark:text-sky-200 font-semibold'
                  : 'hover:bg-muted',
              )}
            >
              <span>{CONCEPT_LABEL[c]}</span>
              {concept === c ? <span className="text-xs">✓</span> : null}
            </button>
          ))}
        </div>
      </FilterGroup>

      {/* Özellikler */}
      <FilterGroup title="Tesis özellikleri">
        <div className="flex flex-col gap-1">
          {FEATURE_OPTIONS.map((f) => (
            <label
              key={f}
              className="hover:bg-muted flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-sm transition-colors"
            >
              <input
                type="checkbox"
                checked={features.includes(f)}
                onChange={() => toggleFeature(f)}
                className="accent-foreground size-4"
              />
              <span>{FEATURE_LABEL[f]}</span>
            </label>
          ))}
        </div>
      </FilterGroup>

      {/* Bölge */}
      {regions.length > 0 ? (
        <FilterGroup title="Bölge">
          <div className="flex flex-col gap-1 max-h-60 overflow-y-auto pr-1">
            {regions.map((r) => (
              <label
                key={r}
                className="hover:bg-muted flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-sm transition-colors"
              >
                <input
                  type="checkbox"
                  checked={regionList.includes(r)}
                  onChange={() => toggleRegion(r)}
                  className="accent-foreground size-4"
                />
                <span>{r}</span>
              </label>
            ))}
          </div>
        </FilterGroup>
      ) : null}
    </aside>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-border mb-4 border-b pb-4 last:mb-0 last:border-b-0">
      <p className="text-muted-foreground mb-2 text-[11px] font-bold uppercase tracking-wide">
        {title}
      </p>
      {children}
    </div>
  );
}
