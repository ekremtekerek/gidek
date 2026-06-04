import type { Metadata } from 'next';
import { CategoryGrid } from '@/components/home/category-grid';
import { EndingSoon } from '@/components/home/ending-soon';
import { FeaturedCarousel } from '@/components/home/featured-carousel';
import { HomeHero } from '@/components/home/home-hero';
import { HomeStageProvider } from '@/components/home/home-stage-context';
import { HowItWorks } from '@/components/home/how-it-works';
import { InfiniteDeals } from '@/components/home/infinite-deals';
import { SocialProofStrip } from '@/components/home/social-proof-strip';
import { QueryProvider } from '@/components/providers/query-provider';
import { Container } from '@/components/ui/container';
import { listDeals } from '@/lib/db/queries/deals';
import { getPlatformStats, listEndingSoonDeals } from '@/lib/db/queries/stats';
import { getUserContext } from '@/lib/security/user-context-server';
import { SITE } from '@/lib/utils/site-config';

export const metadata: Metadata = {
  title: `${SITE.name} — ${SITE.tagline}`,
  description: SITE.description,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    url: SITE.url,
    siteName: SITE.name,
    locale: SITE.locale,
    // og:image dosya konvansiyonundan gelir (app/opengraph-image.tsx).
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
  },
  keywords: [
    'fırsat',
    'kampanya',
    'indirim',
    'tiyatro bileti',
    'konser bileti',
    'masaj',
    'kahvaltı',
    'tatil otel',
    'aktivite',
    'AI öneri',
    'İstanbul',
  ],
};

// ?c= query'sini okumak için her istek tazelenmeli — ISR yerine dinamik.
export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ c?: string }>;
}

export default async function HomePage({ searchParams }: PageProps) {
  const ctx = await getUserContext();
  const { c: conversationId } = await searchParams;
  const [featured, recent, endingSoon, stats] = await Promise.all([
    listDeals({ city: ctx.city, featured: true, limit: 12 }),
    listDeals({ city: ctx.city, limit: 12 }),
    listEndingSoonDeals({ city: ctx.city, withinDays: 14, limit: 8 }),
    getPlatformStats(),
  ]);

  const carouselDeals = featured.length >= 4 ? featured : recent.slice(0, 12);

  return (
    <HomeStageProvider>
      <HomeHero conversationId={conversationId} />

      <FeaturedCarousel deals={carouselDeals} />
      <HowItWorks />
      <EndingSoon deals={endingSoon as never} />
      <CategoryGrid />
      <SocialProofStrip stats={stats} />

      <section aria-labelledby="all-heading" className="py-10 sm:py-12">
        <Container>
          <div className="mb-6">
            <p className="text-muted-foreground mb-1 text-xs font-semibold tracking-wide uppercase">
              Yeni eklenenler
            </p>
            <h2 id="all-heading" className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Tüm fırsatlar
            </h2>
          </div>
          <QueryProvider>
            <InfiniteDeals initialDeals={recent} city={ctx.city} />
          </QueryProvider>
        </Container>
      </section>
    </HomeStageProvider>
  );
}
