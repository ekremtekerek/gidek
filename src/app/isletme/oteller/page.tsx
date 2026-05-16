import Link from 'next/link';
import { BedDouble, Hotel, Plus, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { TRAVEL_CATEGORY_SLUGS } from '@/lib/db/queries/travel';
import { getServiceClient } from '@/lib/db/service';
import { requireMerchant } from '@/lib/security/auth';
import { cn } from '@/lib/utils/cn';
import { formatTRY } from '@/lib/utils/format';

export const metadata = {
  title: 'Otellerim · İşletme',
  robots: { index: false, follow: false },
};

export default async function MerchantHotelsPage() {
  const { merchantId } = await requireMerchant();
  const supabase = getServiceClient();

  // İşletmenin sadece travel kategorilerindeki deal'ları
  const { data: deals } = await supabase
    .from('deals')
    .select(
      `id, slug, title, city, district, original_price, discounted_price, is_active, published_at,
       deal_categories!inner(category:categories!inner(slug)),
       hotel_meta:deal_hotel_meta(star_rating, concept),
       room_types:deal_room_types(id)`,
    )
    .eq('merchant_id', merchantId)
    .in('deal_categories.category.slug', TRAVEL_CATEGORY_SLUGS as unknown as string[])
    .order('created_at', { ascending: false });

  type Row = NonNullable<typeof deals>[number];
  const rows = (deals ?? []) as Row[];

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-end justify-between gap-3">
        <div>
          <p className="text-muted-foreground mb-1 text-xs font-semibold tracking-wide uppercase">
            İşletme paneli
          </p>
          <h1 className="inline-flex items-center gap-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            <Hotel className="size-6" aria-hidden="true" />
            Otellerim
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {rows.length} otel / tatil paketi · sadece sizin işletmenize ait
          </p>
        </div>
        <Link
          href="/isletme/oteller/yeni"
          className={cn(buttonVariants({ variant: 'primary' }), 'gap-2')}
        >
          <Plus className="size-4" aria-hidden="true" />
          Yeni otel
        </Link>
      </header>

      {rows.length === 0 ? (
        <div className="border-border bg-muted/30 flex flex-col items-center gap-3 rounded-xl border border-dashed p-10 text-center">
          <Hotel className="text-muted-foreground size-8" aria-hidden="true" />
          <p className="text-foreground/90 text-sm">
            Henüz otel veya tatil paketin yok.
          </p>
          <p className="text-muted-foreground text-xs">
            Yıldız, konsept, tesis özellikleri, oda tipleri ve politikalarla birlikte detaylı bir
            otel oluşturmak için tıkla.
          </p>
          <Link
            href="/isletme/oteller/yeni"
            className={cn(buttonVariants({ variant: 'primary', size: 'sm' }), 'mt-1 gap-2')}
          >
            <Plus className="size-4" aria-hidden="true" />
            İlk otelimi oluştur
          </Link>
        </div>
      ) : (
        <ul className="border-border bg-background divide-y divide-[var(--border)] rounded-xl border">
          {rows.map((d) => {
            const meta = Array.isArray(d.hotel_meta) ? d.hotel_meta[0] : d.hotel_meta;
            const roomCount = Array.isArray(d.room_types) ? d.room_types.length : 0;
            const star = meta?.star_rating ?? null;
            const concept = meta?.concept ?? null;
            const isPublished = Boolean(d.published_at && d.is_active);

            return (
              <li
                key={d.id}
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
              >
                <div className="flex min-w-0 flex-col gap-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={isPublished ? 'success' : 'warning'} size="sm">
                      {isPublished ? 'Yayında' : 'Yayında değil'}
                    </Badge>
                    {star ? (
                      <Badge variant="accent" size="sm" className="inline-flex items-center gap-0.5">
                        {Array.from({ length: star }).map((_, i) => (
                          <Star key={i} className="size-3 fill-current" aria-hidden="true" />
                        ))}
                      </Badge>
                    ) : null}
                    {concept ? (
                      <Badge variant="outline" size="sm">
                        {concept}
                      </Badge>
                    ) : null}
                    <Badge variant={roomCount > 0 ? 'outline' : 'warning'} size="sm" className="inline-flex items-center gap-1">
                      <BedDouble className="size-3" aria-hidden="true" />
                      {roomCount} oda tipi
                    </Badge>
                  </div>
                  <p className="line-clamp-1 text-sm font-semibold">{d.title}</p>
                  <p className="text-muted-foreground text-xs">
                    {[d.district, d.city].filter(Boolean).join(', ')} ·{' '}
                    {formatTRY(d.discounted_price)}{' '}
                    <span className="line-through">{formatTRY(d.original_price)}</span>
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
                    href={`/isletme/oteller/${d.id}`}
                    className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                  >
                    Düzenle
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
