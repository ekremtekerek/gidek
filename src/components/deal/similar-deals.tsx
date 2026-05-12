import { DealCard } from '@/components/deal/deal-card';
import { listDeals } from '@/lib/db/queries/deals';

interface Props {
  categorySlug: string;
  excludeDealId: string;
  /** Maksimum kart sayısı (default 4). */
  limit?: number;
}

/**
 * Aynı kategoriden alternatif fırsatlar — kullanıcı detay sayfasından çıkmasın
 * diye altta öneri grid'i. Server fetch + RSC, küçük bir liste.
 */
export async function SimilarDeals({ categorySlug, excludeDealId, limit = 4 }: Props) {
  const deals = await listDeals({ categorySlug, limit: limit + 1 });
  const filtered = deals.filter((d) => d.id !== excludeDealId).slice(0, limit);

  if (filtered.length === 0) return null;

  return (
    <section aria-labelledby="similar-heading" className="border-border border-t pt-10">
      <div className="mb-5 flex flex-col gap-1">
        <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
          Benzer fırsatlar
        </p>
        <h2 id="similar-heading" className="text-2xl font-semibold tracking-tight">
          Hoşuna gidebilir
        </h2>
      </div>

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {filtered.map((deal) => (
          <li key={deal.id}>
            <DealCard deal={deal} />
          </li>
        ))}
      </ul>
    </section>
  );
}
