'use client';

import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, CalendarDays, Sparkles } from 'lucide-react';
import { generateDailyPrices, analysePrices, type DailyPrice } from '@/lib/travel/price-calendar';
import { cn } from '@/lib/utils/cn';
import { formatTRY } from '@/lib/utils/format';

interface Props {
  basePrice: number;
  dealId: string;
  /** Kaç ay gösterilsin (default 2) */
  monthsCount?: number;
}

const TR_MONTHS = [
  'Ocak',
  'Şubat',
  'Mart',
  'Nisan',
  'Mayıs',
  'Haziran',
  'Temmuz',
  'Ağustos',
  'Eylül',
  'Ekim',
  'Kasım',
  'Aralık',
];

const TR_DAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

/**
 * Tarih bazlı fiyat takvimi — kullanıcıya "hangi tarihte ne kadar ucuz" net
 * gösterir. Renk skalası (yeşil=ucuz, kırmızı=pahalı) + bayram etiketleri +
 * en ucuz/en pahalı özet.
 */
export function PriceCalendar({ basePrice, dealId, monthsCount = 2 }: Props) {
  const allPrices = useMemo(
    () => generateDailyPrices(basePrice, dealId, 90),
    [basePrice, dealId],
  );
  const summary = useMemo(() => analysePrices(allPrices), [allPrices]);

  // Bugünün ayı + sonraki ay/lar
  const [monthOffset, setMonthOffset] = useState(0);
  const [today] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

  // Stable primitive değerler — useMemo'nun her render'da bozulmasını önler
  const baseYear = today.getFullYear();
  const baseMonth = today.getMonth();

  // Bu ayın hücrelerini hesapla
  const cells = useMemo(
    () => buildMonthGrid(baseYear, baseMonth + monthOffset, allPrices),
    [baseYear, baseMonth, monthOffset, allPrices],
  );

  const visibleMonth = new Date(baseYear, baseMonth + monthOffset, 1);
  const monthLabel = `${TR_MONTHS[visibleMonth.getMonth()]} ${visibleMonth.getFullYear()}`;
  const canPrev = monthOffset > 0;
  const canNext = monthOffset < monthsCount + 1;

  return (
    <section className="border-border bg-background overflow-hidden rounded-2xl border shadow-sm">
      {/* Üst — başlık + özet */}
      <header className="border-border from-sky-50 via-background to-cyan-50 dark:from-sky-950/30 dark:to-cyan-950/20 flex flex-col gap-3 border-b bg-gradient-to-r p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <p className="text-sky-700 dark:text-sky-300 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest">
            <CalendarDays className="size-3.5" aria-hidden="true" />
            Fiyat takvimi
          </p>
          <h3 className="text-foreground mt-1 text-sm font-bold sm:text-base">
            Hangi tarih daha akıllıca?
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-emerald-800 dark:text-emerald-200">
            <Sparkles className="size-3" aria-hidden="true" />
            En ucuz:{' '}
            <strong className="tabular-nums">{formatTRY(summary.min.price)}</strong>
            <span className="opacity-70">({tdr(summary.min.date)})</span>
          </span>
          <span className="text-muted-foreground inline-flex items-center gap-1.5">
            Ortalama:{' '}
            <strong className="text-foreground tabular-nums">{formatTRY(summary.avg)}</strong>
          </span>
        </div>
      </header>

      {/* Ay seçici */}
      <div className="border-border flex items-center justify-between border-b px-4 py-2.5 sm:px-5">
        <button
          type="button"
          onClick={() => setMonthOffset((o) => Math.max(0, o - 1))}
          disabled={!canPrev}
          aria-label="Önceki ay"
          className="text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 inline-flex size-8 items-center justify-center rounded-md transition-colors"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
        </button>
        <p className="text-sm font-bold">{monthLabel}</p>
        <button
          type="button"
          onClick={() => setMonthOffset((o) => o + 1)}
          disabled={!canNext}
          aria-label="Sonraki ay"
          className="text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 inline-flex size-8 items-center justify-center rounded-md transition-colors"
        >
          <ArrowRight className="size-4" aria-hidden="true" />
        </button>
      </div>

      {/* Takvim grid */}
      <div className="p-3 sm:p-4">
        {/* Gün başlıkları */}
        <div className="mb-1.5 grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
          {TR_DAYS.map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>

        {/* Hücreler */}
        <div className="grid grid-cols-7 gap-1">
          {cells.map((cell, i) => {
            if (!cell) {
              return <div key={i} aria-hidden="true" />;
            }
            const isToday = cell.date === today.toISOString().slice(0, 10);
            const isPast = cell.date < today.toISOString().slice(0, 10);
            return (
              <div
                key={i}
                className={cn(
                  'group/cell relative flex aspect-square flex-col items-center justify-center rounded-md border text-center transition-all',
                  isPast
                    ? 'border-border bg-muted/30 text-muted-foreground/50'
                    : LEVEL_BG[cell.level],
                  cell.price && !isPast && 'hover:scale-105 cursor-pointer',
                  isToday && 'ring-foreground/30 ring-2',
                )}
                title={
                  cell.price
                    ? `${cell.date} — ${formatTRY(cell.price)} kişi başı${cell.eventLabel ? ` · ${cell.eventLabel}` : ''}`
                    : undefined
                }
              >
                <span
                  className={cn(
                    'text-[11px] font-semibold',
                    cell.eventLabel && !isPast && 'text-rose-700 dark:text-rose-300',
                  )}
                >
                  {cell.day}
                </span>
                {cell.price && !isPast ? (
                  <span className="text-[9px] font-bold tabular-nums leading-tight">
                    {Math.round(cell.price / 100) * 100 >= 10000
                      ? `${Math.round(cell.price / 1000)}k`
                      : `${Math.round(cell.price)}`}
                  </span>
                ) : null}
                {cell.eventLabel && !isPast ? (
                  <span
                    aria-hidden="true"
                    className="absolute right-0.5 top-0.5 size-1.5 rounded-full bg-rose-500"
                    title={cell.eventLabel}
                  />
                ) : null}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="border-border mt-3 flex flex-wrap items-center justify-center gap-3 border-t pt-3 text-[10px]">
          <LegendChip color="bg-emerald-500/20 border-emerald-500/30" label="Ucuz" />
          <LegendChip color="bg-amber-500/15 border-amber-500/30" label="Orta" />
          <LegendChip color="bg-rose-500/15 border-rose-500/30" label="Pahalı" />
          <span className="text-muted-foreground inline-flex items-center gap-1.5">
            <span className="bg-rose-500 inline-block size-1.5 rounded-full" aria-hidden="true" />
            Tatil / festival
          </span>
        </div>

        <p className="text-muted-foreground mt-3 text-center text-[10px] leading-relaxed">
          Tahminî kişi başı fiyat. Hafta sonu/festival/yüksek sezon ağırlıkları hesaba katıldı.
        </p>
      </div>
    </section>
  );
}

const LEVEL_BG: Record<DailyPrice['level'], string> = {
  low: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-900 dark:text-emerald-100 hover:bg-emerald-500/25',
  mid: 'border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-100 hover:bg-amber-500/20',
  high: 'border-rose-500/30 bg-rose-500/10 text-rose-900 dark:text-rose-100 hover:bg-rose-500/20',
};

function LegendChip({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span
        aria-hidden="true"
        className={cn('inline-block size-3 rounded border', color)}
      />
      <span className="text-muted-foreground">{label}</span>
    </span>
  );
}

interface Cell {
  day: number;
  date: string;
  price: number | null;
  level: DailyPrice['level'];
  eventLabel: string | null;
}

function buildMonthGrid(year: number, month: number, prices: DailyPrice[]): (Cell | null)[] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const lastDay = last.getDate();

  // Türkiye'de hafta Pazartesi başlar. JS getDay 0=Sun, 1=Mon
  const firstDow = first.getDay();
  const blanks = firstDow === 0 ? 6 : firstDow - 1;

  const cells: (Cell | null)[] = [];
  for (let i = 0; i < blanks; i++) cells.push(null);

  const priceByDate = new Map(prices.map((p) => [p.date, p]));
  for (let d = 1; d <= lastDay; d++) {
    const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const p = priceByDate.get(iso);
    cells.push({
      day: d,
      date: iso,
      price: p?.price ?? null,
      level: p?.level ?? 'mid',
      eventLabel: p?.eventLabel ?? null,
    });
  }

  // Doldur — toplam 35 veya 42 hücre olsun
  const target = cells.length <= 35 ? 35 : 42;
  while (cells.length < target) cells.push(null);

  return cells;
}

function tdr(dateIso: string): string {
  const d = new Date(dateIso);
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
}
