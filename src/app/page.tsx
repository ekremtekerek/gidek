import Link from 'next/link';
import { Search, Sparkles } from 'lucide-react';
import { DealCard } from '@/components/deal/deal-card';
import { Container } from '@/components/ui/container';
import { listDeals } from '@/lib/db/queries/deals';
import { MAIN_CATEGORIES } from '@/lib/utils/constants';
import { SITE } from '@/lib/utils/site-config';

export const revalidate = 300; // ISR: 5 minutes

export default async function HomePage() {
  const [featured, recent] = await Promise.all([
    listDeals({ featured: true, limit: 4 }),
    listDeals({ limit: 12 }),
  ]);

  return (
    <>
      <section aria-label="Hero" className="border-border border-b">
        <Container className="flex flex-col items-center gap-6 py-16 text-center md:py-24">
          <span className="bg-muted inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium">
            <Sparkles className="size-3.5" aria-hidden="true" />
            AI destekli fırsat keşfi
          </span>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl">
            Ne yapmak istediğini söyle, <br className="hidden sm:block" /> gerisini {SITE.name} bulsun.
          </h1>
          <p className="text-muted-foreground max-w-xl text-base sm:text-lg">
            “Cumartesi akşamı eşimle romantik akşam yemeği”, “Pazar ailecek kahvaltı”… İstediğini yaz,
            sana özel fırsatları seçelim.
          </p>

          <Link
            href="/kesfet"
            className="border-border bg-background hover:bg-muted/60 group flex w-full max-w-xl items-center gap-3 rounded-full border px-5 py-3 text-left transition-colors"
            aria-label="Yapay zeka ile fırsat ara"
          >
            <Search className="text-muted-foreground size-5 shrink-0" aria-hidden="true" />
            <span className="text-muted-foreground flex-1 truncate text-sm sm:text-base">
              Örn. “Cumartesi akşamı eşimle 800 TL’ye ne yapabilirim?”
            </span>
            <span className="bg-primary text-primary-foreground hidden rounded-full px-3 py-1.5 text-xs font-medium sm:inline-flex">
              Keşfet
            </span>
          </Link>
        </Container>
      </section>

      <section aria-labelledby="categories-heading" className="py-12">
        <Container>
          <div className="mb-6 flex items-end justify-between">
            <h2 id="categories-heading" className="text-2xl font-semibold tracking-tight">
              Kategoriler
            </h2>
          </div>
          <ul className="flex snap-x snap-mandatory gap-2 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] md:flex-wrap md:overflow-visible">
            {MAIN_CATEGORIES.map((c) => (
              <li key={c.slug} className="snap-start">
                <Link
                  href={`/k/${c.slug}`}
                  className="border-border bg-background hover:bg-muted inline-flex items-center rounded-full border px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </section>

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
