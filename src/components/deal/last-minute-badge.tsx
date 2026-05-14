'use client';

import { useEffect, useState } from 'react';
import { Flame, Timer } from 'lucide-react';

interface Props {
  /** Fırsatın son geçerlilik tarihi (ISO) */
  validUntil: string;
  /** Kaç saat kala "son fırsat" rozetinin tetiklendiği. Default 24 saat. */
  thresholdHours?: number;
}

/**
 * Son dakika rozeti — fırsatın bitimine `thresholdHours` saatten az kalmışsa
 * büyük dikkat çekici banner + canlı countdown. Bitime 0 kala otomatik gizler.
 *
 * Tarayıcıda saniyede bir tick — sayfaya hafif yük; sadece eligible olduğunda
 * mount oluyor.
 */
export function LastMinuteBadge({ validUntil, thresholdHours = 24 }: Props) {
  const [remaining, setRemaining] = useState<number>(() =>
    Math.max(0, new Date(validUntil).getTime() - Date.now()),
  );

  useEffect(() => {
    const target = new Date(validUntil).getTime();
    const id = window.setInterval(() => {
      setRemaining(Math.max(0, target - Date.now()));
    }, 1000);
    return () => window.clearInterval(id);
  }, [validUntil]);

  const thresholdMs = thresholdHours * 60 * 60 * 1000;
  if (remaining <= 0 || remaining > thresholdMs) return null;

  const totalSeconds = Math.floor(remaining / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  const urgent = remaining <= 3 * 60 * 60 * 1000; // son 3 saat

  return (
    <div
      role="status"
      aria-live="polite"
      className={
        urgent
          ? 'border-rose-500/50 bg-gradient-to-r from-rose-500/15 via-amber-500/10 to-rose-500/15 flex items-center gap-3 rounded-xl border p-3.5 sm:p-4'
          : 'border-amber-500/40 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-amber-500/10 flex items-center gap-3 rounded-xl border p-3.5 sm:p-4'
      }
    >
      <span
        className={
          urgent
            ? 'bg-rose-500 text-white inline-flex size-10 shrink-0 items-center justify-center rounded-full shadow-md'
            : 'bg-amber-500 text-white inline-flex size-10 shrink-0 items-center justify-center rounded-full shadow-md'
        }
      >
        {urgent ? (
          <Flame className="size-5 animate-pulse" aria-hidden="true" />
        ) : (
          <Timer className="size-5" aria-hidden="true" />
        )}
      </span>

      <div className="min-w-0 flex-1">
        <p
          className={
            urgent
              ? 'text-rose-900 dark:text-rose-100 text-sm font-bold'
              : 'text-amber-900 dark:text-amber-100 text-sm font-bold'
          }
        >
          {urgent ? 'Son fırsat — saatler kaldı!' : 'Son dakika fırsatı'}
        </p>
        <p className="text-foreground/70 mt-0.5 text-xs">
          Bu fiyat sona ererken — kaçırma.
        </p>
      </div>

      <div
        className={
          urgent
            ? 'text-rose-900 dark:text-rose-100 tabular-nums text-right text-lg font-bold'
            : 'text-amber-900 dark:text-amber-100 tabular-nums text-right text-lg font-bold'
        }
      >
        {String(hours).padStart(2, '0')}:{String(mins).padStart(2, '0')}:
        {String(secs).padStart(2, '0')}
      </div>
    </div>
  );
}
