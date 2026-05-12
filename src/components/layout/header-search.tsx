'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Loader2, Search, X } from 'lucide-react';
import { formatTRY } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';
import type { SearchHit } from '@/app/api/search/route';

interface Props {
  /** Mobile menu içinde büyük varyant. */
  size?: 'md' | 'lg';
  /** Sonuç tıklandığında çağrılır — mobile menu'yu kapatmak için. */
  onSelect?: () => void;
}

/**
 * Akıllı arama input'u. Yazılan sorgu 250ms debounce ile /api/search'e
 * gönderilir, sonuçlar dropdown'da kart olarak listelenir. Aktif şehir
 * bağlamı server tarafında otomatik uygulanır.
 */
export function HeaderSearch({ size = 'md', onSelect }: Props) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const id = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Click-outside + Escape close.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Debounced fetch.
  useEffect(() => {
    const trimmed = q.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const timer = window.setTimeout(async () => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, {
          signal: ctrl.signal,
        });
        if (!res.ok) throw new Error('search failed');
        const json = (await res.json()) as { deals: SearchHit[] };
        setResults(json.deals ?? []);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') setResults([]);
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }, 250);
    return () => {
      window.clearTimeout(timer);
    };
  }, [q]);

  const isLarge = size === 'lg';
  const hasQuery = q.trim().length >= 2;
  const showDropdown = open && hasQuery;

  return (
    <div ref={rootRef} className="relative w-full">
      <div
        className={cn(
          'border-border bg-background focus-within:border-foreground/40 hover:border-foreground/30 inline-flex w-full items-center gap-2 rounded-full border px-3 transition-colors',
          isLarge ? 'h-12 text-base' : 'h-10 text-sm',
        )}
      >
        <Search className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
        <input
          ref={inputRef}
          type="text"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          maxLength={80}
          placeholder={isLarge ? 'Tiyatro, masaj, Bodrum otel…' : 'Tiyatro, masaj, otel…'}
          aria-autocomplete="list"
          aria-expanded={showDropdown}
          aria-controls={`${id}-results`}
          className={cn(
            'placeholder:text-muted-foreground/70 flex-1 bg-transparent py-1 outline-none',
            isLarge ? 'text-base' : 'text-sm',
          )}
        />
        {loading ? (
          <Loader2 className="text-muted-foreground size-4 shrink-0 animate-spin" aria-hidden="true" />
        ) : q.length > 0 ? (
          <button
            type="button"
            onClick={() => {
              setQ('');
              setResults([]);
              inputRef.current?.focus();
            }}
            aria-label="Temizle"
            className="text-muted-foreground hover:text-foreground inline-flex size-6 shrink-0 items-center justify-center rounded-full"
          >
            <X className="size-3.5" aria-hidden="true" />
          </button>
        ) : null}
      </div>

      {showDropdown ? (
        <div
          id={`${id}-results`}
          role="listbox"
          className="border-border bg-background absolute left-0 right-0 z-50 mt-2 max-h-[min(60vh,420px)] overflow-y-auto rounded-2xl border p-2 shadow-xl"
        >
          {results.length === 0 && !loading ? (
            <p className="text-muted-foreground px-3 py-4 text-center text-sm">
              &ldquo;{q}&rdquo; için sonuç bulunamadı. Başka bir terim dene.
            </p>
          ) : (
            <ul className="flex flex-col gap-1">
              {results.map((deal) => (
                <li key={deal.id}>
                  <ResultCard deal={deal} onClick={() => {
                    setOpen(false);
                    setQ('');
                    setResults([]);
                    onSelect?.();
                  }} />
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}

function ResultCard({ deal, onClick }: { deal: SearchHit; onClick: () => void }) {
  const discount = deal.discount_percent ?? 0;
  const showDiscount = discount > 0 && Number(deal.discounted_price) < Number(deal.original_price);
  const location = [deal.district, deal.city].filter(Boolean).join(', ');

  return (
    <Link
      role="option"
      href={`/f/${deal.slug}`}
      onClick={onClick}
      className="hover:bg-muted/60 flex items-center gap-3 rounded-xl p-2 transition-colors"
    >
      <div className="bg-muted relative size-14 shrink-0 overflow-hidden rounded-lg">
        <Image src={deal.cover_image} alt={deal.title} fill sizes="56px" className="object-cover" />
      </div>
      <div className="min-w-0 flex-1">
        <h4 className="line-clamp-1 text-sm font-semibold">{deal.title}</h4>
        {location ? (
          <p className="text-muted-foreground line-clamp-1 text-xs">{location}</p>
        ) : null}
      </div>
      <div className="text-right">
        {showDiscount ? (
          <p className="text-muted-foreground text-[11px] line-through">
            {formatTRY(deal.original_price)}
          </p>
        ) : null}
        <p className="text-sm font-semibold">{formatTRY(deal.discounted_price)}</p>
      </div>
    </Link>
  );
}
