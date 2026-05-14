import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { Calendar, Clock, MapPin, Users } from 'lucide-react';
import { FavoriteButton } from '@/components/favorites/favorite-button';
import { ImageGallery } from '@/components/deal/image-gallery';
import { LiveViewerCount } from '@/components/deal/live-viewer-count';
import { ReviewsSection } from '@/components/deal/reviews-section';
import { ShareButtons } from '@/components/share/share-buttons';
import { EtaBadge } from '@/components/deal/eta-badge';
import { LastMinuteBadge } from '@/components/deal/last-minute-badge';
import { OpenNowBadge } from '@/components/deal/open-now-badge';
import { ShowOnMap } from '@/components/deal/show-on-map';
import { WalkInPressure } from '@/components/deal/walk-in-pressure';
import { SimilarDeals } from '@/components/deal/similar-deals';
import { SocialProof } from '@/components/deal/social-proof';
import { StickyCta } from '@/components/deal/sticky-cta';
import { JsonLd } from '@/components/seo/json-ld';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { Skeleton } from '@/components/ui/skeleton';
import { getDealBySlug, isDealExpired, listPublishedDealSlugs } from '@/lib/db/queries/deals';
import { cn } from '@/lib/utils/cn';
import { AUDIENCE_LABEL, DEAL_TAG_LABEL } from '@/lib/utils/constants';
import { formatDuration, formatTRY } from '@/lib/utils/format';
import { SITE } from '@/lib/utils/site-config';

// ISR — sayfa 5 dakikada bir yeniden render edilir. Auth-bağımlı UI
// (FavoriteButton, StickyCta) statik render altında kalır; gerçek auth
// durumu client-side fetch ile alınır. Bu sayede LCP düşük, Googlebot
// hızlıca statik HTML görüyor.
export const revalidate = 300;

type Params = { slug: string };

