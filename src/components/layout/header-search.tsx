'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Loader2, Search, Tag, X } from 'lucide-react';
import { formatTRY } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';
import type { SearchCategoryHit, SearchHit } from '@/app/api/search/route';

interface Props {
  /** Mobile menu içinde büyük varyant. */
  size?: 'md' | 'lg';
  /** Sonuç tıklandığında çağrılır — mobile menu'yu kapatmak için. */
  onSelect?: () => void;
}

/**
 * Akıllı arama input'u. 250ms debounce ile /api/search'e sorgu yollar; aktif
 * deal'lar + kategori önerileri tek dropdown'da listelenir. Klavye nav (↑/↓
 * + Enter) ve Escape destekli. Aktif şehir bağlamı server'da uygulanır.
 */
export function HeaderSearch({ size = 'md', onSelect }: Props) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [deals, setDeals] = useState<SearchHit[]>([]);
  const [categories, setCategories] = useState<SearchCategoryHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const id = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Klavye nav için tek flat dizi (kategori önce, deal sonra).
  const items = useMemo(
    () => [
      ...categories.map((c) => ({ kind: 'cat' as const, slug: c.slug, name: c.name })),
      ...deals.map((d) => ({ kind: 'deal' as const, slug: d.slug, deal: d })),
    ],
    [categories, deals],
  );

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
    /* eslint-disable react-hooks/set-state-in-effect */
    if (trimmed.length < 2) {
      setDeals([]);
      setCategories([]);
      setLoading(false);
      setActiveIdx(-1);
      return;
    }
    setLoading(true);
    /* eslint-enable react-hooks/set-state-in-effect */
    const timer = window.setTimeout(async () => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, {
          signal: ctrl.signal,
        });
        if (!res.ok) throw new Error('search failed');
        const json = (await res.json()) as {
          deals?: SearchHit[];
          categories?: SearchCategoryHit[];
        };
        setDeals(json.deals ?? []);
        setCategories(json.categories ?? []);
        setActiveIdx(-1);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setDeals([]);
          setCategories([]);
        }
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }, 250);
    return () => {
      window.clearTimeout(timer);
    };
  }, [q]);

  function close() {
    setOpen(false);
    setActiveIdx(-1);
  }

  function handleEnter() {
    if (activeIdx >= 0 && activeIdx < items.length) {
      const it = items[activeIdx];
      const href = it.kind === 'cat' ? `/k/${it.slug}` : `/f/${it.slug}`;
      close();
      setQ('');
      onSelect?.();
      router.push(href);
      return;
    }
    if (q.trim().length >= 2) {
      close();
      onSelect?.();
      router.push(`/?q=${encodeURIComponent(q.trim())}`);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(items.length - 1, i + 1));
      setOpen(true);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(-1, i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleEnter();
    }
  }

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
          onKeyDown={onKeyDown}
          maxLength={80}
          placeholder={isLarge ? 'Tiyatro, masaj, Bodrum otel…' : 'Tiyatro, masaj, otel…'}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showDropdown}
          aria-controls={`${id}-results`}
          aria-activedescendant={
            activeIdx >= 0 && items[activeIdx] ? `${id}-item-${activeIdx}` : undefined
          }
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
              setDeals([]);
              setCategories([]);
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
          className="border-border bg-background absolute left-0 right-0 z-50 mt-2 max-h-[min(70vh,480px)] overflow-y-auto rounded-2xl border p-2 shadow-xl"
        >
          {items.length === 0 && !loading ? (
            <p className="text-muted-foreground px-3 py-4 text-center text-sm">
              &ldquo;{q}&rdquo; için sonuç bulunamadı. AI sohbete sor:
            </p>
          ) : (
            <>
              {categories.length > 0 ? (
                <>
                  <p className="text-muted-foreground px-3 pt-1 pb-1 text-[10px] font-semibold tracking-wide uppercase">
                    Kategoriler
                  </p>
                  <ul className="flex flex-col gap-0.5">
                    {categories.map((c, i) => (
                      <li key={c.slug}>
                        <CategoryRow
                          category={c}
                          id={`${id}-item-${i}`}
                          active={activeIdx === i}
                          onMouseEnter={() => setActiveIdx(i)}
                          onClick={() => {
                            close();
                            setQ('');
                            onSelect?.();
                          }}
                        />
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}
              {deals.length > 0 ? (
                <>
                  {categories.length > 0 ? (
                    <div className="border-border my-1.5 border-t" />
                  ) : null}
                  <p className="text-muted-foreground px-3 pt-1 pb-1 text-[10px] font-semibold tracking-wide uppercase">
                    Fırsatlar
                  </p>
                  <ul className="flex flex-col gap-0.5">
                    {deals.map((deal, j) => {
                      const i = categories.length + j;
                      return (
                        <li key={deal.id}>
                          <ResultRow
                            deal={deal}
                            id={`${id}-item-${i}`}
                            active={activeIdx === i}
                            onMouseEnter={() => setActiveIdx(i)}
                            onClick={() => {
                              close();
                              setQ('');
                              onSelect?.();
                            }}
                          />
                        </li>
                      );
                    })}
                  </ul>
                </>
              ) : null}
              <div className="border-border mt-1.5 border-t pt-1.5">
                <Link
                  href={`/?q=${encodeURIComponent(q.trim())}`}
                  onClick={() => {
                    close();
                    onSelect?.();
                  }}
                  className="hover:bg-muted/60 flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition-colors"
                >
                  <span>AI ile &ldquo;{q.trim()}&rdquo; sohbet et</span>
                  <ArrowRight className="text-muted-foreground size-4" aria-hidden="true" />
                </Link>
              </div>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}

function CategoryRow({
  category,
  id,
  active,
  onClick,
  onMouseEnter,
}: {
  category: SearchCategoryHit;
  id: string;
  active: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
}) {
  return (
    <Link
      id={id}
      role="option"
      aria-selected={active}
      href={`/k/${category.slug}`}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      className={cn(
        'flex items-center gap-3 rounded-xl p-2 transition-colors',
        active ? 'bg-muted' : 'hover:bg-muted/60',
      )}
    >
      <span className="bg-muted text-muted-foreground inline-flex size-9 shrink-0 items-center justify-center rounded-lg">
        <Tag className="size-4" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{category.name}</p>
        <p className="text-muted-foreground text-xs">Kategoriye git</p>
      </div>
    </Link>
  );
}

function ResultRow({
  deal,
  id,
  active,
  onClick,
  onMouseEnter,
}: {
  deal: SearchHit;
  id: string;
  active: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
}) {
  const discount = deal.discount_percent ?? 0;
  const showDiscount =
    discount > 0 && Number(deal.discounted_price) < Number(deal.original_price);
  const location = [deal.district, deal.city].filter(Boolean).join(', ');

  return (
    <Link
      id={id}
      role="option"
      aria-selected={active}
      href={`/f/${deal.slug}`}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      className={cn(
        'flex items-center gap-3 rounded-xl p-2 transition-colors',
        active ? 'bg-muted' : 'hover:bg-muted/60',
      )}
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
