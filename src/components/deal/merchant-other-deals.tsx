import { DealCard } from '@/components/deal/deal-card';
import { getDealsByMerchant } from '@/lib/db/queries/deals';

interface Props {
  merchantId: string;
  merchantName: string;
  excludeDealId: string;
  limit?: number;
}

/**
 * Aynı işletmenin diğer aktif fırsatları — detay sayfasında kullanıcıyı
 * işletmenin başka tekliflerine yönlendirir. Server fetch + RSC.
 */
export async function MerchantOtherDeals({
  merchantId,
  merchantName,
  excludeDealId,
  limit = 4,
}: Props) {
  const deals = await getDealsByMerchant(merchantId, excludeDealId, limit);
  if (deals.length === 0) return null;

  return (
    <section aria-labelledby="merchant-deals-heading" className="border-border border-t pt-10">
      <div className="mb-5 flex flex-col gap-1">
        <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
          İşletmenin diğer fırsatları
        </p>
        <h2 id="merchant-deals-heading" className="text-2xl font-semibold tracking-tight">
          {merchantName}
        </h2>
      </div>

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {deals.map((deal) => (
          <li key={deal.id}>
            <DealCard deal={deal} />
          </li>
        ))}
      </ul>
    </section>
  );
}
