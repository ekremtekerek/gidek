import { Suspense } from 'react';
import type { UIMessage } from 'ai';
import { ChatContainer } from '@/components/kesfet/chat-container';
import { HomeMapSection } from '@/components/map/HomeMapSection';
import { Skeleton } from '@/components/ui/skeleton';
import { buildWelcomeContent } from '@/lib/ai/welcome';
import { getConversationWithMessages } from '@/lib/db/queries/conversations';
import { listDeals } from '@/lib/db/queries/deals';
import { getCurrentUser } from '@/lib/security/auth';
import { getUserContext } from '@/lib/security/user-context-server';

interface Props {
  conversationId?: string;
}

/**
 * Anasayfa hero — Airbnb tarzı yan yana split.
 * - Desktop (lg+): chat solda, harita sağda, eşit boy ve full hero height.
 * - Mobile: alt alta. Chat hero gibi full height, harita altta 60svh.
 *
 * `conversationId` set ise (page'ten ?c= URL param'ı), o sohbetin geçmiş
 * mesajları SSR'de fetch edilir ve ChatContainer'a initial olarak verilir.
 */
export async function HomeHero({ conversationId }: Props = {}) {
  const ctx = await getUserContext();
  // Önce sabit "öne çıkan" bayrağına bak; en az 4 yoksa trending skoruna
  // göre otomatik doldur. Bu sayede admin manuel sabitleme yapmasa bile
  // anasayfa hareketli ve "popüler" döner.
  const featuredCity = await listDeals({ city: ctx.city, featured: true, limit: 8 });
  const welcomeDeals =
    featuredCity.length >= 4
      ? featuredCity
      : await listDeals({ city: ctx.city, sort: 'trending', limit: 8 });

  const welcomeContent = buildWelcomeContent({
    city: ctx.city,
    deals: welcomeDeals.map((d) => ({
      title: d.title,
      district: d.district,
      discountPct: d.discount_percent,
    })),
  });

  const user = await getCurrentUser();
  let initialMessages: UIMessage[] | undefined;
  let resolvedConversationId: string | undefined;
  if (user && conversationId) {
    const data = await getConversationWithMessages(conversationId);
    if (data) {
      resolvedConversationId = data.conversation.id;
      initialMessages = data.messages.map(
        (m) =>
          ({
            id: m.id,
            role: m.role,
            parts: m.parts,
          }) as unknown as UIMessage,
      );
    }
  }

  return (
    <section
      aria-label="AI sohbet ve harita"
      className="border-border lg:h-[calc(100svh-4rem)] grid grid-cols-1 overflow-hidden lg:grid-cols-2 lg:border-b"
    >
      <div className="h-[calc(100svh-4rem)] min-w-0 min-h-0 lg:h-auto">
        <Suspense fallback={<Skeleton className="h-full w-full rounded-none" />}>
          <ChatContainer
            welcomeDeals={welcomeDeals}
            city={ctx.city}
            welcomeContent={welcomeContent}
            initialConversationId={resolvedConversationId}
            initialMessages={initialMessages}
            isAuthenticated={Boolean(user)}
          />
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
