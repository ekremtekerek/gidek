import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, CalendarDays, Sparkles, Wand2 } from 'lucide-react';
import { TravelPlanForm } from '@/components/travel/travel-plan-form';
import { TravelPlanResult } from '@/components/travel/travel-plan-result';
import { Container } from '@/components/ui/container';
import { generateTravelPlan } from '@/lib/ai/travel-day-plan';
import { getPublicClient } from '@/lib/db/public';
import { listTravelLocations } from '@/lib/db/queries/travel';
import type { DealWithMerchant } from '@/lib/db/queries/deals';
import { SITE } from '@/lib/utils/site-config';

export const metadata: Metadata = {
  title: 'AI Tatil Planlayıcı · gidek',
  description:
    'Yapay zeka 4 günlük tatilini saat saat planlasın — otel, yemek, aktivite hepsi birlikte.',
  alternates: { canonical: '/tatil/plan' },
  openGraph: {
    title: 'gidek AI Tatil Planlayıcı',
    description: 'Tatilini saat saat AI ile planla — rakiplerde yok.',
    url: `${SITE.url}/tatil/plan`,
  },
};

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{
    dest?: string;
    nights?: string;
    adults?: string;
    kids?: string;
    pref?: string;
  }>;
}

/**
 * Bölgedeki uygun fırsatları çek — destinasyon string'i deal.city veya
 * deal.district eşleşmesi.
 */
async function fetchAreaInventory(destination: string): Promise<DealWithMerchant[]> {
  const supabase = getPublicClient();
  const now = new Date().toISOString();
  const dest = destination.trim();
  if (!dest) return [];

  const { data } = await supabase
    .from('deals')
    .select(`*, merchant:merchants ( name, slug, city, district, lat, lng, working_hours )`)
    .eq('is_active', true)
    .gt('valid_until', now)
    .not('published_at', 'is', null)
    .or(`city.eq.${dest},district.eq.${dest}`)
    .order('sold_count', { ascending: false })
    .limit(60);

  return (data ?? []) as unknown as DealWithMerchant[];
}

