import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { CalendarDays, ChevronRight, MapPin, Ticket } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { listBookings } from '@/lib/db/queries/bookings';
import { requireUser } from '@/lib/security/auth';
import { BOOKING_STATUS_BADGE, BOOKING_STATUS_LABEL } from '@/lib/utils/booking-status';
import { cn } from '@/lib/utils/cn';
import type { BookingStatus } from '@/lib/utils/constants';
import { formatDate, formatTRY } from '@/lib/utils/format';

export const metadata: Metadata = {
  title: 'Rezervasyonlarım',
  description: 'Geçmiş ve aktif rezervasyonların.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function RezervasyonlarimPage() {
  await requireUser();
  const bookings = await listBookings();

  return (
    <Container className="py-12 sm:py-16">
      <header className="mb-8 flex flex-col gap-2">
        <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
          Profil
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Rezervasyonlarım</h1>
        <p className="text-muted-foreground text-sm">
          {bookings.length === 0
            ? 'Henüz bir rezervasyonun yok.'
            : `${bookings.length} rezervasyon`}
        </p>
      </header>

      {bookings.length === 0 ? (
        <div className="border-border bg-muted/40 flex flex-col items-center gap-4 rounded-xl border border-dashed p-12 text-center">
          <span className="bg-background border-border inline-flex size-14 items-center justify-center rounded-full border">
            <Ticket className="text-foreground/60 size-6" aria-hidden="true" />
          </span>
          <p className="text-muted-foreground max-w-md">
            Henüz rezervasyon almadın. Beğendiğin bir fırsata git, “Rezervasyon Yap” de.
          </p>
          <Link href="/" className={cn(buttonVariants({ variant: 'outline' }), 'mt-2')}>
            Fırsatları keşfet
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {bookings.map((b) => (
            <li key={b.id}>
              <Link
                href={`/rezervasyonlarim/${b.booking_code}`}
                className="border-border bg-background hover:bg-muted/40 flex items-center gap-4 rounded-lg border p-3 transition-colors sm:p-4"
              >
                {b.deal ? (
                  <div className="relative size-20 shrink-0 overflow-hidden rounded-md sm:size-24">
                    <Image
                      src={b.deal.cover_image}
                      alt={b.deal.title}
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="bg-muted size-20 shrink-0 rounded-md sm:size-24" />
                )}

                <div className="min-w-0 flex-1">
                  <div className="mb-1.5 flex flex-wrap items-center gap-2">
                    <Badge
                      variant={BOOKING_STATUS_BADGE[b.status as BookingStatus]}
                      size="sm"
                    >
                      {BOOKING_STATUS_LABEL[b.status as BookingStatus]}
                    </Badge>
                    <span className="text-muted-foreground font-mono text-[11px]">
                      {b.booking_code}
                    </span>
                  </div>
                  <p className="line-clamp-1 text-sm font-semibold">
                    {b.deal?.title ?? 'Silinmiş fırsat'}
                  </p>
                  <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs">
                    {b.selected_date ? (
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="size-3.5" aria-hidden="true" />
                        {formatDate(b.selected_date)}
                        {b.selected_time ? ` · ${b.selected_time.slice(0, 5)}` : ''}
                      </span>
                    ) : null}
                    {b.deal && (b.deal.district || b.deal.city) ? (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="size-3.5" aria-hidden="true" />
                        {[b.deal.district, b.deal.city].filter(Boolean).join(', ')}
                      </span>
                    ) : null}
                    <span>
                      {b.quantity} adet · {formatTRY(b.total_amount)}
                    </span>
                  </div>
                </div>

                <ChevronRight
                  className="text-muted-foreground hidden size-5 shrink-0 sm:block"
                  aria-hidden="true"
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}
