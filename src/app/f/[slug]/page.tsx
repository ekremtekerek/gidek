import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Calendar, Clock, Heart, MapPin, Users } from 'lucide-react';
import { FavoriteButton } from '@/components/favorites/favorite-button';
import { JsonLd } from '@/components/seo/json-ld';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { getDealBySlug, listPublishedDealSlugs } from '@/lib/db/queries/deals';
import { isFavorite } from '@/lib/db/queries/favorites';
import { getCurrentUser } from '@/lib/security/auth';
import { cn } from '@/lib/utils/cn';
import { AUDIENCE_LABEL, DEAL_TAG_LABEL } from '@/lib/utils/constants';
import { formatDuration, formatTRY } from '@/lib/utils/format';
import { SITE } from '@/lib/utils/site-config';

// Auth state (favorite toggle) means we can't ISR every minute — switch to
// per-request rendering so the heart shows the right state for the caller.
export const dynamic = 'force-dynamic';

type Params = { slug: string };

export async function generateStaticParams(): Promise<Params[]> {
  const slugs = await listPublishedDealSlugs();
  return slugs.map((slug) => ({ slug }));
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

  const user = await getCurrentUser();
  const favorited = user ? await isFavorite(deal.id) : false;

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

  const offerLd = {
    '@context': 'https://schema.org',
    '@type': 'Offer',
    name: deal.title,
    description: deal.description,
    image: deal.cover_image,
    url: `${SITE.url}/f/${deal.slug}`,
    priceCurrency: deal.currency,
    price: deal.discounted_price,
    availability: 'https://schema.org/InStock',
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
            <div className="border-border bg-muted relative aspect-[4/3] w-full overflow-hidden rounded-xl border">
              <Image
                src={deal.cover_image}
                alt={deal.title}
                fill
                sizes="(min-width: 1024px) 60vw, 100vw"
                className="object-cover"
                priority
              />
              {showDiscount ? (
                <div className="absolute top-4 left-4">
                  <Badge variant="discount" size="lg">%{discount} indirim</Badge>
                </div>
              ) : null}
              {deal.is_featured ? (
                <div className="absolute top-4 right-4">
                  <Badge variant="accent" size="md">Öne çıkan</Badge>
                </div>
              ) : null}
            </div>

            <header className="flex flex-col gap-3">
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{deal.title}</h1>
              {deal.subtitle ? (
                <p className="text-muted-foreground text-lg">{deal.subtitle}</p>
              ) : null}

              <ul className="text-muted-foreground flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                {deal.merchant ? <li>{deal.merchant.name}</li> : null}
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
              <div className="flex flex-col gap-1">
                {showDiscount ? (
                  <span className="text-muted-foreground text-sm line-through">
                    {formatTRY(deal.original_price)}
                  </span>
                ) : null}
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-semibold">
                    {formatTRY(deal.discounted_price)}
                  </span>
                  {showDiscount ? (
                    <Badge variant="discount" size="md">%{discount} indirim</Badge>
                  ) : null}
                </div>
              </div>

              {user ? (
                <Link
                  href={`/rezervasyon/${deal.slug}`}
                  className={cn(buttonVariants({ variant: 'primary', size: 'lg' }), 'w-full gap-2')}
                >
                  <Calendar className="size-4" aria-hidden="true" />
                  Rezervasyon Yap
                </Link>
              ) : (
                <Link
                  href={`/giris?next=/rezervasyon/${deal.slug}`}
                  className={cn(buttonVariants({ variant: 'primary', size: 'lg' }), 'w-full gap-2')}
                >
                  <Calendar className="size-4" aria-hidden="true" />
                  Rezervasyon Yap
                </Link>
              )}
              {user ? (
                <FavoriteButton dealId={deal.id} initialFavorited={favorited} />
              ) : (
                <Link
                  href={`/giris?next=/f/${deal.slug}`}
                  className={cn(buttonVariants({ variant: 'outline', size: 'md' }), 'w-full gap-2')}
                >
                  <Heart className="size-4" aria-hidden="true" />
                  Favorilere ekle
                </Link>
              )}
              <p className="text-muted-foreground text-center text-xs">
                Mock akış — gerçek ödeme alınmaz, demo rezervasyon kaydı tutulur.
              </p>

              {deal.merchant ? (
                <div className="border-border border-t pt-4">
                  <p className="text-muted-foreground text-xs uppercase">İşletme</p>
                  <p className="mt-1 text-sm font-medium">{deal.merchant.name}</p>
                  {location ? (
                    <p className="text-muted-foreground text-sm">{location}</p>
                  ) : null}
                </div>
              ) : null}
            </div>
          </aside>
        </div>
      </Container>

      <JsonLd data={breadcrumbLd} />
      <JsonLd data={offerLd} />
    </>
  );
}
