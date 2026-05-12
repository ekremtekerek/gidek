'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Bell, CalendarDays, MapPin } from 'lucide-react';
import type { BookingWithDeal } from '@/lib/db/queries/bookings';
import { formatDate } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

interface Props {
  bookings: BookingWithDeal[];
}

/**
 * Header'daki "yaklaşan rezervasyonlar" çıngırağı. Auth kullanıcı için
 * confirmed + bugün veya sonrasındaki rezervasyonları küçük bir popover'da
 * gösterir. Boş ise badge ve popover sade bir mesaj.
 */
export function UpcomingBell({ bookings }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const wasOpenRef = useRef(false);
  const count = bookings.length;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
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

  // Popover kapanınca trigger'a focus geri dön (klavye navigasyonu için).
  useEffect(() => {
    if (wasOpenRef.current && !open) triggerRef.current?.focus();
    wasOpenRef.current = open;
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={
          count > 0
            ? `${count} yaklaşan rezervasyon`
            : 'Yaklaşan rezervasyonları gör'
        }
        aria-haspopup="dialog"
        aria-expanded={open}
        className={cn(
          'hover:bg-muted relative inline-flex size-10 items-center justify-center rounded-full transition-colors',
          open && 'bg-muted',
        )}
      >
        <Bell className="size-5" aria-hidden="true" />
        {count > 0 ? (
          <span className="border-background bg-rose-500 text-white absolute top-1.5 right-1.5 inline-flex min-w-[18px] items-center justify-center rounded-full border-2 px-1 text-[10px] font-bold leading-none">
            {count > 9 ? '9+' : count}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Yaklaşan rezervasyonlar"
          className="border-border bg-background absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border shadow-xl"
        >
          <header className="border-border border-b px-4 py-3">
            <p className="text-sm font-semibold">Yaklaşan rezervasyonlar</p>
            {count > 0 ? (
              <p className="text-muted-foreground text-xs">{count} aktif rezervasyon</p>
            ) : null}
          </header>

          {count === 0 ? (
            <div className="text-muted-foreground px-4 py-6 text-center text-sm">
              Yaklaşan rezervasyon yok.
              <br />
              <Link
                href="/"
                onClick={() => setOpen(false)}
                className="text-foreground mt-2 inline-block text-xs font-medium underline underline-offset-2"
              >
                Fırsatları keşfet →
              </Link>
            </div>
          ) : (
            <ul className="max-h-[60vh] overflow-y-auto p-2">
              {bookings.map((b) => (
                <li key={b.id}>
                  <Link
                    href={`/rezervasyonlarim/${b.booking_code}`}
                    onClick={() => setOpen(false)}
                    className="hover:bg-muted/60 flex items-start gap-3 rounded-lg p-2 transition-colors"
                  >
                    {b.deal ? (
                      <div className="bg-muted relative size-14 shrink-0 overflow-hidden rounded-md">
                        <Image
                          src={b.deal.cover_image}
                          alt={b.deal.title}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="bg-muted size-14 shrink-0 rounded-md" />
                    )}
                    <div className="min-w-0 flex-1">
                      <h4 className="line-clamp-2 text-sm font-semibold leading-tight">
                        {b.deal?.title ?? 'Silinmiş fırsat'}
                      </h4>
                      <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px]">
                        {b.selected_date ? (
                          <span className="inline-flex items-center gap-1">
                            <CalendarDays className="size-3" aria-hidden="true" />
                            {formatDate(b.selected_date)}
                            {b.selected_time ? ` · ${b.selected_time.slice(0, 5)}` : ''}
                          </span>
                        ) : null}
                        {b.deal && (b.deal.district || b.deal.city) ? (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="size-3" aria-hidden="true" />
                            {[b.deal.district, b.deal.city].filter(Boolean).join(', ')}
                          </span>
                        ) : null}
                      </div>
                      <p className="text-muted-foreground mt-1 font-mono text-[10px]">
                        {b.booking_code}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {count > 0 ? (
            <div className="border-border border-t p-2">
              <Link
                href="/rezervasyonlarim"
                onClick={() => setOpen(false)}
                className="hover:bg-muted block rounded-md px-3 py-2 text-center text-xs font-medium"
              >
                Tüm rezervasyonlarımı gör →
              </Link>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
