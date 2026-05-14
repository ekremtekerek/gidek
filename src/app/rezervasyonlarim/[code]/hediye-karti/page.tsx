import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Gift, Heart, Printer, QrCode } from 'lucide-react';
import { Container } from '@/components/ui/container';
import { getBookingByCode } from '@/lib/db/queries/bookings';
import { requireUser } from '@/lib/security/auth';
import { BLUR_DATA_URL } from '@/lib/utils/blur';
import { formatDate, formatTRY } from '@/lib/utils/format';
import { PrintButton } from '@/components/booking/print-button';

export const metadata: Metadata = {
  title: 'Hediye kartı',
  description: 'Alıcıya gönderilebilir estetik hediye kartı.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ code: string }>;
}

export default async function GiftCardPage({ params }: PageProps) {
  const { code } = await params;
  await requireUser();
  const booking = await getBookingByCode(code);
  if (!booking || !booking.is_gift) notFound();

  const dealTitle = booking.deal?.title ?? 'Bir gidek deneyimi';
  const recipientName = booking.guest_name ?? 'Sevgili dostum';
  const message =
    booking.gift_message?.trim() ||
    'Birlikte unutulmaz bir an yaşamamız için seninle paylaşmak istediğim bir hediye 🎁';

  const qrUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/rezervasyonlarim/${booking.booking_code}`;
  // Use QR Server public API for QR rendering (no extra dep). Print-safe PNG.
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(qrUrl)}`;

  const location = booking.deal
    ? [booking.deal.district, booking.deal.city].filter(Boolean).join(', ')
    : null;

  return (
    <>
      <Container className="gidek-no-print py-6">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link
            href={`/rezervasyonlarim/${booking.booking_code}`}
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Rezervasyon detayı
          </Link>
          <div className="inline-flex items-center gap-2">
            <PrintButton />
          </div>
        </div>
        <p className="text-muted-foreground mx-auto mt-3 max-w-3xl text-center text-xs">
          Yazdırmak yerine <strong className="text-foreground">PDF olarak kaydet</strong>{' '}
          seçeneğini de kullanabilirsin — tarayıcının yazdırma diyaloğunda &quot;Hedef: PDF&quot;.
        </p>
      </Container>

      {/* Gift card — print-styled A5 landscape feel */}
      <main className="gift-card-print mx-auto my-6 max-w-3xl px-4 print:my-0 print:max-w-none print:px-0">
        <article className="from-rose-500 via-pink-500 to-amber-500 relative overflow-hidden rounded-3xl bg-gradient-to-br p-1 shadow-2xl print:rounded-none print:shadow-none">
          <div className="bg-background relative rounded-3xl p-8 sm:p-10 print:rounded-none">
            {/* Dekoratif noktalar */}
            <span className="absolute right-6 top-6 size-2 rounded-full bg-rose-500/40" />
            <span className="absolute right-10 top-12 size-3 rounded-full bg-amber-500/40" />
            <span className="absolute left-8 bottom-8 size-2.5 rounded-full bg-pink-500/40" />
            <span className="absolute left-14 bottom-14 size-1.5 rounded-full bg-rose-500/40" />

            <header className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="bg-gradient-to-r from-rose-500 to-amber-500 bg-clip-text text-xs font-bold uppercase tracking-widest text-transparent">
                  Hediye kartı
                </p>
                <p className="text-foreground/60 mt-1 text-[11px]">
                  gidek.net · {formatDate(new Date().toISOString())}
                </p>
              </div>
              <span className="bg-gradient-to-br from-rose-500 to-amber-500 inline-flex size-12 items-center justify-center rounded-2xl text-white shadow-md">
                <Gift className="size-6" aria-hidden="true" />
              </span>
            </header>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-[1fr_240px] sm:items-center">
              <div>
                <p className="text-muted-foreground text-xs">Sevgili</p>
                <p className="text-foreground bg-gradient-to-r from-rose-600 to-amber-500 bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl">
                  {recipientName}
                </p>

                <blockquote className="border-rose-500/30 mt-4 border-l-4 pl-4 text-base italic leading-relaxed">
                  &ldquo;{message}&rdquo;
                </blockquote>

                {booking.deal ? (
                  <div className="border-border mt-5 flex items-start gap-3 rounded-xl border bg-muted/20 p-3">
                    {booking.deal.cover_image ? (
                      <Image
                        src={booking.deal.cover_image}
                        alt={dealTitle}
                        width={72}
                        height={56}
                        className="aspect-[4/3] size-16 rounded-md object-cover"
                        placeholder="blur"
                        blurDataURL={BLUR_DATA_URL}
                      />
                    ) : null}
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-semibold leading-snug">
                        {dealTitle}
                      </p>
                      <p className="text-muted-foreground mt-0.5 text-[11px]">
                        {location ?? '—'}{' '}
                        {booking.selected_date ? `· ${formatDate(booking.selected_date)}` : ''}
                        {booking.selected_time ? ` · ${booking.selected_time}` : ''}
                      </p>
                      <p className="text-foreground/80 mt-1 text-xs">
                        {booking.quantity} kişilik · {formatTRY(Number(booking.total_amount))}
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="flex flex-col items-center gap-3 sm:items-end">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrSrc}
                  alt={`Rezervasyon kodu ${booking.booking_code}`}
                  className="border-border size-40 rounded-xl border bg-white p-2 shadow-sm sm:size-48"
                  width={192}
                  height={192}
                />
                <div className="text-center sm:text-right">
                  <p className="text-muted-foreground inline-flex items-center gap-1 text-[10px] tracking-wider uppercase">
                    <QrCode className="size-3" aria-hidden="true" />
                    Rezervasyon kodu
                  </p>
                  <p className="font-mono mt-0.5 text-sm font-bold tracking-wide">
                    {booking.booking_code}
                  </p>
                </div>
              </div>
            </div>

            <footer className="border-border mt-8 flex items-center justify-between gap-3 border-t pt-5">
              <p className="text-muted-foreground inline-flex items-center gap-1.5 text-[11px]">
                <Heart className="size-3 fill-rose-500 text-rose-500" aria-hidden="true" />
                gidek.net · keyifli anılar için
              </p>
              <p className="text-muted-foreground inline-flex items-center gap-1 text-[11px]">
                <Printer className="size-3" aria-hidden="true" />
                PDF / yazdır
              </p>
            </footer>
          </div>
        </article>
      </main>

      <style>{`
        @media print {
          @page { size: A5 landscape; margin: 0; }
          body { background: white !important; }
          .gidek-no-print { display: none !important; }
          .gift-card-print { padding: 0 !important; margin: 0 !important; }
        }
      `}</style>
    </>
  );
}
