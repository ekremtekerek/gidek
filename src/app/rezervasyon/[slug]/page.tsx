import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { MapPin } from 'lucide-react';
import { BookingForm } from '@/components/booking/booking-form';
import { Badge } from '@/components/ui/badge';
import { Container } from '@/components/ui/container';
import { getDealBySlug } from '@/lib/db/queries/deals';
import { getCurrentUser } from '@/lib/security/auth';
import { formatTRY } from '@/lib/utils/format';

export const metadata: Metadata = {
  title: 'Rezervasyon',
  description: 'Fırsat rezervasyonunu tamamla.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

type Params = { slug: string };

export default async function RezervasyonPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;

  const user = await getCurrentUser();
  if (!user) redirect(`/giris?next=/rezervasyon/${slug}`);

  const deal = await getDealBySlug(slug);
  if (!deal) notFound();

  const location = [deal.district, deal.city].filter(Boolean).join(', ');
  const validUntilDate = new Date(deal.valid_until).toISOString().slice(0, 10);
  const unitPrice = Number(deal.discounted_price);
  const showDiscount = (deal.discount_percent ?? 0) > 0 && unitPrice < Number(deal.original_price);

  return (
    <Container className="py-10 sm:py-14">
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1fr_1.2fr]">
        {/* Left: deal summary */}
        <aside className="border-border bg-background flex h-fit flex-col gap-4 rounded-xl border p-5 sm:p-6">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg">
            <Image
              src={deal.cover_image}
              alt={deal.title}
              fill
              sizes="(min-width: 1024px) 35vw, 100vw"
              className="object-cover"
            />
            {showDiscount ? (
              <div className="absolute top-3 left-3">
                <Badge variant="discount" size="md">
                  %{deal.discount_percent} indirim
                </Badge>
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-1">
            <Link href={`/f/${deal.slug}`} className="hover:underline">
              <h2 className="text-lg leading-snug font-semibold">{deal.title}</h2>
            </Link>
            {deal.merchant ? (
              <p className="text-muted-foreground text-sm">{deal.merchant.name}</p>
            ) : null}
            {location ? (
              <p className="text-muted-foreground inline-flex items-center gap-1 text-xs">
                <MapPin className="size-3.5" aria-hidden="true" />
                {location}
              </p>
            ) : null}
          </div>

          <div className="border-border border-t pt-3">
            <div className="flex items-baseline justify-between">
              <span className="text-muted-foreground text-xs">Adet başı</span>
              <div className="flex items-baseline gap-2">
                {showDiscount ? (
                  <span className="text-muted-foreground text-xs line-through">
                    {formatTRY(deal.original_price)}
                  </span>
                ) : null}
                <span className="text-base font-semibold">{formatTRY(unitPrice)}</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Right: form */}
        <section>
          <header className="mb-6">
            <p className="text-muted-foreground mb-1 text-xs font-semibold tracking-wide uppercase">
              Rezervasyon
            </p>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Detayları gir, hazır
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Bilgilerini doğrula ve rezervasyonu tamamla. Mock akış — gerçek ödeme alınmaz.
            </p>
          </header>

          <BookingForm
            dealId={deal.id}
            unitPrice={unitPrice}
            maxPerUser={deal.max_per_user}
            validUntilDate={validUntilDate}
          />
        </section>
      </div>
    </Container>
  );
}
