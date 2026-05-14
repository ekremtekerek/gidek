'use client';

import { useState } from 'react';
import { Check, Copy, MapPin, Sparkles } from 'lucide-react';
import type { BingoCityProgress } from '@/lib/gamification/bingo';
import { cn } from '@/lib/utils/cn';

interface Props {
  cities: BingoCityProgress[];
  threshold: number;
}

/**
 * Şehir bingosu kartı — kullanıcının booking yaptığı her şehir için 5 ilçe
 * hedefi gösterir. Tamamlanan şehir için kupon kodu + kopyala butonu.
 *
 * Sıfır şehir varsa kart gösterilmez (motivasyon yerine boşluk).
 */
export function BingoCard({ cities, threshold }: Props) {
  if (cities.length === 0) return null;

  return (
    <section className="from-sky-500/10 via-background to-background relative overflow-hidden rounded-xl border border-sky-500/30 bg-gradient-to-br p-5 sm:p-6">
      <header className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            Şehir bingosu
          </p>
          <p className="mt-1 text-base font-semibold">
            Bir şehirde {threshold} farklı ilçeyi keşfet
          </p>
          <p className="text-muted-foreground mt-0.5 text-xs">
            Tamamlayınca özel %15 indirim kuponu kazanırsın
          </p>
        </div>
        <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-sky-500/15 text-sky-700 dark:text-sky-300">
          <MapPin className="size-4" aria-hidden="true" />
        </span>
      </header>

      <ul className="space-y-3">
        {cities.map((c) => (
          <CityRow key={c.city} city={c} threshold={threshold} />
        ))}
      </ul>
    </section>
  );
}

function CityRow({ city, threshold }: { city: BingoCityProgress; threshold: number }) {
  const pct = Math.min(100, Math.round((city.districtCount / threshold) * 100));
  const cells = Array.from({ length: threshold });

  return (
    <li className="border-border bg-background/60 rounded-lg border p-3 sm:p-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-semibold">{city.city}</p>
        <p className="text-muted-foreground text-xs tabular-nums">
          {Math.min(city.districtCount, threshold)} / {threshold}
        </p>
      </div>

      {/* İlçe damgaları */}
      <ul className="mt-2 flex flex-wrap gap-1">
        {cells.map((_, i) => {
          const visited = i < city.districtCount;
          const name = city.districts[i] ?? null;
          return (
            <li
              key={i}
              className={cn(
                'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px]',
                visited
                  ? 'border-sky-500/30 bg-sky-500/15 text-sky-800 dark:text-sky-200'
                  : 'border-border bg-muted/40 text-muted-foreground',
              )}
              title={name ?? 'Henüz ziyaret edilmedi'}
            >
              {visited ? (
                <Check className="size-3" aria-hidden="true" />
              ) : (
                <span className="inline-block size-2 rounded-full bg-current opacity-30" aria-hidden="true" />
              )}
              <span className="max-w-[88px] truncate">
                {name ?? 'Yeni ilçe'}
              </span>
            </li>
          );
        })}
      </ul>

      {/* Progress */}
      <div className="bg-muted mt-3 h-1.5 overflow-hidden rounded-full">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            city.claimed ? 'bg-emerald-500' : 'bg-sky-500',
          )}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Ödül */}
      {city.claimed && city.couponCode ? (
        <ClaimedReward code={city.couponCode} />
      ) : city.districtCount >= threshold ? (
        <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-300">
          <Sparkles className="size-3" aria-hidden="true" />
          Hazır — sonraki onayda kupon otomatik düşer.
        </p>
      ) : (
        <p className="text-muted-foreground mt-2 text-[11px]">
          {threshold - city.districtCount} ilçe kaldı.
        </p>
      )}
    </li>
  );
}

function ClaimedReward({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore — tarayıcı izin vermediyse kullanıcı manuel seçebilir
    }
  }

  return (
    <div className="mt-3 flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-2">
      <Sparkles
        className="size-3.5 shrink-0 text-emerald-700 dark:text-emerald-300"
        aria-hidden="true"
      />
      <code className="flex-1 truncate text-[12px] font-semibold tracking-wide text-emerald-900 dark:text-emerald-100">
        {code}
      </code>
      <button
        type="button"
        onClick={copy}
        className="hover:bg-emerald-500/15 inline-flex size-7 items-center justify-center rounded-md text-emerald-800 transition-colors dark:text-emerald-200"
        aria-label="Kuponu kopyala"
      >
        {copied ? (
          <Check className="size-3.5" aria-hidden="true" />
        ) : (
          <Copy className="size-3.5" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
