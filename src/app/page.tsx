import { CategoryGrid } from '@/components/home/category-grid';
import { FeaturedCarousel } from '@/components/home/featured-carousel';
import { HeroSection } from '@/components/home/hero-section';
import { HowItWorks } from '@/components/home/how-it-works';
import { DealCard } from '@/components/deal/deal-card';
import { Container } from '@/components/ui/container';
import { listDeals } from '@/lib/db/queries/deals';

export const revalidate = 300; // ISR: 5 minutes

export default async function HomePage() {
  const [featured, recent] = await Promise.all([
    listDeals({ featured: true, limit: 8 }),
    listDeals({ limit: 12 }),
  ]);

  // Fall back to recent deals if not enough featured exist yet (mock data).
  const carouselDeals = featured.length >= 3 ? featured : recent.slice(0, 8);

  return (
    <>
      <HeroSection />
      <FeaturedCarousel deals={carouselDeals} />
      <HowItWorks />
      <CategoryGrid />

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
          {recent.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">
              Henüz fırsat yok. Yakında burada olacaklar!
            </p>
          ) : (
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {recent.map((deal) => (
                <li key={deal.id}>
                  <DealCard deal={deal} />
                </li>
              ))}
            </ul>
          )}
        </Container>
      </section>
    </>
  );
}
