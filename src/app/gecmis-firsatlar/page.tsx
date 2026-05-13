import type { Metadata } from 'next';
import Link from 'next/link';
import { DealCard } from '@/components/deal/deal-card';
import { Container } from '@/components/ui/container';
import { listDeals } from '@/lib/db/queries/deals';
import { getUserContext } from '@/lib/security/user-context-server';

export const dynamic = 'force-dynamic';
export const revalidate = 600; // 10 dk; arşivin hızlı tazelenmesi gerekmiyor

const PAGE_SIZE = 24;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Geçmiş fırsatlar — kaçırdıkların burada',
    description:
      'Sona ermiş, satışı kapanmış fırsatlar arşivi. Bir sonraki benzerini kaçırmamak için kategorilere göz at.',
    alternates: { canonical: '/gecmis-firsatlar' },
    openGraph: {
      title: 'Geçmiş fırsatlar — gidek.net arşivi',
      description: 'Sona ermiş fırsatlar; içerik ve fotoğraflar burada kalmaya devam ediyor.',
      url: '/gecmis-firsatlar',
    },
  };
}

interface SearchParams {
  page?: string;
}

export default async function PastDealsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { page } = await searchParams;
  const pageNum = Math.max(1, Number(page ?? '1') || 1);
  const offset = (pageNum - 1) * PAGE_SIZE;

  const ctx = await getUserContext();
  // Bir sayfa fazla çek — bir sonraki sayfa var mı anlayabilelim.
  const deals = await listDeals({
    status: 'expired',
    limit: PAGE_SIZE + 1,
    offset,
    city: ctx.city,
  });
  const hasNext = deals.length > PAGE_SIZE;
  const visible = hasNext ? deals.slice(0, PAGE_SIZE) : deals;

  return (
    <Container className="pt-8 pb-16 sm:pt-12">
      <header className="mb-8 flex flex-col gap-3">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Geçmiş fırsatlar
        </h1>
        <p className="text-muted-foreground max-w-2xl text-sm sm:text-base">
          Bu fırsatlar artık kaçtı — satın alınamıyor, rezervasyon yapılamıyor.
          İçerikleri ve görselleri burada kalmaya devam ediyor; benzer bir
          fırsat çıktığında haberdar olmak için kategorilere göz atabilirsin.
        </p>
      </header>

      {visible.length === 0 ? (
        <div className="border-border bg-muted/30 rounded-xl border p-10 text-center">
          <p className="text-muted-foreground">
            Henüz arşivde fırsat yok. {ctx.city} dışında bir şehir mi
            arıyorsun?{' '}
            <Link href="/" className="text-foreground hover:underline underline-offset-2">
              Anasayfaya dön
            </Link>
            .
          </p>
        </div>
      ) : (
        <>
          <ul
            aria-label="Geçmiş fırsatlar listesi"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            {visible.map((deal) => (
              <li key={deal.id}>
                <DealCard deal={deal} expired />
              </li>
            ))}
          </ul>

          <nav
            aria-label="Sayfalama"
            className="mt-10 flex items-center justify-between gap-3 text-sm"
          >
            {pageNum > 1 ? (
              <Link
                href={`/gecmis-firsatlar?page=${pageNum - 1}`}
                className="hover:text-foreground text-muted-foreground"
              >
                ← Önceki
              </Link>
            ) : (
              <span />
            )}
            <span className="text-muted-foreground">Sayfa {pageNum}</span>
            {hasNext ? (
              <Link
                href={`/gecmis-firsatlar?page=${pageNum + 1}`}
                className="hover:text-foreground text-muted-foreground"
              >
                Sonraki →
              </Link>
            ) : (
              <span />
            )}
          </nav>
        </>
      )}
    </Container>
  );
}
