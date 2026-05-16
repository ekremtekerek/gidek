import Link from 'next/link';
import { Hotel, Search } from 'lucide-react';
import { DealRowToggle } from '@/components/admin/deal-row-toggle';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getServiceClient } from '@/lib/db/service';
import { TRAVEL_CATEGORY_SLUGS } from '@/lib/db/queries/travel';
import { cn } from '@/lib/utils/cn';
import { formatTRY } from '@/lib/utils/format';

export const metadata = {
  title: 'Oteller & Tatil · Admin',
  robots: { index: false, follow: false },
};

type Status = 'all' | 'published' | 'draft';
type Sort = 'newest' | 'oldest' | 'price-asc' | 'price-desc';

interface SP {
  q?: string;
  status?: Status;
  sort?: Sort;
  page?: string;
}

const PAGE_SIZE = 25;

export default async function AdminHotelsPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const { q, status, sort, page: pageStr } = await searchParams;
  const page = Math.max(1, Number(pageStr) || 1);
  const offset = (page - 1) * PAGE_SIZE;
  const supabase = getServiceClient();
  const term = q && q.trim().length > 0 ? q.trim() : null;

  // Toplam sayı — paginate için (head:true, count: 'exact')
  let countQuery = supabase
    .from('deals')
    .select('id, deal_categories!inner(category:categories!inner(slug))', {
      count: 'exact',
      head: true,
    })
    .in('deal_categories.category.slug', TRAVEL_CATEGORY_SLUGS as unknown as string[]);
  if (term) {
    countQuery = countQuery.or(
      `title.ilike.%${term}%,city.ilike.%${term}%,district.ilike.%${term}%`,
    );
  }
  if (status === 'published') {
    countQuery = countQuery.eq('is_active', true).not('published_at', 'is', null);
  } else if (status === 'draft') {
    countQuery = countQuery.or('is_active.eq.false,published_at.is.null');
  }
  const { count: total } = await countQuery;

  let query = supabase
    .from('deals')
    .select(
      `id, slug, title, city, district, original_price, discounted_price, is_active,
       is_featured, published_at, valid_until,
       deal_categories!inner(category:categories!inner(slug)),
       hotel_meta:deal_hotel_meta(star_rating, concept),
       room_types:deal_room_types(id)`,
    )
    .in('deal_categories.category.slug', TRAVEL_CATEGORY_SLUGS as unknown as string[]);

  if (term) {
    query = query.or(
      `title.ilike.%${term}%,city.ilike.%${term}%,district.ilike.%${term}%`,
    );
  }
  if (status === 'published') {
    query = query.eq('is_active', true).not('published_at', 'is', null);
  } else if (status === 'draft') {
    query = query.or('is_active.eq.false,published_at.is.null');
  }

  // Sıralama
  switch (sort) {
    case 'oldest':
      query = query.order('created_at', { ascending: true });
      break;
    case 'price-asc':
      query = query.order('discounted_price', { ascending: true });
      break;
    case 'price-desc':
      query = query.order('discounted_price', { ascending: false });
      break;
    default:
      query = query.order('created_at', { ascending: false });
  }

  const { data: deals } = await query.range(offset, offset + PAGE_SIZE - 1);

  type Row = NonNullable<typeof deals>[number];
  const rows = (deals ?? []) as Row[];
  const totalCount = total ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  function pageHref(p: number): string {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (status && status !== 'all') params.set('status', status);
    if (sort && sort !== 'newest') params.set('sort', sort);
    if (p > 1) params.set('page', String(p));
    const qs = params.toString();
    return qs ? `/admin/oteller?${qs}` : '/admin/oteller';
  }

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
            {totalCount} kayıt · sayfa {page}/{totalPages} ·{' '}
            <code className="text-foreground">tatil-otelleri</code>,{' '}
            <code className="text-foreground">sehir-otelleri</code>,{' '}
            <code className="text-foreground">turlar</code>
          </p>
        </div>
        <Link
          href="/admin/oteller/yeni"
          className={cn(buttonVariants({ variant: 'primary' }))}
        >
          Yeni otel / tatil paketi
        </Link>
      </header>

      {/* Arama + filtre + sıralama — GET form ile server-side */}
      <form className="border-border bg-background flex flex-wrap items-end gap-2 rounded-lg border p-3 sm:gap-3 sm:p-4">
        <div className="relative min-w-[200px] flex-1">
          <Search
            aria-hidden="true"
            className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2"
          />
          <Input
            name="q"
            defaultValue={q ?? ''}
            placeholder="Başlık, şehir, ilçe ara…"
            className="ps-9"
          />
        </div>
        <select
          name="status"
          defaultValue={status ?? 'all'}
          className="border-border bg-background h-10 rounded-md border px-3 text-sm"
        >
          <option value="all">Tümü</option>
          <option value="published">Yayında</option>
          <option value="draft">Taslak</option>
        </select>
        <select
          name="sort"
          defaultValue={sort ?? 'newest'}
          className="border-border bg-background h-10 rounded-md border px-3 text-sm"
        >
          <option value="newest">En yeni</option>
          <option value="oldest">En eski</option>
          <option value="price-asc">Fiyat: artan</option>
          <option value="price-desc">Fiyat: azalan</option>
        </select>
        <button type="submit" className={cn(buttonVariants({ variant: 'outline' }))}>
          Filtrele
        </button>
        {(q || status || sort) ? (
          <Link
            href="/admin/oteller"
            className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
          >
            Temizle
          </Link>
        ) : null}
      </form>

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

      {/* Pagination */}
      {totalPages > 1 ? (
        <nav aria-label="Sayfalar" className="flex items-center justify-between gap-3 text-sm">
          <Link
            href={pageHref(Math.max(1, page - 1))}
            aria-disabled={page <= 1}
            className={cn(
              buttonVariants({ variant: 'outline', size: 'sm' }),
              page <= 1 ? 'pointer-events-none opacity-50' : '',
            )}
          >
            ← Önceki
          </Link>
          <span className="text-muted-foreground">
            Sayfa <strong className="text-foreground">{page}</strong> / {totalPages}
          </span>
          <Link
            href={pageHref(Math.min(totalPages, page + 1))}
            aria-disabled={page >= totalPages}
            className={cn(
              buttonVariants({ variant: 'outline', size: 'sm' }),
              page >= totalPages ? 'pointer-events-none opacity-50' : '',
            )}
          >
            Sonraki →
          </Link>
        </nav>
      ) : null}
    </div>
  );
}
