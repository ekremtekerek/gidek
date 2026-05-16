import Link from 'next/link';
import { Hotel } from 'lucide-react';
import { DealRowToggle } from '@/components/admin/deal-row-toggle';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { getServiceClient } from '@/lib/db/service';
import { TRAVEL_CATEGORY_SLUGS } from '@/lib/db/queries/travel';
import { cn } from '@/lib/utils/cn';
import { formatTRY } from '@/lib/utils/format';

export const metadata = {
  title: 'Oteller & Tatil · Admin',
  robots: { index: false, follow: false },
};

/**
 * Admin tarafında otel/tatil deal&apos;larının listesi. Normal `/admin/deals`'ten
 * ayrılmasının sebebi: bu deal&apos;lar için ekstra meta (yıldız, oda tipleri,
 * amenities, politikalar) yönetiliyor.
 */
export default async function AdminHotelsPage() {
  const supabase = getServiceClient();

  // Tatil/otel kategorisinde olan deal&apos;ları çek + room_types/meta sayıları.
  const { data: deals } = await supabase
    .from('deals')
    .select(
      `id, slug, title, city, district, original_price, discounted_price, is_active,
       is_featured, published_at, valid_until,
       deal_categories!inner(category:categories!inner(slug)),
       hotel_meta:deal_hotel_meta(star_rating, concept),
       room_types:deal_room_types(id)`,
    )
    .in('deal_categories.category.slug', TRAVEL_CATEGORY_SLUGS as unknown as string[])
    .order('created_at', { ascending: false })
    .limit(200);

  type Row = NonNullable<typeof deals>[number];
  const rows = (deals ?? []) as Row[];

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-end justify-between gap-3">
        <div>
          <p className="text-muted-foreground mb-1 text-xs font-semibold tracking-wide uppercase">
            Yönetim
          </p>
          <h1 className="inline-flex items-center gap-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            <Hotel className="size-6" aria-hidden="true" />
            Oteller &amp; Tatil
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {rows.length} kayıt · sadece <code className="text-foreground">tatil-otelleri</code>,{' '}
            <code className="text-foreground">sehir-otelleri</code>,{' '}
            <code className="text-foreground">turlar</code> kategorisindeki deal&apos;lar
          </p>
        </div>
        <Link
          href="/admin/oteller/yeni"
          className={cn(buttonVariants({ variant: 'primary' }))}
        >
          Yeni otel / tatil paketi
        </Link>
      </header>

      <div className="border-border bg-background overflow-hidden rounded-lg border">
        <ul className="divide-y divide-[var(--border)]">
          {rows.map((d) => {
            const meta = Array.isArray(d.hotel_meta) ? d.hotel_meta[0] : d.hotel_meta;
            const roomCount = Array.isArray(d.room_types) ? d.room_types.length : 0;
            const star = meta?.star_rating ?? null;
            const concept = meta?.concept ?? null;

            return (
              <li
                key={d.id}
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
              >
                <div className="flex min-w-0 flex-col gap-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={d.is_active ? 'success' : 'outline'} size="sm">
                      {d.is_active ? 'Aktif' : 'Pasif'}
                    </Badge>
                    {!d.published_at ? (
                      <Badge variant="default" size="sm">Yayında değil</Badge>
                    ) : null}
                    {star ? (
                      <Badge variant="accent" size="sm">
                        {'★'.repeat(star)}
                      </Badge>
                    ) : (
                      <Badge variant="warning" size="sm">Meta eksik</Badge>
                    )}
                    {concept ? (
                      <Badge variant="outline" size="sm">{concept}</Badge>
                    ) : null}
                    <Badge variant={roomCount > 0 ? 'outline' : 'warning'} size="sm">
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
                    href={`/admin/oteller/${d.id}`}
                    className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                  >
                    Düzenle
                  </Link>
                  <DealRowToggle dealId={d.id} isActive={d.is_active} />
                </div>
              </li>
            );
          })}
        </ul>
        {rows.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground text-sm">Henüz otel / tatil deal&apos;ı yok.</p>
            <Link
              href="/admin/oteller/yeni"
              className={cn(buttonVariants({ variant: 'primary', size: 'sm' }), 'mt-3')}
            >
              İlk otelini ekle
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
