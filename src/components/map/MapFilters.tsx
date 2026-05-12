'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Filter, LayoutGrid, MapPin, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CategoryModal } from '@/components/map/category-modal';
import { MAIN_CATEGORIES, type CategorySlug } from '@/lib/utils/constants';
import { CATEGORY_STYLE } from '@/lib/utils/category-styles';
import { cn } from '@/lib/utils/cn';

export interface MapFilterState {
  categorySlug: CategorySlug | null;
  maxPrice: number | null;
}

interface Props {
  state: MapFilterState;
  onChange: (next: MapFilterState) => void;
  onLocationRequest: () => void;
  locating: boolean;
  hasLocation: boolean;
}

const PRICE_TIERS = [
  { value: 500, label: '< 500₺' },
  { value: 1000, label: '< 1000₺' },
  { value: 2500, label: '< 2500₺' },
] as const;

export function MapFilters({
  state,
  onChange,
  onLocationRequest,
  locating,
  hasLocation,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const hasActive = state.maxPrice !== null;

  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  function scrollByX(delta: number) {
    scrollRef.current?.scrollBy({ left: delta, behavior: 'smooth' });
  }

  // Scroll pozisyonunu takip et — sol/sağ chevron'un görünürlüğü buna bağlı.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const update = () => {
      setCanScrollLeft(el.scrollLeft > 1);
      setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
    };
    update();
    el.addEventListener('scroll', update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', update);
      ro.disconnect();
    };
  }, []);

  // Mouse-drag scroll — kullanıcı strip'e basıp sürükleyerek yatay scroll
  // yapabilir. Touch zaten native overflow-x ile çalışır. Drag mesafesi
  // 5px'i aşarsa sonraki click yutulur ki yanlışlıkla chip seçilmesin.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let isDown = false;
    let startX = 0;
    let startLeft = 0;
    let moved = 0;

    const down = (e: MouseEvent) => {
      // Sadece sol mouse butonu, ve hedef chip değil container'ın kendisi olabilir
      if (e.button !== 0) return;
      isDown = true;
      startX = e.pageX;
      startLeft = el.scrollLeft;
      moved = 0;
      el.style.cursor = 'grabbing';
      el.style.userSelect = 'none';
    };
    const move = (e: MouseEvent) => {
      if (!isDown) return;
      e.preventDefault();
      const dx = e.pageX - startX;
      el.scrollLeft = startLeft - dx;
      moved = Math.max(moved, Math.abs(dx));
    };
    const up = () => {
      if (!isDown) return;
      isDown = false;
      el.style.cursor = '';
      el.style.userSelect = '';
    };
    const clickCapture = (e: MouseEvent) => {
      if (moved > 5) {
        e.stopPropagation();
        e.preventDefault();
      }
      moved = 0;
    };

    el.addEventListener('mousedown', down);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    el.addEventListener('click', clickCapture, true);
    return () => {
      el.removeEventListener('mousedown', down);
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
      el.removeEventListener('click', clickCapture, true);
    };
  }, []);

  return (
    <div className="border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75 sticky top-0 z-20 border-b">
      {/* Üst satır: konum + fiyat + temizle + Hepsini gör */}
      <div className="flex items-center gap-2 px-3 py-2.5 sm:px-4">
        <Button
          type="button"
          variant={hasLocation ? 'primary' : 'outline'}
          size="sm"
          onClick={onLocationRequest}
          disabled={locating}
          className="shrink-0 rounded-full"
        >
          <MapPin className="size-4" aria-hidden="true" />
          {locating ? 'Konum alınıyor…' : hasLocation ? 'Yakınımdaki' : 'Konumumu kullan'}
        </Button>

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className={cn(
            'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-all',
            expanded || hasActive
              ? 'border-foreground bg-foreground text-background shadow-sm'
              : 'border-border bg-background hover:border-foreground/30 hover:bg-muted',
          )}
        >
          <Filter className="size-3.5" aria-hidden="true" />
          Fiyat
          {hasActive ? (
            <span className="bg-background/20 ring-background/40 ml-0.5 inline-flex size-4 items-center justify-center rounded-full text-[10px] font-bold ring-1">
              1
            </span>
          ) : null}
        </button>

        {hasActive ? (
          <button
            type="button"
            onClick={() => onChange({ ...state, maxPrice: null })}
            className="text-muted-foreground hover:text-foreground inline-flex shrink-0 items-center gap-1 text-xs"
          >
            <X className="size-3" aria-hidden="true" />
            Temizle
          </button>
        ) : null}

        <div className="ml-auto">
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            aria-label="Tüm kategorileri gör"
            className="text-muted-foreground hover:text-foreground hover:bg-muted inline-flex h-9 items-center gap-1 rounded-full px-3 text-xs font-medium transition-colors"
          >
            <LayoutGrid className="size-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Hepsini gör</span>
          </button>
        </div>
      </div>

      {/* Kategori chip strip — drag-scroll + adaptif sol/sağ chevron */}
      <div className="border-border relative border-t">
        <div
          ref={scrollRef}
          className="gidek-scroll-x flex cursor-grab items-center gap-1.5 overflow-x-auto px-3 py-2.5 sm:px-4"
          style={{
            paddingLeft: canScrollLeft ? 48 : undefined,
            paddingRight: canScrollRight ? 48 : undefined,
          }}
        >
          <CategoryPill
            active={state.categorySlug === null}
            onClick={() => onChange({ ...state, categorySlug: null })}
            icon={
              <span
                className={cn(
                  'inline-flex size-5 items-center justify-center rounded-full transition-colors',
                  state.categorySlug === null
                    ? 'bg-background/15'
                    : 'from-foreground/10 to-foreground/5 text-foreground bg-gradient-to-br',
                )}
              >
                <LayoutGrid className="size-3" aria-hidden="true" />
              </span>
            }
            label="Hepsi"
          />
          {MAIN_CATEGORIES.map((cat) => {
            const style = CATEGORY_STYLE[cat.slug];
            if (!style) return null;
            const active = state.categorySlug === cat.slug;
            const { Icon, bg, fg } = style;
            return (
              <CategoryPill
                key={cat.slug}
                active={active}
                onClick={() =>
                  onChange({ ...state, categorySlug: active ? null : cat.slug })
                }
                icon={
                  <span
                    className={cn(
                      'inline-flex size-5 items-center justify-center rounded-full transition-colors',
                      active ? 'bg-background/15' : `${bg} ${fg}`,
                    )}
                  >
                    <Icon className="size-3" aria-hidden="true" />
                  </span>
                }
                label={cat.name}
              />
            );
          })}
        </div>

        {/* Silik adaptif chevron'lar — scroll kenarında belirir, kaydırır */}
        {canScrollLeft ? (
          <button
            type="button"
            onClick={() => scrollByX(-240)}
            aria-label="Sola kaydır"
            className="from-background via-background/95 absolute inset-y-0 left-0 z-20 flex w-12 items-center justify-start bg-gradient-to-r to-transparent pl-2 transition-opacity sm:w-14 sm:pl-3"
          >
            <ChevronLeft
              className="text-muted-foreground/70 hover:text-foreground size-5 transition-colors"
              aria-hidden="true"
            />
          </button>
        ) : null}

        {canScrollRight ? (
          <button
            type="button"
            onClick={() => scrollByX(240)}
            aria-label="Sağa kaydır"
            className="from-background via-background/95 absolute inset-y-0 right-0 z-20 flex w-12 items-center justify-end bg-gradient-to-l to-transparent pr-2 transition-opacity sm:w-14 sm:pr-3"
          >
            <ChevronRight
              className="text-muted-foreground/70 hover:text-foreground size-5 gidek-chevron-nudge transition-colors"
              aria-hidden="true"
            />
          </button>
        ) : null}
      </div>

      {expanded ? (
        <div className="border-border border-t px-3 py-3 sm:px-4">
          <p className="text-muted-foreground mb-1.5 text-[11px] font-medium uppercase">
            Maks. fiyat
          </p>
          <div className="flex flex-wrap gap-1.5">
            {PRICE_TIERS.map((tier) => {
              const active = state.maxPrice === tier.value;
              return (
                <button
                  key={tier.value}
                  type="button"
                  onClick={() => onChange({ ...state, maxPrice: active ? null : tier.value })}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                    active
                      ? 'border-foreground bg-foreground text-background'
                      : 'border-border hover:bg-muted',
                  )}
                >
                  {tier.label}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <CategoryModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        selected={state.categorySlug}
        onSelect={(slug) => onChange({ ...state, categorySlug: slug })}
      />
    </div>
  );
}

interface PillProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

function CategoryPill({ active, onClick, icon, label }: PillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full border py-1.5 pr-3.5 pl-1.5 text-xs font-medium whitespace-nowrap transition-all',
        active
          ? 'border-foreground bg-foreground text-background scale-[1.02] shadow-sm'
          : 'border-border bg-background hover:border-foreground/30 hover:bg-muted/50',
      )}
    >
      {icon}
      {label}
    </button>
  );
}
