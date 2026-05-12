import { Suspense } from 'react';
import { CategoryGrid } from '@/components/home/category-grid';
import { FeaturedCarousel } from '@/components/home/featured-carousel';
import { HowItWorks } from '@/components/home/how-it-works';
import { ChatContainer } from '@/components/kesfet/chat-container';
import { DealCard } from '@/components/deal/deal-card';
import { Container } from '@/components/ui/container';
import { Skeleton } from '@/components/ui/skeleton';
import { listDeals } from '@/lib/db/queries/deals';

export const revalidate = 300; // ISR: 5 minutes — chat itself is fully client.

export default async function HomePage() {
  const [featured, recent] = await Promise.all([
    listDeals({ featured: true, limit: 12 }),
    listDeals({ limit: 12 }),
  ]);

  const carouselDeals = featured.length >= 4 ? featured : recent.slice(0, 12);

  return (
    <>
      <Suspense fallback={<ChatFallback />}>
        <ChatContainer />
      </Suspense>

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

function ChatFallback() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-4 px-4 py-14 text-center sm:py-20">
      <Skeleton className="h-6 w-40 rounded-full" />
      <Skeleton className="h-12 w-72 sm:h-14 sm:w-96" />
      <Skeleton className="h-4 w-80" />
      <Skeleton className="mt-2 h-14 w-full max-w-xl rounded-2xl" />
    </div>
  );
}
