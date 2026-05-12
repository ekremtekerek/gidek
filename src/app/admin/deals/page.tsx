import Link from 'next/link';
import { DealRowToggle } from '@/components/admin/deal-row-toggle';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { getServiceClient } from '@/lib/db/service';
import { cn } from '@/lib/utils/cn';
import { formatTRY } from '@/lib/utils/format';

export default async function AdminDealsPage() {
  const supabase = getServiceClient();
  const { data: deals } = await supabase
    .from('deals')
    .select(
      'id, slug, title, city, district, original_price, discounted_price, is_active, is_featured, published_at, valid_until, embedding',
    )
    .order('created_at', { ascending: false })
    .limit(200);

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-end justify-between gap-3">
        <div>
          <p className="text-muted-foreground mb-1 text-xs font-semibold tracking-wide uppercase">
            Yönetim
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Fırsatlar</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {deals?.length ?? 0} kayıt listeleniyor
          </p>
        </div>
        <Link
          href="/admin/deals/yeni"
          className={cn(buttonVariants({ variant: 'primary' }))}
        >
          Yeni fırsat
        </Link>
      </header>

      <div className="border-border bg-background overflow-hidden rounded-lg border">
        <ul className="divide-y divide-[var(--border)]">
          {(deals ?? []).map((d) => (
            <li
              key={d.id}
              className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
            >
              <div className="flex min-w-0 flex-col gap-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={d.is_active ? 'success' : 'outline'} size="sm">
                    {d.is_active ? 'Aktif' : 'Pasif'}
                  </Badge>
                  {d.is_featured ? (
                    <Badge variant="accent" size="sm">Öne çıkan</Badge>
                  ) : null}
                  {!d.embedding ? (
                    <Badge variant="warning" size="sm">Embedding yok</Badge>
                  ) : null}
                  {!d.published_at ? (
                    <Badge variant="default" size="sm">Yayında değil</Badge>
                  ) : null}
                </div>
                <p className="line-clamp-1 text-sm font-semibold">{d.title}</p>
                <p className="text-muted-foreground text-xs">
                  {[d.district, d.city].filter(Boolean).join(', ')} ·{' '}
                  {formatTRY(d.discounted_price)} <span className="line-through">{formatTRY(d.original_price)}</span>
                </p>
              </div>
              <div className="flex flex-wrap gap-2 sm:flex-nowrap">
                <Link
                  href={`/f/${d.slug}`}
                  className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
                  target="_blank"
                >
                  Önizle
                </Link>
                <Link
                  href={`/admin/deals/${d.id}`}
                  className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                >
                  Düzenle
                </Link>
                <DealRowToggle dealId={d.id} isActive={d.is_active} />
              </div>
            </li>
          ))}
        </ul>
        {(deals?.length ?? 0) === 0 ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground text-sm">Henüz fırsat yok.</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
