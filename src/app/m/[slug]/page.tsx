import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Globe, Mail, MapPin, Phone, ShieldCheck, Star } from 'lucide-react';
import { DealCard } from '@/components/deal/deal-card';
import { EmptyState } from '@/components/feedback/empty-state';
import { ShareButtons } from '@/components/share/share-buttons';
import { ShowOnMap } from '@/components/deal/show-on-map';
import { JsonLd } from '@/components/seo/json-ld';
import { Badge } from '@/components/ui/badge';
import { Container } from '@/components/ui/container';
import {
  getMerchantBySlug,
  listDealsForMerchant,
  listPublishedMerchantSlugs,
} from '@/lib/db/queries/merchants';
import { cn } from '@/lib/utils/cn';
import { SITE } from '@/lib/utils/site-config';

// ISR — işletme sayfası 10 dakikada bir yeniden render edilir.
export const revalidate = 600;

type Params = { slug: string };

export async function generateStaticParams(): Promise<Params[]> {
  const slugs = await listPublishedMerchantSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const merchant = await getMerchantBySlug(slug);
  if (!merchant) return {};

  const title = merchant.name;
  const description =
    merchant.description ?? `${merchant.name} işletmesinin gidek üzerindeki tüm fırsatları.`;
  const cover = merchant.logo_url ?? `${SITE.url}/og-default.png`;

  return {
    title,
    description,
    alternates: { canonical: `/m/${merchant.slug}` },
    openGraph: {
      type: 'website',
      title,
      description,
      url: `${SITE.url}/m/${merchant.slug}`,
      images: [{ url: cover }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [cover] },
  };
}

export default async function MerchantPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const merchant = await getMerchantBySlug(slug);
  if (!merchant) notFound();

  const deals = await listDealsForMerchant(merchant.id);
  const location = [merchant.district, merchant.city].filter(Boolean).join(', ');
  const hasCoords =
    merchant.lat !== null && merchant.lat !== undefined && merchant.lng !== null && merchant.lng !== undefined;

  const localBusinessLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: merchant.name,
    description: merchant.description,
    url: `${SITE.url}/m/${merchant.slug}`,
    image: merchant.logo_url ?? undefined,
    telephone: merchant.phone ?? undefined,
    email: merchant.email ?? undefined,
    address: location
      ? {
          '@type': 'PostalAddress',
          streetAddress: merchant.address ?? undefined,
          addressLocality: merchant.city ?? undefined,
          addressRegion: merchant.district ?? undefined,
          addressCountry: 'TR',
        }
      : undefined,
    geo: hasCoords
      ? {
          '@type': 'GeoCoordinates',
          latitude: Number(merchant.lat),
          longitude: Number(merchant.lng),
        }
      : undefined,
    aggregateRating:
      merchant.avg_rating !== null && merchant.rating_count > 0
        ? {
            '@type': 'AggregateRating',
            ratingValue: merchant.avg_rating,
            reviewCount: merchant.rating_count,
            bestRating: 5,
            worstRating: 1,
          }
        : undefined,
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Ana sayfa', item: SITE.url },
      {
        '@type': 'ListItem',
        position: 2,
        name: merchant.name,
        item: `${SITE.url}/m/${merchant.slug}`,
      },
    ],
  };

  return (
    <>
      <Container className="py-8 sm:py-12">
        <nav aria-label="Breadcrumb" className="text-muted-foreground mb-5 text-sm">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/" className="hover:text-foreground">
                Ana sayfa
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-foreground line-clamp-1" aria-current="page">
              {merchant.name}
            </li>
          </ol>
        </nav>

        {/* Hero — logo + name + key facts */}
        <header className="border-border bg-background mb-8 grid gap-5 rounded-2xl border p-5 sm:grid-cols-[auto_1fr_auto] sm:p-7">
          <div className="bg-muted relative size-20 shrink-0 overflow-hidden rounded-xl sm:size-24">
            {merchant.logo_url ? (
              <Image
                src={merchant.logo_url}
                alt={merchant.name}
                fill
                sizes="96px"
                className="object-cover"
              />
            ) : (
              <span className="text-muted-foreground inline-flex size-full items-center justify-center text-2xl font-semibold">
                {merchant.name.slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1 self-center">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {merchant.name}
              </h1>
              {merchant.is_verified ? (
                <Badge variant="success" size="sm" className="inline-flex items-center gap-1">
                  <ShieldCheck className="size-3" aria-hidden="true" />
                  Doğrulanmış
                </Badge>
              ) : null}
            </div>
            <ul className="text-muted-foreground flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
              {location ? (
                <li className="inline-flex items-center gap-1.5">
                  <MapPin className="size-4" aria-hidden="true" />
                  {location}
                </li>
              ) : null}
              {merchant.avg_rating !== null && merchant.rating_count > 0 ? (
                <li className="inline-flex items-center gap-1.5">
                  <Star className="size-4 fill-amber-500 text-amber-500" aria-hidden="true" />
                  {merchant.avg_rating.toFixed(1)} · {merchant.rating_count} değerlendirme
                </li>
              ) : null}
              <li>{merchant.deal_count} aktif fırsat</li>
            </ul>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:self-center">
            <ShareButtons
              title={`${merchant.name} — gidek`}
              text={
                merchant.description
                  ? `${merchant.name}: ${merchant.description.slice(0, 140)}`
                  : `${merchant.name} işletmesinin tüm fırsatları gidek'te.`
              }
              url={`${SITE.url}/m/${merchant.slug}`}
            />
            {hasCoords ? (
              <ShowOnMap
                lat={Number(merchant.lat)}
                lng={Number(merchant.lng)}
                title={merchant.name}
                address={location}
              />
            ) : null}
          </div>
        </header>

        {/* About + contact */}
        {merchant.description || merchant.phone || merchant.email || merchant.website || merchant.address ? (
          <section className="mb-10 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            {merchant.description ? (
              <div>
                <h2 className="text-xl font-semibold tracking-tight">Hakkında</h2>
                <p className="text-foreground/90 mt-3 leading-relaxed whitespace-pre-line">
                  {merchant.description}
                </p>
              </div>
            ) : (
              <div />
            )}

            {merchant.phone || merchant.email || merchant.website || merchant.address ? (
              <aside className="border-border bg-background h-fit rounded-xl border p-5">
                <p className="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">
                  İletişim
                </p>
                <ul className="flex flex-col gap-2.5 text-sm">
                  {merchant.address ? (
                    <li className="inline-flex items-start gap-2">
                      <MapPin
                        className="text-muted-foreground mt-0.5 size-4 shrink-0"
                        aria-hidden="true"
                      />
                      <span>{merchant.address}</span>
                    </li>
                  ) : null}
                  {merchant.phone ? (
                    <li>
                      <a
                        href={`tel:${merchant.phone}`}
                        className="hover:text-foreground inline-flex items-center gap-2"
                      >
                        <Phone
                          className="text-muted-foreground size-4"
                          aria-hidden="true"
                        />
                        {merchant.phone}
                      </a>
                    </li>
                  ) : null}
                  {merchant.email ? (
                    <li>
                      <a
                        href={`mailto:${merchant.email}`}
                        className="hover:text-foreground inline-flex items-center gap-2"
                      >
                        <Mail
                          className="text-muted-foreground size-4"
                          aria-hidden="true"
                        />
                        {merchant.email}
                      </a>
                    </li>
                  ) : null}
                  {merchant.website ? (
                    <li>
                      <a
                        href={merchant.website}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-foreground inline-flex items-center gap-2"
                      >
                        <Globe
                          className="text-muted-foreground size-4"
                          aria-hidden="true"
                        />
                        Web sitesi
                      </a>
                    </li>
                  ) : null}
                </ul>
              </aside>
            ) : null}
          </section>
        ) : null}

        {/* Deals */}
        <section aria-labelledby="merchant-deals" className="border-border border-t pt-10">
          <div className="mb-5 flex flex-col gap-1">
            <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              {merchant.deal_count} fırsat
            </p>
            <h2 id="merchant-deals" className="text-2xl font-semibold tracking-tight">
              {merchant.name}&apos;nin fırsatları
            </h2>
          </div>

          {deals.length === 0 ? (
            <EmptyState
              icon={ShieldCheck}
              title="Şu an aktif fırsat yok"
              description="Bu işletmenin yayında bir fırsatı bulunmuyor. Yakında yeniler eklenebilir."
              primaryAction={{ label: 'Ana sayfaya dön', href: '/' }}
            />
          ) : (
            <ul
              className={cn(
                'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3',
                deals.length > 3 ? 'xl:grid-cols-4' : '',
              )}
            >
              {deals.map((d) => (
                <li key={d.id}>
                  <DealCard deal={d} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </Container>

      <JsonLd data={breadcrumbLd} />
      <JsonLd data={localBusinessLd} />
    </>
  );
}
