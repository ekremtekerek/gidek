'use client';

import Image from 'next/image';
import Link from 'next/link';
import { BellRing, MapPin, Trash2 } from 'lucide-react';
import { Bell } from 'lucide-react';
import { BLUR_DATA_URL } from '@/lib/utils/blur';
import { formatTRY } from '@/lib/utils/format';
import { usePriceAlerts } from '@/lib/travel/price-alert-store';

export function PriceAlertsList() {
  const { alerts, remove, clear } = usePriceAlerts();

  if (alerts.length === 0) {
    return (
      <div className="border-border border-dashed bg-muted/30 flex flex-col items-center gap-3 rounded-2xl border p-10 text-center">
        <span className="bg-amber-500/15 inline-flex size-14 items-center justify-center rounded-full">
          <Bell className="text-amber-600 dark:text-amber-400 size-7" aria-hidden="true" />
        </span>
        <p className="text-base font-bold">Aktif fiyat alarmın yok</p>
        <p className="text-muted-foreground max-w-md text-sm leading-relaxed">
          Bir tatil detayında <strong>&ldquo;Fiyat alarmı kur&rdquo;</strong> butonuyla
          hedef fiyatını söyle, indirim olunca seni haberdar edelim.
        </p>
        <Link
          href="/tatil"
          className="bg-foreground text-background hover:bg-foreground/90 mt-2 inline-flex h-10 items-center gap-1.5 rounded-full px-5 text-xs font-bold transition-colors"
        >
          Tatil keşfet
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm">
          {alerts.length} aktif alarm — hedef fiyata düşünce haber alacaksın
        </p>
        <button
          type="button"
          onClick={() => {
            if (confirm('Tüm alarmları silmek istediğine emin misin?')) clear();
          }}
          className="text-muted-foreground hover:text-rose-600 inline-flex items-center gap-1 text-xs font-semibold transition-colors"
        >
          <Trash2 className="size-3.5" aria-hidden="true" />
          Hepsini sil
        </button>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2">
        {alerts.map((a) => {
          const diff = a.currentPrice - a.targetPrice;
          const diffPercent = a.currentPrice > 0
            ? Math.round((diff / a.currentPrice) * 100)
            : 0;
          return (
            <li key={a.dealId}>
              <div className="group border-border bg-background flex gap-3 overflow-hidden rounded-xl border p-3 shadow-sm transition-all hover:shadow-md">
                <Link
                  href={`/f/${a.dealSlug}`}
                  className="relative aspect-square size-24 shrink-0 overflow-hidden rounded-lg"
                >
                  <Image
                    src={a.coverImage}
                    alt={a.dealTitle}
                    fill
                    sizes="96px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    placeholder="blur"
                    blurDataURL={BLUR_DATA_URL}
                  />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <Link
                    href={`/f/${a.dealSlug}`}
                    className="hover:underline line-clamp-2 text-sm font-bold leading-snug"
                  >
                    {a.dealTitle}
                  </Link>
                  <p className="text-muted-foreground inline-flex items-center gap-1 text-[11px]">
                    <MapPin className="size-3" aria-hidden="true" />
                    {a.city}
                  </p>
                  <div className="text-amber-700 dark:text-amber-300 inline-flex items-center gap-1 text-xs font-bold">
                    <BellRing className="size-3.5" aria-hidden="true" />
                    {formatTRY(a.targetPrice)} altına düşünce
                  </div>
                  <div className="mt-auto flex items-baseline justify-between gap-1">
                    <div>
                      <span className="text-muted-foreground text-[10px] line-through">
                        {formatTRY(a.currentPrice)}
                      </span>
                      <span className="text-amber-600 dark:text-amber-400 ml-1.5 text-[11px] font-bold">
                        -%{diffPercent}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(a.dealId)}
                      className="text-muted-foreground hover:text-rose-600 inline-flex items-center gap-1 text-[10px] font-semibold transition-colors"
                      aria-label="Alarmı sil"
                    >
                      <Trash2 className="size-3" aria-hidden="true" />
                      Sil
                    </button>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <p className="text-muted-foreground text-center text-[11px] mt-4">
        V1 not: Alarmlar cihazında saklanır. E-posta bildirimi yakında geliyor.
      </p>
    </div>
  );
}
