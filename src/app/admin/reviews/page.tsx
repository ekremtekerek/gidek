import type { Metadata } from 'next';
import Link from 'next/link';
import { EyeOff, EyeIcon, Star, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getServiceClient } from '@/lib/db/service';
import { cn } from '@/lib/utils/cn';
import { formatDate } from '@/lib/utils/format';
import { ReviewActionsRow } from '@/components/admin/review-actions-row';

export const metadata: Metadata = {
  title: 'Yorumlar · Admin',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ filter?: string }>;
}

export default async function AdminReviewsPage({ searchParams }: PageProps) {
  const { filter } = await searchParams;
  const showHidden = filter === 'hidden';

  const supabase = getServiceClient();
  const { data: reviews } = await supabase
    .from('reviews')
    .select('*, deal:deals ( title, slug )')
    .eq('is_active', !showHidden)
    .order('created_at', { ascending: false })
    .limit(100);

  const items = (reviews ?? []) as Array<{
    id: string;
    display_name: string;
    rating: number;
    body: string;
    is_active: boolean;
    created_at: string;
    deal: { title: string; slug: string } | null;
  }>;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-end justify-between gap-3">
        <div>
          <p className="text-muted-foreground mb-1 text-xs font-semibold tracking-wide uppercase">
            Moderasyon
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">Yorumlar</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {showHidden ? 'Gizlenmiş yorumlar' : 'Aktif yorumlar'} — son 100 kayıt
          </p>
        </div>
        <nav className="border-border bg-background flex rounded-full border p-0.5 text-xs font-medium">
          <Link
            href="/admin/reviews"
            className={cn(
              'rounded-full px-3 py-1.5 transition-colors',
              !showHidden ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-muted',
            )}
          >
            <EyeIcon className="mr-1 inline size-3" aria-hidden="true" />
            Aktif
          </Link>
          <Link
            href="/admin/reviews?filter=hidden"
            className={cn(
              'rounded-full px-3 py-1.5 transition-colors',
              showHidden ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-muted',
            )}
          >
            <EyeOff className="mr-1 inline size-3" aria-hidden="true" />
            Gizli
          </Link>
        </nav>
      </header>

      {items.length === 0 ? (
        <p className="text-muted-foreground border-border bg-muted/30 rounded-xl border border-dashed p-8 text-center text-sm">
          Bu sekmede yorum yok.
        </p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {items.map((r) => (
            <li
              key={r.id}
              className="border-border bg-background flex flex-col gap-2 rounded-lg border p-4 sm:flex-row sm:items-start sm:gap-4"
            >
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold">{r.display_name}</span>
                  <span className="inline-flex items-center gap-0.5 text-xs">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          'size-3',
                          i < r.rating
                            ? 'fill-amber-500 text-amber-500'
                            : 'fill-transparent text-amber-500/30',
                        )}
                        aria-hidden="true"
                      />
                    ))}
                  </span>
                  {!r.is_active ? (
                    <Badge variant="warning" size="sm">Gizli</Badge>
                  ) : null}
                  <span className="text-muted-foreground text-[11px]">
                    {formatDate(r.created_at)}
                  </span>
                </div>
                <p className="text-foreground/90 text-sm leading-relaxed">{r.body}</p>
                {r.deal ? (
                  <Link
                    href={`/f/${r.deal.slug}`}
                    className="text-muted-foreground hover:text-foreground mt-1 inline-block text-xs underline-offset-2 hover:underline"
                  >
                    {r.deal.title}
                  </Link>
                ) : null}
              </div>
              <ReviewActionsRow id={r.id} isActive={r.is_active} />
            </li>
          ))}
        </ul>
      )}

      <p className="text-muted-foreground text-center text-xs">
        Silinen yorumlar geri alınamaz; sadece gerçekten uygunsuz olanları sil. Şüpheli olanları
        <strong className="text-foreground"> Gizle</strong>'yle pasifleştir.{' '}
        <Trash2 className="-mt-0.5 inline size-3" aria-hidden="true" />
      </p>
    </div>
  );
}
