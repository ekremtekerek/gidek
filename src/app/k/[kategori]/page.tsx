import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DealCard } from '@/components/deal/deal-card';
import { JsonLd } from '@/components/seo/json-ld';
import { Container } from '@/components/ui/container';
import {
  getCategoryBySlug,
  listActiveCategorySlugs,
} from '@/lib/db/queries/categories';
import { listDeals } from '@/lib/db/queries/deals';
import { SITE } from '@/lib/utils/site-config';

export const revalidate = 900; // 15 minutes

type Params = { kategori: string };

export async function generateStaticParams(): Promise<Params[]> {
  const slugs = await listActiveCategorySlugs();
  return slugs.map((kategori) => ({ kategori }));
}

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

export default async function CategoryPage({ params }: { params: Promise<Params> }) {
  const { kategori } = await params;
  const category = await getCategoryBySlug(kategori);
  if (!category) notFound();

  const deals = await listDeals({ categorySlug: kategori, limit: 48 });

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

        <header className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{category.name}</h1>
          {category.description ? (
            <p className="text-muted-foreground mt-2 max-w-2xl">{category.description}</p>
          ) : null}
          <p className="text-muted-foreground mt-1 text-sm">
            {deals.length} fırsat listeleniyor
          </p>
        </header>

        {deals.length === 0 ? (
          <div className="border-border rounded-lg border border-dashed p-12 text-center">
            <p className="text-muted-foreground">Bu kategoride şu an aktif fırsat yok.</p>
            <Link
              href="/"
              className="text-foreground mt-4 inline-block text-sm font-medium underline-offset-4 hover:underline"
            >
              Ana sayfaya dön
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
