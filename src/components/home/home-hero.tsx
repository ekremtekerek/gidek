import { Suspense } from 'react';
import { ChatContainer } from '@/components/kesfet/chat-container';
import { HomeMapSection } from '@/components/map/HomeMapSection';
import { Skeleton } from '@/components/ui/skeleton';
import { listDeals } from '@/lib/db/queries/deals';
import { getUserContext } from '@/lib/security/user-context-server';

/**
 * Anasayfa hero — Airbnb tarzı yan yana split.
 * - Desktop (lg+): chat solda, harita sağda, eşit boy ve full hero height.
 * - Mobile: alt alta. Chat hero gibi full height, harita altta 60svh.
 *
 * Welcome state için şehir bağlamına göre "yakınınızdaki fırsatlar"
 * carousel'ını SSR'de fetch eder ve ChatContainer'a pas eder.
 */
export async function HomeHero() {
  const ctx = await getUserContext();
  // Şehre göre featured fırsatlar; yetersizse normal sıralamadan dolar.
  const featuredCity = await listDeals({ city: ctx.city, featured: true, limit: 8 });
  const welcomeDeals =
    featuredCity.length >= 4
      ? featuredCity
      : await listDeals({ city: ctx.city, limit: 8 });

  return (
    <section
      aria-label="AI sohbet ve harita"
      className="border-border lg:h-[calc(100svh-4rem)] grid grid-cols-1 overflow-hidden lg:grid-cols-2 lg:border-b"
    >
      <div className="h-[calc(100svh-4rem)] min-w-0 min-h-0 lg:h-auto">
        <Suspense fallback={<Skeleton className="h-full w-full rounded-none" />}>
          <ChatContainer welcomeDeals={welcomeDeals} city={ctx.city} />
        </Suspense>
      </div>

      <div className="border-border min-w-0 h-[60svh] min-h-[420px] border-t lg:h-auto lg:border-t-0 lg:border-l">
        <Suspense fallback={<Skeleton className="h-full w-full rounded-none" />}>
          <HomeMapSection />
        </Suspense>
      </div>
    </section>
  );
}