export default async function TatilPlanPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const [locations] = await Promise.all([listTravelLocations()]);

  const dest = sp.dest?.trim();
  const nights = sp.nights ? Math.max(1, Math.min(14, Number(sp.nights))) : null;
  const adults = sp.adults ? Math.max(1, Math.min(6, Number(sp.adults))) : 2;
  const kids = sp.kids ? Math.max(0, Math.min(4, Number(sp.kids))) : 0;
  const pref = sp.pref?.trim() || undefined;

  const hasInputs = dest && nights;

  if (!hasInputs) {
    return (
      <Container className="py-10 sm:py-14">
        <Link
          href="/tatil"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Tatil ana sayfa
        </Link>

        <header className="mt-4 mb-8 text-center">
          <span className="bg-gradient-to-br from-sky-500 to-cyan-500 inline-flex size-14 items-center justify-center rounded-full shadow-lg">
            <Wand2 className="size-7 text-white" aria-hidden="true" />
          </span>
          <p className="text-sky-700 dark:text-sky-300 mt-3 inline-flex items-center gap-1.5 text-xs font-bold tracking-widest uppercase">
            <Sparkles className="size-3.5" aria-hidden="true" />
            AI Tatil Planlayıcı
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Yapay zeka tatilini{' '}
            <span className="bg-gradient-to-r from-sky-600 to-cyan-500 bg-clip-text text-transparent">
              saat saat
            </span>{' '}
            planlasın
          </h1>
          <p className="text-muted-foreground mx-auto mt-3 max-w-xl text-sm leading-relaxed sm:text-base">
            Otel sadece bir başlangıç. Yemek, aktivite, masaj, tur — bölgendeki <strong>tüm gidek
            fırsatlarını</strong> birleştirip 4 günlük gezini hazırlıyoruz. Rakiplerde bunun
            yarısı bile yok.
          </p>
        </header>

        <div className="mx-auto max-w-xl">
          <TravelPlanForm locations={locations} />
        </div>

        <section className="mx-auto mt-12 grid max-w-3xl gap-4 sm:grid-cols-3">
          <FeatureCard
            icon={<CalendarDays className="size-5" />}
            title="Saat saat program"
            text="Sabah kahvaltıdan gece eğlencesine; her şey çakışmasız zincir"
          />
          <FeatureCard
            icon={<Wand2 className="size-5" />}
            title="Gerçek fırsatlar"
            text="961+ deneyimden yararlanan, dealSlug'larla bağlı plan"
          />
          <FeatureCard
            icon={<Sparkles className="size-5" />}
            title="Kişisel"
            text="Bütçe + yolcu profilin + ek isteklerin Gemini'ye giriyor"
          />
        </section>
      </Container>
    );
  }

  // Plan üret
  const inventory = await fetchAreaInventory(dest);
  if (inventory.length === 0) {
    return (
      <Container className="py-12 sm:py-16">
        <Link
          href="/tatil/plan"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Yeniden seç
        </Link>
        <div className="mt-6 rounded-xl border border-dashed border-border bg-muted/30 p-10 text-center">
          <p className="font-semibold">{dest} için henüz envanter yok</p>
          <p className="text-muted-foreground mt-1 text-xs">
            Farklı bir destinasyon dene — Bodrum, Antalya, Kapadokya, Çeşme genelde
            zengin.
          </p>
        </div>
      </Container>
    );
  }

  // İki deneme — Gemini schema'ya uymazsa bir kez daha şans ver
  let plan: Awaited<ReturnType<typeof generateTravelPlan>> | null = null;
  let aiError: string | null = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      plan = await generateTravelPlan({
        destination: dest,
        nights,
        travelers: { adults, kids },
        preference: pref,
        inventory,
      });
      aiError = null;
      break;
    } catch (err) {
      aiError = err instanceof Error ? err.message : 'Bilinmeyen hata';
      console.error(`[plan] attempt ${attempt + 1} failed:`, err);
    }
  }

  if (!plan) {
    return (
      <Container className="py-12 sm:py-16">
        <Link
          href="/tatil/plan"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Yeniden seç
        </Link>
        <div className="border-amber-500/30 bg-amber-50 dark:bg-amber-950/30 mt-6 rounded-xl border p-6">
          <p className="text-amber-900 dark:text-amber-100 inline-flex items-center gap-2 text-base font-bold">
            <Sparkles className="size-5" aria-hidden="true" />
            AI plan oluşturulamadı
          </p>
          <p className="text-amber-900/80 dark:text-amber-100/80 mt-2 text-sm leading-relaxed">
            Gemini bu kombinasyonda tam plan üretemedi. Tekrar deneyebilir, ya da
            destinasyon/süre değiştirebilirsin.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={`/tatil/plan?dest=${encodeURIComponent(dest)}&nights=${nights}&adults=${adults}${kids ? `&kids=${kids}` : ''}${pref ? `&pref=${encodeURIComponent(pref)}` : ''}`}
              className="bg-amber-600 hover:bg-amber-700 inline-flex h-10 items-center gap-1.5 rounded-md px-4 text-sm font-bold text-white transition-colors"
            >
              Tekrar dene
            </Link>
            <Link
              href="/tatil/plan"
              className="border-amber-600/40 hover:bg-amber-100 dark:hover:bg-amber-900/40 inline-flex h-10 items-center gap-1.5 rounded-md border px-4 text-sm font-semibold transition-colors"
            >
              Yeni tercihler
            </Link>
          </div>
          {aiError ? (
            <details className="mt-3">
              <summary className="text-amber-900/60 dark:text-amber-100/60 cursor-pointer text-[11px]">
                Teknik detay
              </summary>
              <pre className="text-amber-900/70 dark:text-amber-100/70 mt-1 overflow-auto whitespace-pre-wrap text-[10px]">
                {aiError}
              </pre>
            </details>
          ) : null}
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-8 sm:py-12">
      <TravelPlanResult
        plan={plan}
        destination={dest}
        nights={nights}
        travelers={{ adults, kids }}
        inventory={inventory}
      />
    </Container>
  );
}

function FeatureCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="border-border bg-background flex flex-col gap-2 rounded-xl border p-4 shadow-sm">
      <span className="bg-sky-500/15 text-sky-700 dark:text-sky-300 inline-flex size-9 items-center justify-center rounded-full">
        {icon}
      </span>
      <p className="text-sm font-bold">{title}</p>
      <p className="text-muted-foreground text-xs leading-relaxed">{text}</p>
    </div>
  );
}
