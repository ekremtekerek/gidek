import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Banknote, Sparkles, Wand2 } from 'lucide-react';
import { PackageBuilderForm } from '@/components/travel/package-builder-form';
import { PackageResult } from '@/components/travel/package-result';
import { Container } from '@/components/ui/container';
import { buildTravelPackage } from '@/lib/ai/travel-package';
import { fetchPackageInventory, listTravelLocations } from '@/lib/db/queries/travel';
import { SITE } from '@/lib/utils/site-config';

export const metadata: Metadata = {
  title: 'AI Tatil Paketi Tasarla · gidek',
  description:
    'Bütçen + tarzın + yolcu profilin → AI sana özel paketi kursun. Otel + yemek + aktivite + spa.',
  alternates: { canonical: '/tatil/paket' },
  openGraph: {
    title: 'gidek — AI Tatil Paketi Tasarla',
    description:
      'Tatilin tüm parçalarını AI ile tek pakette topla — rakiplerde yok.',
    url: `${SITE.url}/tatil/paket`,
  },
};

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{
    dest?: string;
    budget?: string;
    adults?: string;
    kids?: string;
    days?: string;
    themes?: string;
  }>;
}

export default async function TatilPaketPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const locations = await listTravelLocations();

  const dest = sp.dest?.trim();
  const budget = sp.budget ? Math.max(3000, Number(sp.budget)) : null;
  const adults = sp.adults ? Math.max(1, Math.min(8, Number(sp.adults))) : 2;
  const kids = sp.kids ? Math.max(0, Math.min(6, Number(sp.kids))) : 0;
  const days = sp.days ? Math.max(1, Math.min(14, Number(sp.days))) : 4;
  const themes = sp.themes ? sp.themes.split(',').map((t) => t.trim()).filter(Boolean) : [];

  const hasInputs = dest && budget;

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
          <span className="bg-gradient-to-br from-emerald-500 to-teal-500 inline-flex size-14 items-center justify-center rounded-full shadow-lg">
            <Banknote className="size-7 text-white" aria-hidden="true" />
          </span>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Bütçeni söyle,{' '}
            <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
              AI tatilini paketlesin
            </span>
          </h1>
          <p className="text-muted-foreground mx-auto mt-3 max-w-xl text-sm leading-relaxed sm:text-base">
            Otel + yemek + aktivite + spa — hepsini tek pakette topla.
            Rakipler sadece &ldquo;otel+uçak&rdquo; veriyor; biz <strong>tam tatil deneyimi</strong>
            tasarlıyoruz.
          </p>
        </header>

        <div className="mx-auto max-w-xl">
          <PackageBuilderForm locations={locations} />
        </div>

        <section className="mx-auto mt-12 grid max-w-3xl gap-4 sm:grid-cols-3">
          <FeatureCard
            icon={<Banknote className="size-5" />}
            title="Bütçe odaklı"
            text="AI bütçeni aşmamak için optimize eder — sapma %15"
          />
          <FeatureCard
            icon={<Wand2 className="size-5" />}
            title="Tam paket"
            text="Otel + restoran + aktivite + spa hepsi birlikte"
          />
          <FeatureCard
            icon={<Sparkles className="size-5" />}
            title="Gerçek fırsatlar"
            text="Mock değil — gidek envanterinden gerçek deal'lar"
          />
        </section>
      </Container>
    );
  }

  // Paket üret
  const { deals: inventory, categoryByDealId } = await fetchPackageInventory(dest!, 60);

  if (inventory.length === 0) {
    return (
      <Container className="py-12 sm:py-16">
        <Link
          href="/tatil/paket"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Yeniden seç
        </Link>
        <div className="mt-6 rounded-xl border border-dashed border-border bg-muted/30 p-10 text-center">
          <p className="font-semibold">{dest} için henüz envanter yok</p>
          <p className="text-muted-foreground mt-1 text-xs">
            Bodrum, Antalya, Kapadokya, Çeşme genelde zengin.
          </p>
        </div>
      </Container>
    );
  }

  let pkg: Awaited<ReturnType<typeof buildTravelPackage>> | null = null;
  let aiError: string | null = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      pkg = await buildTravelPackage({
        destination: dest!,
        budget: budget!,
        adults,
        kids,
        days,
        themes,
        inventory,
        categoryByDealId,
      });
      aiError = null;
      break;
    } catch (err) {
      aiError = err instanceof Error ? err.message : 'Bilinmeyen hata';
      console.error(`[paket] attempt ${attempt + 1} failed:`, err);
    }
  }

  if (!pkg) {
    return (
      <Container className="py-12 sm:py-16">
        <Link
          href="/tatil/paket"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Yeniden seç
        </Link>
        <div className="border-amber-500/30 bg-amber-50 dark:bg-amber-950/30 mt-6 rounded-xl border p-6">
          <p className="text-amber-900 dark:text-amber-100 inline-flex items-center gap-2 text-base font-bold">
            <Sparkles className="size-5" aria-hidden="true" />
            AI paket oluşturulamadı
          </p>
          <p className="text-amber-900/80 dark:text-amber-100/80 mt-2 text-sm leading-relaxed">
            Gemini bu kombinasyonda paket üretemedi. Tekrar dene veya parametre değiştir.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={`/tatil/paket?dest=${encodeURIComponent(dest!)}&budget=${budget}&adults=${adults}&days=${days}${kids ? `&kids=${kids}` : ''}${themes.length ? `&themes=${themes.join(',')}` : ''}`}
              className="bg-amber-600 hover:bg-amber-700 inline-flex h-10 items-center gap-1.5 rounded-md px-4 text-sm font-bold text-white transition-colors"
            >
              Tekrar dene
            </Link>
            <Link
              href="/tatil/paket"
              className="border-amber-600/40 hover:bg-amber-100 dark:hover:bg-amber-900/40 inline-flex h-10 items-center gap-1.5 rounded-md border px-4 text-sm font-semibold transition-colors"
            >
              Yeni parametreler
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
      <Link
        href="/tatil/paket"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Yeni paket
      </Link>
      <div className="mt-4">
        <PackageResult
          pkg={pkg}
          inventory={inventory}
          destination={dest!}
          budget={budget!}
          days={days}
        />
      </div>
    </Container>
  );
}

function FeatureCard({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="border-border bg-background flex flex-col gap-2 rounded-xl border p-4 shadow-sm">
      <span className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 inline-flex size-9 items-center justify-center rounded-full">
        {icon}
      </span>
      <p className="text-sm font-bold">{title}</p>
      <p className="text-muted-foreground text-xs leading-relaxed">{text}</p>
    </div>
  );
}
