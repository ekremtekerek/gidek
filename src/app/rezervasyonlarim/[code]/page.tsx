import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Clock, Gift, MessageSquare, Tag } from 'lucide-react';
import { AddToCalendar } from '@/components/booking/add-to-calendar';
import { CancelButton } from '@/components/booking/cancel-button';
import { ETicket } from '@/components/booking/eticket';
import { PrintButton } from '@/components/booking/print-button';
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
import { formatDate } from '@/lib/utils/format';

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
  const showTicket = (status === 'confirmed' || status === 'used') && booking.deal;

  return (
    <Container className="py-10 sm:py-14">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/rezervasyonlarim"
          className="text-muted-foreground hover:text-foreground gidek-no-print mb-6 inline-flex items-center gap-1 text-sm"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Tüm rezervasyonlar
        </Link>

        <header className="mb-6 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <Badge variant={BOOKING_STATUS_BADGE[status]} size="md">
              {BOOKING_STATUS_LABEL[status]}
            </Badge>
            <div className="flex flex-wrap items-center gap-2">
              {showTicket && booking.deal ? (
                <AddToCalendar
                  bookingCode={booking.booking_code}
                  dealTitle={booking.deal.title}
                  location={location ?? undefined}
                  selectedDate={booking.selected_date}
                  selectedTime={booking.selected_time}
                  durationMinutes={booking.deal.duration_minutes}
                  detailUrl={`${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/rezervasyonlarim/${booking.booking_code}`}
                />
              ) : null}
              {showTicket ? <PrintButton /> : null}
            </div>
          </div>
        </header>

        {booking.is_gift ? (
          <div className="border-rose-500/30 bg-rose-500/5 mb-6 flex items-start gap-3 rounded-xl border p-4">
            <Gift className="size-5 shrink-0 text-rose-600 dark:text-rose-400" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-foreground text-sm font-medium">
                Bu bir hediye rezervasyon
              </p>
              <p className="text-muted-foreground mt-0.5 text-xs">
                Alıcı: {booking.guest_name ?? '—'}
                {booking.guest_phone ? ` · ${booking.guest_phone}` : ''}
                {booking.guest_email ? ` · ${booking.guest_email}` : ''}
              </p>
              {booking.gift_message ? (
                <p className="text-foreground/90 mt-2 rounded-md border border-rose-500/20 bg-background/60 p-2.5 text-xs italic leading-relaxed">
                  &ldquo;{booking.gift_message}&rdquo;
                </p>
              ) : null}
            </div>
          </div>
        ) : null}

        {status === 'pending' ? (
          <div className="border-amber-500/30 bg-amber-500/10 mb-6 flex flex-col gap-3 rounded-xl border p-5 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">Bu rezervasyon ödeme bekliyor</p>
              <p className="text-muted-foreground mt-0.5 text-xs">
                Ödemeyi tamamla, e-biletin hemen oluşsun.
              </p>
            </div>
            <Link
              href={`/odeme/${booking.booking_code}`}
              className={cn(buttonVariants({ variant: 'primary', size: 'sm' }), 'shrink-0')}
            >
              Ödemeye geç
            </Link>
          </div>
        ) : null}

        {showTicket && booking.deal ? (
          <ETicket
            bookingCode={booking.booking_code}
            dealTitle={booking.deal.title}
            dealCover={booking.deal.cover_image}
            merchantName={booking.deal.merchant?.name}
            location={location ?? undefined}
            selectedDate={booking.selected_date}
            selectedTime={booking.selected_time}
            quantity={booking.quantity}
            totalAmount={booking.total_amount}
          />
        ) : null}

        <dl className="border-border bg-background gidek-no-print mt-6 divide-y divide-[var(--border)] rounded-lg border">
          {Number(booking.discount_amount ?? 0) > 0 ? (
            <div className="flex items-center gap-4 p-4 sm:p-5">
              <Tag className="size-5 shrink-0 text-emerald-600" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <dt className="text-muted-foreground text-xs">Uygulanan kupon</dt>
                <dd className="text-sm font-medium">
                  {booking.coupon_code ?? '—'}{' '}
                  <span className="text-emerald-700 dark:text-emerald-300">
                    (−{Number(booking.discount_amount).toLocaleString('tr-TR')} ₺)
                  </span>
                </dd>
              </div>
            </div>
          ) : null}
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

        <div className="gidek-no-print mt-6 flex flex-col gap-3">
          {isCancellable(status) ? <CancelButton bookingId={booking.id} /> : null}

          {!isCancellable(status) && status !== 'pending' ? (
            <div className="border-border bg-muted/40 flex items-start gap-3 rounded-lg border p-4">
              <p className="text-muted-foreground text-sm">
                Bu rezervasyon <strong className="text-foreground">{BOOKING_STATUS_LABEL[status]}</strong>{' '}
                durumunda — iptal edilemez.
              </p>
            </div>
          ) : null}

          {booking.deal ? (
            <Link
              href={`/f/${booking.deal.slug}`}
              className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'w-full')}
            >
              Fırsat sayfasına dön
            </Link>
          ) : null}
        </div>

        <p className="text-muted-foreground gidek-no-print mt-6 text-center text-xs">
          <strong className="text-foreground">Mock rezervasyon.</strong> Gerçek ödeme alınmaz; bu
          kod yalnızca demo akış içindir.
        </p>
      </div>
    </Container>
  );
}
