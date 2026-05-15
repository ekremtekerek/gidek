import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { ArrowLeft, Palmtree } from 'lucide-react';
import { ChatContainer } from '@/components/kesfet/chat-container';
import { Container } from '@/components/ui/container';
import { Skeleton } from '@/components/ui/skeleton';
import type { WelcomeContent } from '@/lib/ai/welcome';
import { listTravelDeals } from '@/lib/db/queries/travel';
import { getCurrentUser } from '@/lib/security/auth';
import { getUserContext } from '@/lib/security/user-context-server';
import { SITE } from '@/lib/utils/site-config';

export const metadata: Metadata = {
  title: 'Tatil Keşfet · gidek',
  description:
    'AI ile sana özel tatil önerileri. Doğal dille söyle, Gemini destekli arama 3 paket çıkarsın.',
  alternates: { canonical: '/tatil/kesfet' },
  openGraph: {
    title: 'gidek Tatil Keşfet',
    description: 'AI ile tatilini planla',
    url: `${SITE.url}/tatil/kesfet`,
  },
};

export const dynamic = 'force-dynamic';

/**
 * Tatil için özel hazırlanmış welcome content. ChatContainer'ı reuse ediyoruz
 * ama greeting, subtitle ve quick prompt chip'ler tatil odaklı.
 */
function travelWelcome(city: string): WelcomeContent {
  return {
    greeting: 'Tatilini AI planlasın!',
    subtitle:
      'Doğal dille söyle: nereye, ne zaman, kaç kişi, bütçe. Gemini 3 paket çıkaracak.',
    chips: [
      {
        label: 'Bodrum 4 gece',
        text: 'Bodrum için 4 gece her şey dahil tatil paketi öner',
      },
      {
        label: 'Romantik kaçamak',
        text: 'Çiftler için romantik bir hafta sonu kaçamağı öner',
      },
      {
        label: 'Aile tatili',
        text: 'Çocuklarla, her şey dahil bir aile tatili öner',
      },
      {
        label: `${city}'dan yakın`,
        text: `${city}'dan yakın araba ile gidilebilir bir kaçamak öner`,
      },
    ],
  };
}

export default async function TatilKesfetPage() {
  const ctx = await getUserContext();
  const [user, welcomeDeals] = await Promise.all([
    getCurrentUser(),
    listTravelDeals(8),
  ]);

  const welcomeContent = travelWelcome(ctx.city);

  return (
    <>
      {/* Üst bar — geri dön + breadcrumb */}
      <div className="from-sky-600 to-cyan-500 bg-gradient-to-r text-white">
        <Container className="flex items-center justify-between gap-4 py-3">
          <Link
            href="/tatil"
            className="inline-flex items-center gap-1.5 text-sm font-medium opacity-90 transition-opacity hover:opacity-100"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Tatil ana sayfa
          </Link>
          <p className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase">
            <Palmtree className="size-3.5" aria-hidden="true" />
            AI tatil keşfet
          </p>
        </Container>
      </div>

      <section
        aria-label="AI tatil sohbeti"
        className="from-sky-50 via-background to-background dark:from-sky-950/30 dark:via-background dark:to-background relative isolate flex h-[calc(100svh-4rem-2.75rem)] flex-col bg-gradient-to-b"
      >
        <Suspense fallback={<Skeleton className="h-full w-full rounded-none" />}>
          <ChatContainer
            welcomeDeals={welcomeDeals}
            city={ctx.city}
            welcomeContent={welcomeContent}
            isAuthenticated={Boolean(user)}
          />
        </Suspense>
      </section>
    </>
  );
}
