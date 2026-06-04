'use client';

import { useActionState } from 'react';
import Image from 'next/image';
import { CalendarDays, Clock, Loader2, Ticket, Users } from 'lucide-react';
import { confirmAgentBookingAction } from '@/components/kesfet/agent-booking-action';
import { Button } from '@/components/ui/button';
import type { ConfirmBookingState } from '@/lib/booking/agent-booking';
import { formatTRY } from '@/lib/utils/format';

/** prepareBooking tool'undan dönen başarılı quote — kartın render verisi. */
export interface BookingQuoteCardData {
  dealId: string;
  slug: string;
  title: string;
  coverImage: string;
  location: string;
  unitPrice: number;
  quantity: number;
  total: number;
  currency: string;
  selectedDate: string;
  selectedTime: string | null;
}

const INITIAL: ConfirmBookingState = null;

function formatDateTR(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' });
}

/**
 * AI sohbette gösterilen rezervasyon onay kartı. Agent fırsatı + tarihi +
 * kişi sayısını hazırlar; rezervasyon ANCAK kullanıcı butona basınca oluşur
 * (geri alınması zor aksiyon → kullanıcı onayı şart). Onaylanınca server
 * action booking'i yazıp ödeme sayfasına yönlendirir.
 */
export function BookingQuoteCard({ quote }: { quote: BookingQuoteCardData }) {
  const [state, formAction, pending] = useActionState(confirmAgentBookingAction, INITIAL);

  return (
    <div className="border-border bg-background w-full max-w-md overflow-hidden rounded-xl border shadow-sm">
      <div className="flex gap-3 p-3">
        <div className="relative size-20 shrink-0 overflow-hidden rounded-lg">
          <Image
            src={quote.coverImage}
            alt={quote.title}
            fill
            sizes="80px"
            className="object-cover"
          />
        </div>
        <div className="flex min-w-0 flex-col gap-0.5">
          <p className="text-xs font-semibold tracking-wide text-violet-600 uppercase dark:text-violet-300">
            Rezervasyon özeti
          </p>
          <p className="line-clamp-2 text-sm leading-snug font-semibold">{quote.title}</p>
          {quote.location ? (
            <p className="text-muted-foreground text-xs">{quote.location}</p>
          ) : null}
        </div>
      </div>

      <div className="border-border grid grid-cols-2 gap-x-3 gap-y-2 border-t px-3 py-3 text-sm">
        <span className="flex items-center gap-1.5">
          <CalendarDays className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
          {formatDateTR(quote.selectedDate)}
        </span>
        {quote.selectedTime ? (
          <span className="flex items-center gap-1.5">
            <Clock className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
            {quote.selectedTime}
          </span>
        ) : null}
        <span className="flex items-center gap-1.5">
          <Users className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
          {quote.quantity} kişi
        </span>
        <span className="flex items-center gap-1.5">
          <Ticket className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
          {formatTRY(quote.unitPrice)} / kişi
        </span>
      </div>

      <div className="border-border flex items-center justify-between border-t px-3 py-2.5">
        <span className="text-muted-foreground text-xs">Toplam</span>
        <span className="text-base font-semibold">{formatTRY(quote.total)}</span>
      </div>

      {state && !state.ok ? (
        <p
          role="alert"
          className="bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:bg-rose-950/30 dark:text-rose-300"
        >
          {state.error}
        </p>
      ) : null}

      <form action={formAction} className="flex flex-col gap-1.5 p-3">
        <input type="hidden" name="dealId" value={quote.dealId} />
        <input type="hidden" name="quantity" value={quote.quantity} />
        <input type="hidden" name="date" value={quote.selectedDate} />
        {quote.selectedTime ? <input type="hidden" name="time" value={quote.selectedTime} /> : null}
        <Button type="submit" variant="primary" size="lg" full disabled={pending}>
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Oluşturuluyor…
            </>
          ) : (
            'Rezervasyonu oluştur ve ödemeye geç'
          )}
        </Button>
        <p className="text-muted-foreground/70 text-center text-[11px]">
          Onaylayınca ödeme adımına yönlendirilirsin.
        </p>
      </form>
    </div>
  );
}
