'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { List, Map as MapIcon } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface Props {
  current: 'list' | 'map';
}

export function TravelViewToggle({ current }: Props) {
  const router = useRouter();
  const sp = useSearchParams();

  function pick(view: 'list' | 'map') {
    if (view === current) return;
    const next = new URLSearchParams(Array.from(sp?.entries() ?? []));
    if (view === 'list') next.delete('view');
    else next.set('view', view);
    router.push(`?${next.toString()}`, { scroll: false });
  }

  return (
    <div
      role="tablist"
      aria-label="Görünüm seçimi"
      className="border-border bg-background inline-flex h-9 items-center rounded-lg border p-0.5"
    >
      <button
        type="button"
        role="tab"
        aria-selected={current === 'list'}
        onClick={() => pick('list')}
        className={cn(
          'inline-flex h-full items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold transition-colors',
          current === 'list' ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground',
        )}
      >
        <List className="size-3.5" aria-hidden="true" />
        Liste
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={current === 'map'}
        onClick={() => pick('map')}
        className={cn(
          'inline-flex h-full items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold transition-colors',
          current === 'map' ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground',
        )}
      >
        <MapIcon className="size-3.5" aria-hidden="true" />
        Harita
      </button>
    </div>
  );
}
