import type { Metadata } from 'next';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { CouponRowActions } from '@/components/admin/coupon-row-actions';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { getServiceClient } from '@/lib/db/service';
import { cn } from '@/lib/utils/cn';
import { formatTRY } from '@/lib/utils/format';

export const metadata: Metadata = {
  title: 'Kuponlar · Admin',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

const DATE_FORMATTER = new Intl.DateTimeFormat('tr-TR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

export default async function AdminCouponsPage() {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from('coupons')
    .select(
      'id, code, discount_type, discount_value, min_order_amount, max_uses, used_count, valid_from, valid_until, is_active',
    )
    .order('created_at', { ascending: false })
    .limit(200);
  const coupons = data ?? [];

  const now = new Date();

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-end justify-between gap-3">
        <div>
          <p className="text-muted-foreground mb-1 text-xs font-semibold tracking-wide uppercase">
            Yönetim
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">Kuponlar</h1>
          <p className="text-muted-foreground mt-1 text-sm">{coupons.length} kayıt</p>
        </div>
        <Link
          href="/admin/coupons/yeni"
          className={cn(buttonVariants({ variant: 'primary' }))}
        >
          <Plus className="size-4" aria-hidden="true" />
          Yeni kupon
        </Link>
      </header>

      {coupons.length === 0 ? (
        <p className="text-muted-foreground border-border bg-muted/30 rounded-xl border border-dashed p-8 text-center text-sm">
          Henüz kupon yok.
        </p>
      ) : (
        <ul className="border-border bg-background divide-y divide-[var(--border)] rounded-xl border">
          {coupons.map((c) => {
            const expired = c.valid_until ? new Date(c.valid_until) <= now : false;
            const exhausted = c.max_uses ? c.used_count >= c.max_uses : false;
            const inactive = !c.is_active || expired || exhausted;
            const discountLabel =
              c.discount_type === 'percent'
                ? `%${c.discount_value}`
                : formatTRY(c.discount_value);
            return (
              <li
                key={c.id}
                className="flex items-center gap-4 p-4 transition-colors hover:bg-muted/30"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/admin/coupons/${c.id}`}
                      className="font-mono text-sm font-semibold tracking-wider hover:underline"
                    >
                      {c.code}
                    </Link>
                    <Badge variant="accent" size="sm">{discountLabel} indirim</Badge>
                    {expired ? (
                      <Badge variant="warning" size="sm">Süresi doldu</Badge>
                    ) : null}
                    {exhausted ? (
                      <Badge variant="warning" size="sm">Limit doldu</Badge>
                    ) : null}
                    {!c.is_active ? <Badge variant="outline" size="sm">Pasif</Badge> : null}
                  </div>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    Min ₺{c.min_order_amount} · {c.used_count}
                    {c.max_uses ? ` / ${c.max_uses}` : ''} kullanım
                    {c.valid_until ? ` · ${DATE_FORMATTER.format(new Date(c.valid_until))}'ye kadar` : ' · sonsuz'}
                  </p>
                </div>
                <Link
                  href={`/admin/coupons/${c.id}`}
                  className={cn(
                    buttonVariants({ variant: 'outline', size: 'sm' }),
                    inactive ? 'opacity-80' : '',
                  )}
                >
                  Düzenle
                </Link>
                <CouponRowActions id={c.id} isActive={c.is_active} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
