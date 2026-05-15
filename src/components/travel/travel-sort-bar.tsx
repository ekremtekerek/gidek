'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowUpDown } from 'lucide-react';
import { Select, type SelectOption } from '@/components/ui/select';

type SortValue = 'recommended' | 'price-asc' | 'price-desc' | 'discount';

const OPTIONS: SelectOption<SortValue>[] = [
  { value: 'recommended', label: 'Önerilen' },
  { value: 'price-asc', label: 'En ucuz' },
  { value: 'price-desc', label: 'En pahalı' },
  { value: 'discount', label: 'En çok indirim' },
];

export function TravelSortBar() {
  const router = useRouter();
  const sp = useSearchParams();
  const current = (sp?.get('sort') ?? 'recommended') as SortValue;

  function change(value: SortValue) {
    const next = new URLSearchParams(Array.from(sp?.entries() ?? []));
    if (value === 'recommended') next.delete('sort');
    else next.set('sort', value);
    router.push(`?${next.toString()}`, { scroll: false });
  }

  return (
    <div className="w-44">
      <Select<SortValue>
        value={current}
        onChange={change}
        options={OPTIONS}
        size="sm"
        label="Sıralama"
        className="font-semibold"
      />
      {/* aria için sr-only label yerine icon yan görsel */}
      <span className="sr-only">
        <ArrowUpDown className="size-3.5" aria-hidden="true" /> Sıralama
      </span>
    </div>
  );
}
