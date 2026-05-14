'use client';

import { useState } from 'react';
import { Apple, CalendarPlus, ChevronDown, Globe } from 'lucide-react';
import {
  buildIcsContent,
  downloadIcs,
  googleCalendarUrl,
  type CalendarEventInput,
} from '@/lib/utils/calendar';
import { cn } from '@/lib/utils/cn';

interface Props {
  bookingCode: string;
  dealTitle: string;
  location?: string;
  selectedDate: string | null;
  selectedTime: string | null;
  /** Süre dakika — yoksa varsayılan 2 saat */
  durationMinutes?: number | null;
  /** Detay URL (rezervasyonlarim/code) */
  detailUrl: string;
}

/**
 * "Takvime ekle" dropdown — Google Calendar deep link + Apple/Outlook için
 * .ics indirme. Tarihi olmayan booking'lerde render etmez (selectedDate null).
 */
export function AddToCalendar({
  bookingCode,
  dealTitle,
  location,
  selectedDate,
  selectedTime,
  durationMinutes,
  detailUrl,
}: Props) {
  const [open, setOpen] = useState(false);

  if (!selectedDate) return null;

  // Tarih + saat birleştir; saat yoksa date-only kalır (helper ortalar)
  const start = selectedTime
    ? `${selectedDate}T${selectedTime.slice(0, 5)}:00`
    : selectedDate;

  const event: CalendarEventInput = {
    title: `gidek · ${dealTitle}`,
    description: `Rezervasyon kodu: ${bookingCode}\n\nE-bilet: ${detailUrl}`,
    location: location ?? undefined,
    start,
    durationMinutes: durationMinutes ?? undefined,
    url: detailUrl,
  };

  function onGoogle() {
    window.open(googleCalendarUrl(event), '_blank', 'noopener,noreferrer');
    setOpen(false);
  }

  function onIcs() {
    const ics = buildIcsContent(event);
    downloadIcs(`gidek-${bookingCode}.ics`, ics);
    setOpen(false);
  }

  return (
    <div className="gidek-no-print relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="border-border bg-background hover:bg-muted inline-flex h-10 items-center gap-2 rounded-md border px-4 text-sm font-medium transition-colors"
      >
        <CalendarPlus className="size-4" aria-hidden="true" />
        Takvime ekle
        <ChevronDown
          className={cn('size-3.5 transition-transform', open ? 'rotate-180' : null)}
          aria-hidden="true"
        />
      </button>

      {open ? (
        <>
          {/* Backdrop — dışına tıklayınca kapat */}
          <button
            type="button"
            aria-label="Kapat"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-30 cursor-default"
          />
          <div
            role="menu"
            className="border-border bg-background absolute right-0 top-full z-40 mt-1 min-w-[200px] overflow-hidden rounded-md border shadow-lg"
          >
            <button
              type="button"
              role="menuitem"
              onClick={onGoogle}
              className="hover:bg-muted flex w-full items-center gap-2 px-3 py-2 text-left text-sm"
            >
              <Globe className="size-4" aria-hidden="true" />
              Google Calendar
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={onIcs}
              className="hover:bg-muted flex w-full items-center gap-2 px-3 py-2 text-left text-sm"
            >
              <Apple className="size-4" aria-hidden="true" />
              Apple Calendar (.ics)
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
