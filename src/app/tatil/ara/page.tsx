import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Compass, Filter, SlidersHorizontal } from 'lucide-react';
import { TravelCard } from '@/components/travel/travel-card';
import { TravelFilters } from '@/components/travel/travel-filters';
import { TravelMapView } from '@/components/travel/travel-map-view';
import { TravelTopSearchBar } from '@/components/travel/travel-top-search-bar';
import { TravelSortBar } from '@/components/travel/travel-sort-bar';
import { TravelViewToggle } from '@/components/travel/travel-view-toggle';
import { Container } from '@/components/ui/container';
import {
  listTravelLocations,
  searchTravelDeals,
  type TravelSearchParams,
} from '@/lib/db/queries/travel';
import {
  dealHasConcept,
  dealHasFeatures,
  dealHasStars,
  type Concept,
  type TravelFeature,
} from '@/lib/travel/enrich';
import { SITE } from '@/lib/utils/site-config';

export const metadata: Metadata = {
  title: 'Tatil Ara · gidek',
  description: 'Otel ve paket tur arama — filtrele, sırala, harita üzerinde gör.',
  alternates: { canonical: '/tatil/ara' },
  openGraph: {
    title: 'gidek Tatil Ara',
    description: 'Filtreli tatil arama, harita view, AI destekli öneriler',
    url: `${SITE.url}/tatil/ara`,
  },
};

export const dynamic = 'force-dynamic';

interface SP {
  dest?: string;
  checkin?: string;
  checkout?: string;
  adults?: string;
  kids?: string;
  concept?: string;
  stars?: string;
  feat?: string;
  region?: string;
  min?: string;
  max?: string;
  sort?: string;
  view?: string;
}

export default async function TatilAraPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;

  const concept = (sp.concept ?? '') as Concept | '';
  const features = (sp.feat ?? '').split(',').filter(Boolean) as TravelFeature[];
  const stars = (sp.stars ?? '')
    .split(',')
    .map(Number)
    .filter((n) => [3, 4, 5].includes(n));
  const regionList = (sp.region ?? '').split(',').filter(Boolean);
  const view = (sp.view === 'map' ? 'map' : 'list') as 'list' | 'map';
  const sort = (['recommended', 'price-asc', 'price-desc', 'discount'].includes(sp.sort ?? '')
    ? (sp.sort as TravelSearchParams['sort'])
    : 'recommended');

  const queryParams: TravelSearchParams = {
    destination: sp.dest,
    minPrice: sp.min ? Number(sp.min) : undefined,
    maxPrice: sp.max ? Number(sp.max) : undefined,
    sort,
    limit: 60,
  };

  const [rawDeals, locations] = await Promise.all([
    searchTravelDeals(queryParams),
    listTravelLocations(),
  ]);

  // Post-filter (DB'de tutulamayan UI metadata'sı için)
  let deals = rawDeals;
  if (concept) deals = deals.filter((d) => dealHasConcept(d, concept));
  if (stars.length > 0) deals = deals.filter((d) => dealHasStars(d, stars));
  if (features.length > 0) deals = deals.filter((d) => dealHasFeatures(d, features));
  if (regionList.length > 0) {
    deals = deals.filter((d) => {
      const r1 = d.district ?? '';
      const r2 = d.city ?? '';
      return regionList.includes(r1) || regionList.includes(r2);
    });
  }

  // Bölge listesi — search sonucundaki distinct district/city
  const regions = [
    ...new Set(
      rawDeals.flatMap((d) =>
        [d.district, d.city].filter((x): x is string => Boolean(x)),
      ),
    ),
  ].sort((a, b) => a.localeCompare(b, 'tr'));

  const initialFormValues = {
    destination: sp.dest,
    checkin: sp.checkin,
    checkout: sp.checkout,
    adults: sp.adults ? Number(sp.adults) : undefined,
    kids: sp.kids ? Number(sp.kids) : undefined,
    concept,
  };

  const hasResults = deals.length > 0;

  return (
    <>
      {/* Üst arama bandı */}
      <div className="border-border from-sky-50 via-background to-background dark:from-sky-950/30 sticky top-16 z-30 border-b bg-gradient-to-b backdrop-blur">
        <Container className="py-3 sm:py-4">
          <div className="mb-2 flex items-center justify-between gap-3">
            <Link
              href="/tatil"
              className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Tatil ana sayfası
            </Link>
            <Link
              href="/tatil/kesfet"
              className="from-sky-600 to-cyan-500 hover:from-sky-700 hover:to-cyan-600 inline-flex h-8 items-center gap-1 rounded-full bg-gradient-to-r px-3 text-xs font-bold text-white shadow-sm transition-all"
            >
              <Compass className="size-3.5" aria-hidden="true" />
              AI ile keşfet
            </Link>
          </div>
          <TravelTopSearchBar locations={locations} initial={initialFormValues} />
        </Container>
      </div>

      <Container className="py-6 sm:py-8">
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* Sol — filtreler (desktop) */}
          <div className="hidden lg:block">
            <TravelFilters regions={regions} />
          </div>

          {/* Sağ — sonuçlar */}
          <div className="min-w-0">
            <header className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                  {sp.dest ? `${sp.dest} için` : 'Tüm tatil paketleri'}
                </h1>
                <p className="text-muted-foreground text-sm">
                  <span className="text-foreground font-semibold tabular-nums">{deals.length}</span>{' '}
                  sonuç
                  {concept ? ` · konsept filtreli` : ''}
                  {stars.length > 0 ? ` · ${stars.join('/')} yıldız` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <TravelSortBar />
                <TravelViewToggle current={view} />
              </div>
            </header>

            {/* Mobile filter trigger */}
            <details className="border-border bg-background mb-4 rounded-lg border p-3 lg:hidden">
              <summary className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-semibold">
                <SlidersHorizontal className="size-4" aria-hidden="true" />
                Filtreler
              </summary>
              <div className="mt-3">
                <TravelFilters regions={regions} />
              </div>
            </details>

            {!hasResults ? (
              <div className="border-border bg-muted/30 rounded-xl border border-dashed p-10 text-center">
                <Filter className="text-muted-foreground mx-auto mb-3 size-10" aria-hidden="true" />
                <p className="text-sm font-semibold">Bu filtrelerle sonuç bulunamadı</p>
                <p className="text-muted-foreground mt-1 text-xs">
                  Bir-iki filtreyi kaldır veya farklı bir destinasyon dene.
                </p>
                <Link
                  href="/tatil/ara"
                  className="bg-foreground text-background hover:bg-foreground/90 mt-5 inline-flex h-9 items-center justify-center rounded-md px-4 text-sm font-medium transition-colors"
                >
                  Filtreleri sıfırla
                </Link>
              </div>
            ) : view === 'map' ? (
              <TravelMapView deals={deals} />
            ) : (
              <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {deals.map((d, idx) => (
                  <li key={d.id}>
                    <TravelCard deal={d} priority={idx < 3} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </Container>
    </>
  );
}
