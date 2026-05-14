import Link from 'next/link';
import { Clock, Plus, ShieldCheck, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { listMerchantDeals } from '@/lib/db/queries/merchant-portal';
import { requireMerchant } from '@/lib/security/auth';
import { cn } from '@/lib/utils/cn';
import { formatTRY } from '@/lib/utils/format';

const DATE_FORMATTER = new Intl.DateTimeFormat('tr-TR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

export default async function MerchantDealsPage() {
  const { merchantId } = await requireMerchant();
  const deals = await listMerchantDeals(merchantId);

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-end justify-between gap-3">
        <div>
          <p className="text-muted-foreground mb-1 text-xs font-semibold tracking-wide uppercase">
            İşletme paneli
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Fırsatlarım</h1>
          <p className="text-muted-foreground mt-1 text-sm">{deals.length} kayıt</p>
        </div>
        <Link
          href="/isletme/firsatlar/yeni"
          className={cn(buttonVariants({ variant: 'primary' }), 'gap-2')}
        >
          <Plus className="size-4" aria-hidden="true" />
          Yeni başvuru
        </Link>
      </header>

      {deals.length === 0 ? (
        <div className="border-border bg-muted/30 flex flex-col items-center gap-3 rounded-xl border border-dashed p-10 text-center">
          <p className="text-foreground/90 text-sm">Henüz fırsatın yok.</p>
          <p className="text-muted-foreground text-xs">
            İlk fırsatını gönder, admin onayından sonra yayına girer.
          </p>
          <Link
            href="/isletme/firsatlar/yeni"
            className={cn(buttonVariants({ variant: 'primary', size: 'sm' }), 'mt-1 gap-2')}
          >
            <Plus className="size-4" aria-hidden="true" />
            İlk fırsatı oluştur
          </Link>
        </div>
      ) : (
        <ul className="border-border bg-background divide-y divide-[var(--border)] rounded-xl border">
          {deals.map((d) => {
            const isPublished = Boolean(d.publishedAt && d.isActive);
            const isPending = !isPublished;
            return (
              <li
                key={d.id}
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4 sm:p-5"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold">{d.title}</p>
                    {isPublished ? (
                      <Badge variant="success" size="sm" className="inline-flex items-center gap-1">
                        <ShieldCheck className="size-3" aria-hidden="true" />
                        Yayında
                      </Badge>
                    ) : (
                      <Badge variant="warning" size="sm" className="inline-flex items-center gap-1">
                        <Clock className="size-3" aria-hidden="true" />
                        Onay bekliyor
                      </Badge>
                    )}
                    {d.ratingCount > 0 ? (
                      <Badge variant="outline" size="sm" className="inline-flex items-center gap-1">
                        <Star className="size-3 fill-amber-500 text-amber-500" aria-hidden="true" />
                        {d.ratingAvg?.toFixed(1)} · {d.ratingCount}
                      </Badge>
                    ) : null}
                  </div>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    {d.city} ·{' '}
                    <span className="text-foreground font-medium">
                      {formatTRY(d.discountedPrice)}
                    </span>
                    {d.discountedPrice < d.originalPrice ? (
                      <span className="ms-1 line-through">{formatTRY(d.originalPrice)}</span>
                    ) : null}{' '}
                    · {d.soldCount} satış · {DATE_FORMATTER.format(new Date(d.createdAt))}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  {isPublished ? (
                    <Link
                      href={`/f/${d.slug}`}
                      target="_blank"
                      className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
                    >
                      Sayfada gör
                    </Link>
                  ) : null}
                  <Link
                    href={`/isletme/firsatlar/${d.id}`}
                    className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                  >
                    {isPending ? 'Gözden geçir' : 'Düzenle'}
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
