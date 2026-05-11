import Link from 'next/link';
import { CategoryGrid } from '@/components/home/category-grid';
import { HeroSection } from '@/components/home/hero-section';
import { HowItWorks } from '@/components/home/how-it-works';
import { DealCard } from '@/components/deal/deal-card';
import { Container } from '@/components/ui/container';
import { listDeals } from '@/lib/db/queries/deals';

export const revalidate = 300; // ISR: 5 minutes

export default async function HomePage() {
  const [featured, recent] = await Promise.all([
    listDeals({ featured: true, limit: 4 }),
    listDeals({ limit: 12 }),
  ]);

  return (
    <>
      <HeroSection />
      <HowItWorks />

      {featured.length > 0 ? (
        <section aria-labelledby="featured-heading" className="py-8">
          <Container>
            <div className="mb-6 flex items-end justify-between">
              <h2 id="featured-heading" className="text-2xl font-semibold tracking-tight">
                Bu hafta öne çıkanlar
              </h2>
              <Link
                href="/k/yemek"
                className="text-muted-foreground hover:text-foreground text-sm font-medium"
              >
                Tümünü gör &rarr;
              </Link>
            </div>
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {featured.map((deal, i) => (
                <li key={deal.id}>
                  <DealCard deal={deal} priority={i < 2} />
                </li>
              ))}
            </ul>
          </Container>
        </section>
      ) : null}

      <CategoryGrid />

      <section aria-labelledby="all-heading" className="py-8">
        <Container>
          <div className="mb-6 flex items-end justify-between">
            <h2 id="all-heading" className="text-2xl font-semibold tracking-tight">
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
