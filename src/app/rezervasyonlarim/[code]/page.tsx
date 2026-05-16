import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Clock, Gift, MessageSquare, Tag } from 'lucide-react';
import { AddToCalendar } from '@/components/booking/add-to-calendar';
import { AttendeesSection } from '@/components/booking/attendees-section';
import { CancelButton } from '@/components/booking/cancel-button';
import { ETicket } from '@/components/booking/eticket';
import { EventChat } from '@/components/booking/event-chat';
import { ExtendButton } from '@/components/booking/extend-button';
import { HotelBookingSummary } from '@/components/booking/hotel-booking-summary';
import { PrintButton } from '@/components/booking/print-button';
import { RefundCouponBanner } from '@/components/booking/refund-coupon-banner';
import { getServerClient } from '@/lib/db/server';
import { getServiceClient } from '@/lib/db/service';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { getBookingByCode } from '@/lib/db/queries/bookings';
import { getHotelExtrasForBooking } from '@/lib/db/queries/hotel';
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
  const user = await requireUser();

  const booking = await getBookingByCode(code);
  if (!booking) notFound();

  const status = booking.status as BookingStatus;
  const location = booking.deal
    ? [booking.deal.district, booking.deal.city].filter(Boolean).join(', ')
    : null;
  const showTicket = (status === 'confirmed' || status === 'used') && booking.deal;

  const isHotelBooking = Boolean(booking.room_type_id);
  const hotelExtras = isHotelBooking
    ? await getHotelExtrasForBooking(booking.id, booking.room_type_id)
    : null;

  // İptal edilmiş booking için iade kuponu lookup
  let refundCoupon: { code: string; amount: number } | null = null;
  if (status === 'cancelled') {
    const svc = getServiceClient();
    const { data: rc } = await svc
      .from('user_refund_coupons')
      .select('coupon_code, refund_value')
      .eq('booking_id', booking.id)
      .maybeSingle();
    if (rc) {
      refundCoupon = { code: rc.coupon_code, amount: Number(rc.refund_value) };
    }
  }

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
            <div className="min-w-0 flex-1">
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
              <Link
                href={`/rezervasyonlarim/${booking.booking_code}/hediye-karti`}
                className={cn(
                  buttonVariants({ variant: 'primary', size: 'sm' }),
                  'mt-3 bg-gradient-to-r from-rose-500 to-amber-500 text-white hover:from-rose-600 hover:to-amber-600',
                )}
              >
                <Gift className="size-4" aria-hidden="true" />
                Hediye kartını indir
              </Link>
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

        {refundCoupon ? (
          <RefundCouponBanner code={refundCoupon.code} amount={refundCoupon.amount} />
        ) : null}

        {isHotelBooking && hotelExtras ? (
          <section className="mt-6">
            <h2 className="mb-3 text-sm font-semibold tracking-wide uppercase text-muted-foreground">
              Konaklama detayı
            </h2>
            <HotelBookingSummary
              booking={{
                check_in_date: booking.check_in_date,
                check_out_date: booking.check_out_date,
                nights: booking.nights,
                adult_count: booking.adult_count,
                child_count: booking.child_count,
                board_basis: booking.board_basis,
                tourism_tax_total: Number(booking.tourism_tax_total ?? 0),
                unit_price: Number(booking.unit_price),
                total_amount: Number(booking.total_amount),
              }}
              room={hotelExtras.room}
              guests={hotelExtras.guests}
              variant="full"
            />
          </section>
        ) : null}

        {showTicket && !isHotelBooking ? <AttendeesSection bookingCode={booking.booking_code} /> : null}

        {showTicket && booking.deal ? (
          <EventChatGate
            bookingCode={booking.booking_code}
            dealId={booking.deal_id}
            selectedDate={booking.selected_date}
            selectedTime={booking.selected_time}
            currentUserId={user.id}
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
          {isCancellable(status) && booking.deal ? (
            <ExtendButton
              bookingId={booking.id}
              currentQuantity={booking.quantity}
              unitPrice={Number(booking.unit_price)}
              maxPerUser={booking.deal.max_per_user}
            />
          ) : null}
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

/**
 * Server component — sohbet için ilk mesajları + room key'i çeker, sonra
 * EventChat client widget'a iletir.
 */
async function EventChatGate({
  bookingCode,
  dealId,
  selectedDate,
  selectedTime,
  currentUserId,
}: {
  bookingCode: string;
  dealId: string;
  selectedDate: string | null;
  selectedTime: string | null;
  currentUserId: string;
}) {
  const supabase = await getServerClient();
  const { data: roomKey } = await supabase.rpc('build_event_room_key', {
    p_deal_id: dealId,
    p_date: selectedDate,
    p_time: selectedTime,
  });
  if (!roomKey) return null;

  // İlk mesajlar — son 50, eski→yeni sırada
  const { data: rawMessages } = await supabase
    .from('event_messages')
    .select(
      `id, body, created_at, sender:profiles!sender_id (
         id, display_name, public_slug, avatar_url
       )`,
    )
    .eq('room_key', roomKey)
    .order('created_at', { ascending: false })
    .limit(50);

  type Raw = {
    id: string;
    body: string;
    created_at: string;
    sender:
      | { id: string; display_name: string | null; public_slug: string | null; avatar_url: string | null }
      | { id: string; display_name: string | null; public_slug: string | null; avatar_url: string | null }[]
      | null;
  };
  const initial = ((rawMessages ?? []) as unknown as Raw[])
    .map((r) => {
      const s = Array.isArray(r.sender) ? r.sender[0] : r.sender;
      if (!s) return null;
      return {
        id: r.id,
        body: r.body,
        created_at: r.created_at,
        sender: s,
      };
    })
    .filter((m): m is NonNullable<typeof m> => m !== null)
    .reverse();

  // Katılımcı sayısı (rough — RLS'ten ötürü read da limit'li olabilir)
  const participantHint = new Set(initial.map((m) => m.sender.id)).size;

  return (
    <EventChat
      bookingCode={bookingCode}
      roomKey={roomKey}
      currentUserId={currentUserId}
      initialMessages={initial}
      participantHint={participantHint}
    />
  );
}
