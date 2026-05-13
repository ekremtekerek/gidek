import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CategoryFilters } from '@/components/category/category-filters';
import { DealCard } from '@/components/deal/deal-card';
import { JsonLd } from '@/components/seo/json-ld';
import { Container } from '@/components/ui/container';
import { getCategoryBySlug } from '@/lib/db/queries/categories';
import { listDeals, type DealSort } from '@/lib/db/queries/deals';
import { AUDIENCE } from '@/lib/utils/constants';
import { SITE } from '@/lib/utils/site-config';

const AUDIENCE_SLUGS = new Set(AUDIENCE.map((a) => a.slug));

export const dynamic = 'force-dynamic';

type Params = { kategori: string };
type Search = {
  city?: string;
  tag?: string | string[];
  aud?: string | string[];
  min?: string;
  max?: string;
  sort?: string;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { kategori } = await params;
  const category = await getCategoryBySlug(kategori);
  if (!category) return {};

  const title = category.meta_title ?? `${category.name} fırsatları`;
  const description =
    category.meta_description ??
    `${SITE.name} üzerinden ${category.name.toLowerCase()} fırsatlarını keşfet.`;

  return {
    title,
    description,
    alternates: { canonical: `/k/${category.slug}` },
    openGraph: {
      title,
      description,
      url: `${SITE.url}/k/${category.slug}`,
      type: 'website',
    },
  };
}

const VALID_SORTS: DealSort[] = ['newest', 'price-asc', 'price-desc', 'popular', 'trending'];

function parsePrice(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0 || n > 1_000_000) return undefined;
  return n;
}

function normalizeTags(tag: string | string[] | undefined): string[] {
  if (!tag) return [];
  if (Array.isArray(tag)) return tag.filter((t) => typeof t === 'string' && t.length > 0);
  return [tag];
}

function normalizeAudience(aud: string | string[] | undefined): string[] {
  const raw = !aud ? [] : Array.isArray(aud) ? aud : [aud];
  return raw.filter((a) => typeof a === 'string' && AUDIENCE_SLUGS.has(a as never));
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<Search>;
}) {
  const [{ kategori }, sp] = await Promise.all([params, searchParams]);
  const category = await getCategoryBySlug(kategori);
  if (!category) notFound();

  const city = sp.city && sp.city.length > 0 ? sp.city : undefined;
  const tags = normalizeTags(sp.tag);
  const audience = normalizeAudience(sp.aud);
  const minPrice = parsePrice(sp.min);
  const maxPrice = parsePrice(sp.max);
  const sort = (VALID_SORTS as readonly string[]).includes(sp.sort ?? '')
    ? (sp.sort as DealSort)
    : ('newest' as const);

  const hasFilters =
    Boolean(city) ||
    tags.length > 0 ||
    audience.length > 0 ||
    minPrice !== undefined ||
    maxPrice !== undefined;

  const deals = await listDeals({
    categorySlug: kategori,
    city,
    tags: tags.length > 0 ? tags : undefined,
    audience: audience.length > 0 ? audience : undefined,
    minPrice,
    maxPrice,
    sort,
    limit: 48,
  });

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Ana sayfa', item: SITE.url },
      {
        '@type': 'ListItem',
        position: 2,
        name: category.name,
        item: `${SITE.url}/k/${category.slug}`,
      },
    ],
  };

  const itemListLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: category.name,
    numberOfItems: deals.length,
    itemListElement: deals.slice(0, 20).map((d, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${SITE.url}/f/${d.slug}`,
      name: d.title,
    })),
  };

  return (
    <>
      <Container className="pt-8 pb-12">
        <nav aria-label="Breadcrumb" className="text-muted-foreground mb-4 text-sm">
          <ol className="flex items-center gap-2">
            <li>
              <Link href="/" className="hover:text-foreground">
                Ana sayfa
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-foreground" aria-current="page">
              {category.name}
            </li>
          </ol>
        </nav>

        <header className="mb-6">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{category.name}</h1>
          {category.description ? (
            <p className="text-muted-foreground mt-2 max-w-2xl">{category.description}</p>
          ) : null}
          <p className="text-muted-foreground mt-1 text-sm">
            {deals.length} fırsat {hasFilters ? ' (filtreli)' : 'listeleniyor'}
            {hasFilters ? (
              <>
                {' · '}
                <Link
                  href={`/k/${kategori}`}
                  className="text-foreground underline-offset-4 hover:underline"
                >
                  Filtreleri temizle
                </Link>
              </>
            ) : null}
          </p>
        </header>

        <div className="mb-6">
          <CategoryFilters
            action={`/k/${kategori}`}
            current={{ city, tags, audience, minPrice, maxPrice, sort }}
          />
        </div>

        {deals.length === 0 ? (
          <div className="border-border rounded-lg border border-dashed p-12 text-center">
            <p className="text-muted-foreground">
              {hasFilters
                ? 'Uygulanan filtrelerde fırsat bulamadık. Filtreleri biraz gevşetmeyi dene.'
                : 'Bu kategoride şu an aktif fırsat yok.'}
            </p>
            <Link
              href={hasFilters ? `/k/${kategori}` : '/'}
              className="text-foreground mt-4 inline-block text-sm font-medium underline-offset-4 hover:underline"
            >
              {hasFilters ? 'Filtreleri temizle' : 'Ana sayfaya dön'}
            </Link>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {deals.map((d, i) => (
              <li key={d.id}>
                <DealCard deal={d} priority={i < 4} />
              </li>
            ))}
          </ul>
        )}
      </Container>

      <JsonLd data={breadcrumbLd} />
      <JsonLd data={itemListLd} />
    </>
  );
}
