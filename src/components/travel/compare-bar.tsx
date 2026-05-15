'use client';

import Link from 'next/link';
import { ArrowRight, GitCompare, X } from 'lucide-react';
import { useCompareStore } from '@/lib/travel/compare-store';
import { cn } from '@/lib/utils/cn';

/**
 * Tatil aramada seçilen deal'lar için sticky bottom bar. 1+ deal seçildiğinde
 * görünür, 2+ olduğunda "Karşılaştır" butonu aktifleşir.
 */
export function CompareBar() {
  const compare = useCompareStore();
  const count = compare.ids.length;
  const canCompare = count >= 2;

  if (count === 0) return null;

  return (
    <div
      role="region"
      aria-label="Karşılaştırma sepeti"
      className="animate-in slide-in-from-bottom fixed inset-x-0 bottom-4 z-50 mx-auto flex w-fit max-w-[calc(100vw-2rem)] items-center gap-3 rounded-full border border-border bg-background px-4 py-2.5 shadow-2xl"
    >
      <GitCompare className="size-4 text-sky-600" aria-hidden="true" />
      <p className="text-sm">
        <strong className="text-foreground tabular-nums">{count}</strong>
        <span className="text-muted-foreground">/{compare.max} otel</span>
      </p>

      <div className="bg-border h-5 w-px" aria-hidden="true" />

      <Link
        href={canCompare ? `/tatil/karsilastir?ids=${compare.ids.join(',')}` : '#'}
        onClick={(e) => {
          if (!canCompare) e.preventDefault();
        }}
        aria-disabled={!canCompare}
        className={cn(
          'inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-sm font-bold transition-all',
          canCompare
            ? 'from-sky-600 to-cyan-500 hover:from-sky-700 hover:to-cyan-600 bg-gradient-to-r text-white shadow-sm hover:scale-105'
            : 'bg-muted text-muted-foreground cursor-not-allowed',
        )}
      >
        Karşılaştır
        <ArrowRight className="size-3.5" aria-hidden="true" />
      </Link>

      <button
        type="button"
        onClick={compare.clear}
        aria-label="Sepeti temizle"
        className="text-muted-foreground hover:text-foreground hover:bg-muted inline-flex size-7 items-center justify-center rounded-full transition-colors"
      >
        <X className="size-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}
