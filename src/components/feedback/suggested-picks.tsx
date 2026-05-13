import { Sparkles } from 'lucide-react';
import { DealCard } from '@/components/deal/deal-card';
import type { DealWithMerchant } from '@/lib/db/queries/deals';

interface Props {
  deals: DealWithMerchant[];
  /** Başlık metni. */
  title?: string;
  /** Açıklama. */
  subtitle?: string;
}

/**
 * Empty state'lerin altında "boş kalmasın" diye gösterilen fırsat seçkisi.
 * Tipik kullanım: /favorilerim, /rezervasyonlarim, /profil/aramalar boşken
 * trending 3-4 fırsat öner — kullanıcı boş ekrandan ayrılmasın.
 */
export function SuggestedPicks({
  deals,
  title = 'Bunlar ilgini çekebilir',
  subtitle = 'Şu an öne çıkan fırsatlar — biriyle başlayabilirsin.',
}: Props) {
  if (deals.length === 0) return null;
  return (
    <section aria-labelledby="suggested-picks-heading" className="mt-12">
      <header className="mb-5 flex flex-col gap-1">
        <p className="text-muted-foreground inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase">
          <Sparkles className="size-3.5" aria-hidden="true" />
          Öneri
        </p>
        <h2
          id="suggested-picks-heading"
          className="text-lg font-semibold tracking-tight sm:text-xl"
        >
          {title}
        </h2>
        <p className="text-muted-foreground text-sm">{subtitle}</p>
      </header>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        {deals.slice(0, 3).map((d) => (
          <li key={d.id}>
            <DealCard deal={d} />
          </li>
        ))}
      </ul>
    </section>
  );
}
