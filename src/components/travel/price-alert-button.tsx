'use client';

import { useEffect, useState } from 'react';
import { Bell, BellRing, Check, X } from 'lucide-react';
import { formatTRY } from '@/lib/utils/format';
import { usePriceAlerts } from '@/lib/travel/price-alert-store';
import { cn } from '@/lib/utils/cn';

interface Props {
  dealId: string;
  dealSlug: string;
  dealTitle: string;
  coverImage: string;
  city: string;
  currentPrice: number;
}

/**
 * Fiyat alarmı kurma butonu. Tatil detayında WhatsApp'ın yanında durur.
 * V1 mock — localStorage'a yazar, kullanıcı /hesap/alarmlar'da görür.
 */
export function PriceAlertButton({
  dealId,
  dealSlug,
  dealTitle,
  coverImage,
  city,
  currentPrice,
}: Props) {
  const { add, remove, find } = usePriceAlerts();
  const [open, setOpen] = useState(false);
  const [targetPrice, setTargetPrice] = useState(() =>
    Math.round(currentPrice * 0.85),
  );
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const existing = mounted ? find(dealId) : null;

  if (!mounted) {
    return (
      <button
        type="button"
        disabled
        className="border-border bg-background inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border px-4 text-sm font-bold opacity-50"
      >
        <Bell className="size-4" aria-hidden="true" />
        Fiyat alarmı
      </button>
    );
  }

  if (existing) {
    return (
      <div className="border-amber-500/30 bg-amber-50 dark:bg-amber-950/30 flex items-center justify-between gap-2 rounded-xl border p-3">
        <div className="min-w-0 flex-1">
          <p className="text-amber-900 dark:text-amber-100 inline-flex items-center gap-1.5 text-xs font-bold">
            <BellRing className="size-3.5" aria-hidden="true" />
            Alarm aktif
          </p>
          <p className="text-muted-foreground mt-0.5 text-[11px] leading-tight">
            {formatTRY(existing.targetPrice)} altına düşünce haber alacaksın
          </p>
        </div>
        <button
          type="button"
          onClick={() => remove(dealId)}
          className="hover:bg-amber-100 dark:hover:bg-amber-900/40 inline-flex size-8 shrink-0 items-center justify-center rounded-full transition-colors"
          aria-label="Alarmı iptal et"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>
    );
  }

  const onSave = () => {
    if (targetPrice <= 0 || targetPrice >= currentPrice) return;
    add({
      dealId,
      dealSlug,
      dealTitle,
      coverImage,
      city,
      currentPrice,
      targetPrice,
      createdAt: new Date().toISOString(),
    });
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 group inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r px-4 text-sm font-bold text-white shadow-md transition-all hover:scale-[1.01] hover:shadow-lg"
      >
        <Bell className="size-4 transition-transform group-hover:rotate-12" aria-hidden="true" />
        Fiyat alarmı kur
      </button>

      {open ? (
        <AlertDialog
          currentPrice={currentPrice}
          targetPrice={targetPrice}
          setTargetPrice={setTargetPrice}
          onClose={() => setOpen(false)}
          onSave={onSave}
        />
      ) : null}
    </>
  );
}

function AlertDialog({
  currentPrice,
  targetPrice,
  setTargetPrice,
  onClose,
  onSave,
}: {
  currentPrice: number;
  targetPrice: number;
  setTargetPrice: (v: number) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const presets = [10, 15, 20, 30];
  const valid = targetPrice > 0 && targetPrice < currentPrice;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="border-border bg-background w-full max-w-md rounded-2xl border p-5 shadow-2xl sm:p-6"
      >
        <header className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-amber-600 dark:text-amber-400 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest">
              <Bell className="size-3.5" aria-hidden="true" />
              Fiyat alarmı
            </p>
            <h2 className="mt-1 text-lg font-bold tracking-tight">
              Hedef fiyatını söyle
            </h2>
            <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
              Şu anki fiyat <strong>{formatTRY(currentPrice)}</strong>. Bunun
              altına düşünce haber vereceğiz.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="hover:bg-muted -mr-1.5 -mt-1.5 inline-flex size-9 shrink-0 items-center justify-center rounded-full transition-colors"
            aria-label="Kapat"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </header>

        <div className="space-y-3">
          {/* Preset chips */}
          <div className="flex flex-wrap gap-1.5">
            {presets.map((p) => {
              const value = Math.round(currentPrice * (1 - p / 100));
              const active = Math.abs(targetPrice - value) < 1;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setTargetPrice(value)}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold transition-all',
                    active
                      ? 'bg-foreground text-background shadow-md'
                      : 'border border-border bg-muted hover:bg-foreground/10',
                  )}
                >
                  %{p} indirim
                </button>
              );
            })}
          </div>

          <div className="space-y-1">
            <label
              htmlFor="target-price"
              className="text-foreground/80 text-xs font-bold tracking-wider uppercase"
            >
              Hedef fiyat (₺)
            </label>
            <input
              id="target-price"
              type="number"
              min={1}
              max={currentPrice - 1}
              step={100}
              value={targetPrice}
              onChange={(e) => setTargetPrice(Math.max(1, Number(e.target.value) || 0))}
              className="border-border bg-background focus:ring-amber-500/30 focus:border-amber-500 h-11 w-full rounded-xl border px-3 text-sm font-bold transition-all focus:ring-2"
            />
            <p className="text-muted-foreground text-[11px]">
              {valid
                ? `Şu fiyattan ${formatTRY(currentPrice - targetPrice)} daha ucuza düşünce haberin olur`
                : 'Mevcut fiyattan düşük bir hedef gir'}
            </p>
          </div>

          <button
            type="button"
            disabled={!valid}
            onClick={onSave}
            className="from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed mt-2 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r text-sm font-bold text-white shadow-md transition-all hover:scale-[1.01] hover:shadow-lg"
          >
            <Check className="size-5" aria-hidden="true" />
            Alarmı kur
          </button>
          <p className="text-muted-foreground text-center text-[10px]">
            V1: kayıt cihazında tutulur. E-posta entegrasyonu yakında.
          </p>
        </div>
      </div>
    </div>
  );
}
