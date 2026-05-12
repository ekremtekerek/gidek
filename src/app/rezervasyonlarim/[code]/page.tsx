import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, CalendarDays, Clock, MapPin, MessageSquare, Ticket } from 'lucide-react';
import { CancelButton } from '@/components/booking/cancel-button';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { getBookingByCode } from '@/lib/db/queries/bookings';
import { requireUser } from '@/lib/security/auth';
import {
  BOOKING_STATUS_BADGE,
  BOOKING_STATUS_LABEL,
  isCancellable,
} from '@/lib/utils/booking-status';
import { cn } from '@/lib/utils/cn';
import type { BookingStatus } from '@/lib/utils/constants';
import { formatDate, formatTRY } from '@/lib/utils/format';

export const metadata: Metadata = {
  title: 'Rezervasyon detayı',
  description: 'Rezervasyon detayı ve iptal seçeneği.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

type Params = { code: string };

export default async function RezervasyonDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { code } = await params;
  await requireUser();

  const booking = await getBookingByCode(code);
  if (!booking) notFound();

  const status = booking.status as BookingStatus;
  const location = booking.deal
    ? [booking.deal.district, booking.deal.city].filter(Boolean).join(', ')
    : null;

  return (
    <Container className="py-10 sm:py-14">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/rezervasyonlarim"
          className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-1 text-sm"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Tüm rezervasyonlar
        </Link>

        <header className="mb-6 flex flex-col gap-3">
          <Badge variant={BOOKING_STATUS_BADGE[status]} size="md" className="self-start">
            {BOOKING_STATUS_LABEL[status]}
          </Badge>
          <div className="flex items-baseline gap-3">
            <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              Rezervasyon kodu
            </p>
            <p className="font-mono text-sm">{booking.booking_code}</p>
          </div>
        </header>

        {booking.deal ? (
          <Link
            href={`/f/${booking.deal.slug}`}
            className="border-border bg-background hover:bg-muted/40 mb-6 flex items-center gap-4 rounded-lg border p-3 transition-colors sm:p-4"
          >
            <div className="relative size-20 shrink-0 overflow-hidden rounded-md sm:size-24">
              <Image
                src={booking.deal.cover_image}
                alt={booking.deal.title}
                fill
                sizes="96px"
                className="object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-sm font-semibold">{booking.deal.title}</p>
              {booking.deal.merchant ? (
                <p className="text-muted-foreground text-xs">{booking.deal.merchant.name}</p>
              ) : null}
              {location ? (
                <p className="text-muted-foreground mt-1 inline-flex items-center gap-1 text-xs">
                  <MapPin className="size-3.5" aria-hidden="true" />
                  {location}
                </p>
              ) : null}
            </div>
          </Link>
        ) : null}

        <dl className="border-border bg-background mb-6 divide-y divide-[var(--border)] rounded-lg border">
          {booking.selected_date ? (
            <div className="flex items-start gap-4 p-4 sm:p-5">
              <CalendarDays className="text-muted-foreground size-5 shrink-0" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <dt className="text-muted-foreground text-xs">Tarih</dt>
                <dd className="text-sm font-medium">
                  {formatDate(booking.selected_date)}
                  {booking.selected_time ? ` · ${booking.selected_time.slice(0, 5)}` : ''}
                </dd>
              </div>
            </div>
          ) : null}
          <div className="flex items-start gap-4 p-4 sm:p-5">
            <Ticket className="text-muted-foreground size-5 shrink-0" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <dt className="text-muted-foreground text-xs">Adet ve tutar</dt>
              <dd className="text-sm font-medium">
                {booking.quantity} adet · {formatTRY(booking.total_amount)}
              </dd>
            </div>
          </div>
          {booking.notes ? (
            <div className="flex items-start gap-4 p-4 sm:p-5">
              <MessageSquare
                className="text-muted-foreground mt-0.5 size-5 shrink-0"
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1">
                <dt className="text-muted-foreground text-xs">Not</dt>
                <dd className="text-sm whitespace-pre-line">{booking.notes}</dd>
              </div>
            </div>
          ) : null}
          <div className="flex items-start gap-4 p-4 sm:p-5">
            <Clock className="text-muted-foreground size-5 shrink-0" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <dt className="text-muted-foreground text-xs">Oluşturma tarihi</dt>
              <dd className="text-sm font-medium">{formatDate(booking.created_at)}</dd>
            </div>
          </div>
        </dl>

        {isCancellable(status) ? (
          <CancelButton bookingId={booking.id} />
        ) : (
          <div className="border-border bg-muted/40 flex items-start gap-3 rounded-lg border p-4">
            <p className="text-muted-foreground text-sm">
              Bu rezervasyon <strong className="text-foreground">{BOOKING_STATUS_LABEL[status]}</strong>{' '}
              durumunda — iptal edilemez.
            </p>
          </div>
        )}

        <p className="text-muted-foreground mt-6 text-center text-xs">
          <strong className="text-foreground">Mock rezervasyon.</strong> Gerçek ödeme alınmaz; bu
          kod yalnızca demo akış içindir.
        </p>

        {booking.deal ? (
          <Link
            href={`/f/${booking.deal.slug}`}
            className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'mt-4 w-full')}
          >
            Fırsat sayfasına dön
          </Link>
        ) : null}
      </div>
    </Container>
  );
}
