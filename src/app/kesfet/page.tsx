import type { Metadata } from 'next';
import { Sparkles, Wand2 } from 'lucide-react';
import { DealCard } from '@/components/deal/deal-card';
import { HeroSearch } from '@/components/home/hero-search';
import { Badge } from '@/components/ui/badge';
import { Container } from '@/components/ui/container';
import { listDeals } from '@/lib/db/queries/deals';

export const metadata: Metadata = {
  title: 'AI ile keşfet',
  description:
    'Ne yapmak istediğini yaz, gidek sana en uygun fırsatları AI ile bulsun.',
  alternates: { canonical: '/kesfet' },
};

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function KesfetPage({ searchParams }: PageProps) {
  const { q } = await searchParams;
  const query = q?.trim() ?? '';
  const recent = await listDeals({ limit: 12 });

  return (
    <>
      <section className="border-border border-b py-10 sm:py-14">
        <Container className="flex flex-col items-center gap-4 text-center">
          <Badge variant="default" size="md" className="inline-flex items-center gap-1.5">
            <Sparkles className="size-3.5" aria-hidden="true" />
            AI keşif
          </Badge>
          {query ? (
            <h1 className="max-w-2xl text-2xl font-semibold tracking-tight sm:text-3xl">
              “{query}”
            </h1>
          ) : (
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Ne yapmak istediğini yaz
            </h1>
          )}
          <p className="text-muted-foreground max-w-xl text-sm sm:text-base">
            AI öneri motoru şu an entegrasyon aşamasında. Sorgunu kaydettik; gerçek AI yanıtları
            kısa süre içinde devreye girecek.
          </p>

          <HeroSearch />
        </Container>
      </section>

      <section className="py-8">
        <Container>
          <div className="border-border bg-muted/40 mb-6 flex items-start gap-3 rounded-lg border p-4 sm:p-5">
            <Wand2 className="text-foreground/70 mt-0.5 size-5 shrink-0" aria-hidden="true" />
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium">AI yakında bağlanıyor</p>
              <p className="text-muted-foreground text-sm">
                Gemini + RAG pipeline kuruluyor: prompt analizi, fırsat eşleştirme ve sıralama.
                Bu süreçte aşağıdaki en güncel fırsatlara göz atabilirsin.
              </p>
            </div>
          </div>

          <h2 className="mb-4 text-xl font-semibold tracking-tight">Şimdilik bunlara bak</h2>

          {recent.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">Henüz fırsat yok.</p>
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
