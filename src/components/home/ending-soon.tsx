import Link from 'next/link';
import { Clock, Flame } from 'lucide-react';
import { DealCard } from '@/components/deal/deal-card';
import { Container } from '@/components/ui/container';
import type { DealWithMerchant } from '@/lib/db/queries/deals';

interface Props {
  deals: DealWithMerchant[];
}

/**
 * "Yakında biten" vitrini — valid_until 14 gün içinde dolacak aktif fırsatlar.
 * Aciliyet hissi yaratır, conversion'ı artırır. Boşsa hiç render etmiyor.
 */
export function EndingSoon({ deals }: Props) {
  if (deals.length === 0) return null;

  return (
    <section
      aria-labelledby="ending-soon-heading"
      className="border-amber-500/20 bg-gradient-to-b from-amber-500/5 to-transparent py-10 sm:py-12"
    >
      <Container>
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-amber-600 dark:text-amber-400 mb-1 inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase">
              <Flame className="size-3.5" aria-hidden="true" />
              Acele et
            </p>
            <h2 id="ending-soon-heading" className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Yakında biten fırsatlar
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Önümüzdeki 2 hafta içinde sona eriyor.
            </p>
          </div>
          <Link
            href="/gecmis-firsatlar"
            className="text-foreground/80 hover:text-foreground text-sm font-medium underline-offset-4 hover:underline"
          >
            Geçmiş fırsatları gör →
          </Link>
        </div>

        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {deals.slice(0, 8).map((deal) => (
            <li key={deal.id} className="relative">
              <DealCard deal={deal} showFeaturedBadge={false} />
              {/* Kalan gün rozeti solda; indirim rozeti (DealCard) sağda — üst
                  üste binmesin diye sol üst köşeye alındı. */}
              <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-md">
                <Clock className="size-2.5" aria-hidden="true" />
                {daysLeft(deal.valid_until)}
              </span>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

function daysLeft(validUntil: string | null): string {
  if (!validUntil) return '';
  const ms = new Date(validUntil).getTime() - Date.now();
  const days = Math.ceil(ms / 86400_000);
  if (days <= 0) return 'Bugün biter';
  if (days === 1) return 'Yarın biter';
  if (days <= 7) return `${days} gün`;
  return `${Math.ceil(days / 7)} hafta`;
}
