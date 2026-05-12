import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { CalendarDays, Lock, MapPin, ShieldCheck } from 'lucide-react';
import { Container } from '@/components/ui/container';
import { PaymentForm } from '@/components/payment/payment-form';
import { getBookingByCode } from '@/lib/db/queries/bookings';
import { requireUser } from '@/lib/security/auth';
import { formatDate, formatTRY } from '@/lib/utils/format';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Ödeme',
  description: 'Rezervasyonunuzu tamamlamak için ödeme bilgilerinizi girin.',
  robots: { index: false, follow: false },
};

type Params = { code: string };

export default async function PaymentPage({ params }: { params: Promise<Params> }) {
  await requireUser();
  const { code } = await params;
  const booking = await getBookingByCode(code);
  if (!booking) notFound();

  // Zaten onaylanmış bir rezervasyonu tekrar ödeme adımına çekme.
  if (booking.status === 'confirmed' || booking.status === 'used') {
    redirect(`/rezervasyonlarim/${code}`);
  }
  if (booking.status === 'cancelled') {
    redirect(`/rezervasyonlarim/${code}`);
  }

  const location = booking.deal
    ? [booking.deal.district, booking.deal.city].filter(Boolean).join(', ')
    : '';

  return (
    <Container className="py-10 sm:py-14">
      <div className="mb-8 flex flex-col gap-2 text-center">
        <p className="text-muted-foreground inline-flex items-center justify-center gap-1.5 text-xs font-semibold tracking-wide uppercase">
          <Lock className="size-3.5" aria-hidden="true" />
          Güvenli ödeme — mock akış
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Ödemeyi tamamla
        </h1>
        <p className="text-muted-foreground text-sm">
          Rezervasyon kodun{' '}
          <span className="text-foreground font-mono font-semibold">
            {booking.booking_code}
          </span>{' '}
          — onay için ödemeyi tamamla.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <PaymentForm bookingCode={booking.booking_code} total={Number(booking.total_amount)} />

        <aside className="border-border bg-background flex h-fit flex-col gap-4 rounded-xl border p-5 shadow-sm">
          <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            Sipariş özeti
          </p>

          {booking.deal ? (
            <Link href={`/f/${booking.deal.slug}`} className="flex items-center gap-3">
              <div className="bg-muted relative size-16 shrink-0 overflow-hidden rounded-lg">
                <Image
                  src={booking.deal.cover_image}
                  alt={booking.deal.title}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="line-clamp-2 text-sm font-semibold leading-tight">
                  {booking.deal.title}
                </h2>
                {booking.deal.merchant?.name ? (
                  <p className="text-muted-foreground line-clamp-1 text-xs">
                    {booking.deal.merchant.name}
                  </p>
                ) : null}
              </div>
            </Link>
          ) : null}

          <ul className="text-muted-foreground flex flex-col gap-2 text-xs">
            {booking.selected_date ? (
              <li className="inline-flex items-center gap-1.5">
                <CalendarDays className="size-3.5" aria-hidden="true" />
                {formatDate(booking.selected_date)}
                {booking.selected_time ? ` · ${booking.selected_time.slice(0, 5)}` : ''}
              </li>
            ) : null}
            {location ? (
              <li className="inline-flex items-center gap-1.5">
                <MapPin className="size-3.5" aria-hidden="true" />
                {location}
              </li>
            ) : null}
            <li>{booking.quantity} adet</li>
          </ul>

          <div className="border-border space-y-2 border-t pt-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ara toplam</span>
              <span>{formatTRY(Number(booking.total_amount))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Hizmet bedeli</span>
              <span className="text-emerald-600 dark:text-emerald-400">Ücretsiz</span>
            </div>
            <div className="border-border flex items-baseline justify-between border-t pt-2 text-base font-semibold">
              <span>Toplam</span>
              <span>{formatTRY(Number(booking.total_amount))}</span>
            </div>
          </div>

          <p className="text-muted-foreground inline-flex items-start gap-1.5 text-[11px]">
            <ShieldCheck className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            Bu sürüm <strong className="text-foreground">mock</strong> ödemedir.
            Kart bilgilerin saklanmaz, gerçek tutar tahsil edilmez.
          </p>
        </aside>
      </div>
    </Container>
  );
}
