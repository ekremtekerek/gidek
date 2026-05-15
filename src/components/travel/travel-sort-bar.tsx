'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowUpDown } from 'lucide-react';

const OPTIONS: Array<{ value: 'recommended' | 'price-asc' | 'price-desc' | 'discount'; label: string }> = [
  { value: 'recommended', label: 'Önerilen' },
  { value: 'price-asc', label: 'En ucuz' },
  { value: 'price-desc', label: 'En pahalı' },
  { value: 'discount', label: 'En çok indirim' },
];

export function TravelSortBar() {
  const router = useRouter();
  const sp = useSearchParams();
  const current = sp?.get('sort') ?? 'recommended';

  function change(value: string) {
    const next = new URLSearchParams(Array.from(sp?.entries() ?? []));
    if (value === 'recommended') next.delete('sort');
    else next.set('sort', value);
    router.push(`?${next.toString()}`, { scroll: false });
  }

  return (
    <label className="border-border bg-background inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm">
      <ArrowUpDown className="text-muted-foreground size-3.5" aria-hidden="true" />
      <span className="sr-only">Sıralama</span>
      <select
        value={current}
        onChange={(e) => change(e.target.value)}
        className="bg-transparent text-sm font-semibold outline-none"
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