// Yalnızca ilk 100 slug pre-render — gerisi ISR ile on-demand.
// 1000+ deal'da build memory'i şişirmemek için. dynamicParams default
// true; listede olmayan slug ilk istekte render olur, sonra cache'lenir.
export async function generateStaticParams(): Promise<Params[]> {
  const slugs = await listPublishedDealSlugs();
  return slugs.slice(0, 100).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const deal = await getDealBySlug(slug);
  if (!deal) return {};

  const title = deal.meta_title ?? deal.title;
  const description =
    deal.meta_description ?? deal.subtitle ?? deal.description.slice(0, 160);

  return {
    title,
    description,
    alternates: { canonical: `/f/${deal.slug}` },
    openGraph: {
      type: 'article',
      title,
      description,
      url: `${SITE.url}/f/${deal.slug}`,
      images: [{ url: deal.cover_image }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [deal.cover_image],
    },
  };
}

export default async function DealDetailPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const deal = await getDealBySlug(slug);
  if (!deal) notFound();

  const expired = isDealExpired(deal);

  const primaryCategory = deal.categories[0];
  const location = [deal.district, deal.city].filter(Boolean).join(', ');
  const duration = formatDuration(deal.duration_minutes);
  const discount = deal.discount_percent ?? 0;
  const showDiscount = discount > 0 && deal.discounted_price < deal.original_price;

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Ana sayfa', item: SITE.url },
      primaryCategory && {
        '@type': 'ListItem',
        position: 2,
        name: primaryCategory.name,
        item: `${SITE.url}/k/${primaryCategory.slug}`,
      },
      { '@type': 'ListItem', position: 3, name: deal.title, item: `${SITE.url}/f/${deal.slug}` },
    ].filter(Boolean),
  };

  const ratingAvg = deal.rating_avg ? Number(deal.rating_avg) : null;
  const ratingCount = deal.rating_count ?? 0;
  const hasRating = ratingAvg !== null && ratingCount > 0;

  const offerLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Offer',
    name: deal.title,
    description: deal.description,
    image: deal.cover_image,
    url: `${SITE.url}/f/${deal.slug}`,
    priceCurrency: deal.currency,
    price: deal.discounted_price,
    availability: expired
      ? 'https://schema.org/SoldOut'
      : 'https://schema.org/InStock',
    validFrom: deal.valid_from,
    priceValidUntil: deal.valid_until,
    seller: deal.merchant
      ? {
          '@type': 'LocalBusiness',
          name: deal.merchant.name,
          address: location ? { '@type': 'PostalAddress', addressLocality: location } : undefined,
        }
      : undefined,
  };
  if (hasRating) {
    offerLd.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: ratingAvg,
      reviewCount: ratingCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  // Event JSON-LD — sahne/etkinlik tipi fırsatlarda Google'da rich snippet
  // (tarih, yer, fiyat doğrudan SERP'te) gözüksün diye. Sadece event-benzeri
  // kategorilerde basıyoruz; spa/yemek/otel için Offer yeterli.
  const eventTypeMap: Record<string, string> = {
    tiyatro: 'TheaterEvent',
    konser: 'MusicEvent',
    'stand-up': 'ComedyEvent',
    aktivite: 'Event',
  };
  const eventType = primaryCategory ? eventTypeMap[primaryCategory.slug] : undefined;
  const eventLd: Record<string, unknown> | null = eventType
    ? {
        '@context': 'https://schema.org',
        '@type': eventType,
        name: deal.title,
        description: deal.description,
        image: [deal.cover_image, ...(deal.images ?? [])].filter(Boolean),
        startDate: deal.valid_from,
        endDate: deal.valid_until,
        eventStatus: 'https://schema.org/EventScheduled',
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
        location: {
          '@type': 'Place',
          name: deal.merchant?.name ?? location,
          address: {
            '@type': 'PostalAddress',
            addressLocality: deal.city ?? undefined,
            addressRegion: deal.district ?? undefined,
            addressCountry: 'TR',
          },
        },
        offers: {
          '@type': 'Offer',
          url: `${SITE.url}/f/${deal.slug}`,
          price: deal.discounted_price,
          priceCurrency: deal.currency,
          availability: expired
            ? 'https://schema.org/SoldOut'
            : 'https://schema.org/InStock',
          validFrom: deal.valid_from,
        },
        organizer: deal.merchant
          ? {
              '@type': 'Organization',
              name: deal.merchant.name,
              url: `${SITE.url}/m/${deal.merchant.slug}`,
            }
          : undefined,
      }
    : null;

  return (
    <>
      <Container className="pt-6 pb-16">
        <nav aria-label="Breadcrumb" className="text-muted-foreground mb-4 text-sm">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/" className="hover:text-foreground">
                Ana sayfa
              </Link>
            </li>
            {primaryCategory ? (
              <>
                <li aria-hidden="true">/</li>
                <li>
                  <Link
                    href={`/k/${primaryCategory.slug}`}
                    className="hover:text-foreground"
                  >
                    {primaryCategory.name}
                  </Link>
                </li>
              </>
            ) : null}
            <li aria-hidden="true">/</li>
            <li className="text-foreground line-clamp-1" aria-current="page">
              {deal.title}
            </li>
          </ol>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          {/* Left: image + content */}
          <div className="flex flex-col gap-6">
            <ImageGallery
              title={deal.title}
              cover={deal.cover_image}
              images={deal.images}
              discount={discount}
              isFeatured={deal.is_featured}
            />

            <header className="flex flex-col gap-3">
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{deal.title}</h1>
              {deal.subtitle ? (
                <p className="text-muted-foreground text-lg">{deal.subtitle}</p>
              ) : null}

              <ul className="text-muted-foreground flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                {deal.merchant ? (
                  <li>
                    <Link
                      href={`/m/${deal.merchant.slug}`}
                      className="text-foreground hover:underline underline-offset-2"
                    >
                      {deal.merchant.name}
                    </Link>
                  </li>
                ) : null}
                {location ? (
                  <li className="inline-flex items-center gap-1.5">
                    <MapPin className="size-4" aria-hidden="true" />
                    {location}
                  </li>
                ) : null}
                {duration ? (
                  <li className="inline-flex items-center gap-1.5">
                    <Clock className="size-4" aria-hidden="true" />
                    {duration}
                  </li>
                ) : null}
                {deal.audience.length > 0 ? (
                  <li className="inline-flex items-center gap-1.5">
                    <Users className="size-4" aria-hidden="true" />
                    {deal.audience.map((a) => AUDIENCE_LABEL[a] ?? a).join(', ')}
                  </li>
                ) : null}
              </ul>

              {deal.tags.length > 0 ? (
                <ul className="flex flex-wrap gap-1.5 pt-1">
                  {deal.tags.map((t) => (
                    <li key={t}>
                      <Badge variant="outline" size="sm">
                        {DEAL_TAG_LABEL[t] ?? t}
                      </Badge>
                    </li>
                  ))}
                </ul>
              ) : null}

              {!expired ? (
                <>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <SocialProof
                      soldCount={deal.sold_count ?? 0}
                      viewCount={deal.view_count ?? 0}
                      className="flex flex-wrap gap-2"
                    />
                    <LiveViewerCount dealSlug={deal.slug} minToShow={1} />
                    <WalkInPressure dealId={deal.id} />
                  </div>
                  <div className="pt-1">
                    <LastMinuteBadge validUntil={deal.valid_until} />
                  </div>
                </>
              ) : null}

              <div className="flex flex-wrap items-center gap-2 pt-2">
                {deal.merchant?.working_hours ? (
                  <OpenNowBadge
                    hours={deal.merchant.working_hours as Parameters<typeof OpenNowBadge>[0]['hours']}
                  />
                ) : null}
                {deal.merchant?.lat !== null && deal.merchant?.lat !== undefined &&
                deal.merchant.lng !== null && deal.merchant.lng !== undefined ? (
                  <EtaBadge
                    toLat={Number(deal.merchant.lat)}
                    toLng={Number(deal.merchant.lng)}
                  />
                ) : null}
              </div>

              {deal.merchant?.lat !== null && deal.merchant?.lat !== undefined &&
              deal.merchant.lng !== null && deal.merchant.lng !== undefined ? (
                <div className="pt-2">
                  <ShowOnMap
                    lat={Number(deal.merchant.lat)}
                    lng={Number(deal.merchant.lng)}
                    title={deal.merchant.name}
                    address={location}
                  />
                </div>
              ) : null}
            </header>

            <section aria-labelledby="description-heading">
              <h2 id="description-heading" className="text-xl font-semibold tracking-tight">
                Açıklama
              </h2>
              <p className="text-foreground/90 mt-3 leading-relaxed whitespace-pre-line">
                {deal.description}
              </p>
            </section>

            {deal.highlights && deal.highlights.length > 0 ? (
              <section aria-labelledby="highlights-heading">
                <h2 id="highlights-heading" className="text-xl font-semibold tracking-tight">
                  Öne çıkanlar
                </h2>
                <ul className="text-foreground/90 mt-3 space-y-2">
                  {deal.highlights.map((h) => (
                    <li key={h} className="flex gap-2 leading-relaxed">
                      <span aria-hidden="true" className="text-foreground/40">
                        •
                      </span>
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {deal.terms ? (
              <section aria-labelledby="terms-heading">
                <h2 id="terms-heading" className="text-xl font-semibold tracking-tight">
                  Kullanım koşulları
                </h2>
                <p className="text-muted-foreground mt-3 text-sm leading-relaxed whitespace-pre-line">
                  {deal.terms}
                </p>
              </section>
            ) : null}
          </div>

          {/* Right: price + CTA, sticky on desktop */}
          <aside className="lg:sticky lg:top-20 lg:self-start">
            <div className="border-border bg-background flex flex-col gap-4 rounded-xl border p-6 shadow-sm">
              {expired ? (
                <div className="border-amber-500/40 bg-amber-500/10 flex flex-col gap-1 rounded-lg border p-3">
                  <p className="text-sm font-semibold">Bu fırsat kaçtı</p>
                  <p className="text-muted-foreground text-xs">
                    Satış kapandı, rezervasyon alınmıyor. Arşivde içeriği koruyoruz —
                    benzer bir fırsat çıktığında haberdar olmak için{' '}
                    <Link href="/gecmis-firsatlar" className="hover:underline underline-offset-2 font-medium text-foreground">
                      tüm arşivi
                    </Link>{' '}
                    veya{' '}
                    {primaryCategory ? (
                      <>
                        <Link
                          href={`/k/${primaryCategory.slug}`}
                          className="hover:underline underline-offset-2 font-medium text-foreground"
                        >
                          {primaryCategory.name} kategorisini
                        </Link>{' '}
                        gezebilirsin.
                      </>
                    ) : (
                      <Link href="/" className="hover:underline underline-offset-2 font-medium text-foreground">
                        anasayfaya
                      </Link>
                    )}
                  </p>
                </div>
              ) : null}

              <div className="flex flex-col gap-1">
                {showDiscount ? (
                  <span className="text-muted-foreground text-sm line-through">
                    {formatTRY(deal.original_price)}
                  </span>
                ) : null}
                <div className="flex items-baseline gap-2">
                  <span
                    className={cn(
                      'text-3xl font-semibold',
                      expired ? 'text-muted-foreground' : null,
                    )}
                  >
                    {formatTRY(deal.discounted_price)}
                  </span>
                  {showDiscount && !expired ? (
                    <Badge variant="discount" size="md">%{discount} indirim</Badge>
                  ) : null}
                </div>
              </div>

              {expired ? null : (
                <Link
                  href={`/rezervasyon/${deal.slug}`}
                  className={cn(buttonVariants({ variant: 'primary', size: 'lg' }), 'w-full gap-2')}
                >
                  <Calendar className="size-4" aria-hidden="true" />
                  Rezervasyon Yap
                </Link>
              )}
              {expired ? null : <FavoriteButton dealId={deal.id} />}
              <ShareButtons
                title={deal.title}
                text={deal.subtitle ?? deal.title}
                url={`${SITE.url}/f/${deal.slug}`}
                className="w-full justify-center"
              />
              {expired ? null : (
                <p className="text-muted-foreground text-center text-xs">
                  Mock akış — gerçek ödeme alınmaz, demo rezervasyon kaydı tutulur.
                </p>
              )}

              {deal.merchant ? (
                <Link
                  href={`/m/${deal.merchant.slug}`}
                  className="border-border hover:bg-muted/50 group flex flex-col gap-1 border-t pt-4 transition-colors"
                >
                  <p className="text-muted-foreground text-xs uppercase">İşletme</p>
                  <p className="text-foreground group-hover:underline mt-1 text-sm font-medium underline-offset-2">
                    {deal.merchant.name} →
                  </p>
                  {location ? (
                    <p className="text-muted-foreground text-sm">{location}</p>
                  ) : null}
                </Link>
              ) : null}
            </div>
          </aside>
        </div>

        <div className="mt-10 flex flex-col gap-10">
          <Suspense fallback={<ReviewsSkeleton />}>
            <ReviewsSection dealId={deal.id} dealSlug={deal.slug} />
          </Suspense>

          {primaryCategory ? (
            <Suspense fallback={<SimilarDealsSkeleton />}>
              <SimilarDeals categorySlug={primaryCategory.slug} excludeDealId={deal.id} />
            </Suspense>
          ) : null}
        </div>
      </Container>

      <JsonLd data={breadcrumbLd} />
      <JsonLd data={offerLd} />
      {eventLd ? <JsonLd data={eventLd} /> : null}

      <StickyCta
        dealSlug={deal.slug}
        expired={expired}
        originalPrice={deal.original_price}
        discountedPrice={deal.discounted_price}
        discountPercent={deal.discount_percent}
      />
    </>
  );
}

function ReviewsSkeleton() {
  return (
    <section className="border-border border-t pt-10">
      <Skeleton className="mb-2 h-5 w-32" />
      <Skeleton className="mb-5 h-8 w-48" />
      <Skeleton className="mb-6 h-32 w-full rounded-xl" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>
    </section>
  );
}

function SimilarDealsSkeleton() {
  return (
    <section className="border-border border-t pt-10">
      <Skeleton className="mb-2 h-5 w-32" />
      <Skeleton className="mb-5 h-8 w-48" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-3">
            <Skeleton className="aspect-[4/3] w-full rounded-lg" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    </section>
  );
}
