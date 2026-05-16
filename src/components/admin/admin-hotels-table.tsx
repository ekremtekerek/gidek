'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { bulkUpdateHotelsAction, type BulkAction } from '@/app/admin/oteller/actions';
import { DealRowToggle } from '@/components/admin/deal-row-toggle';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';
import { formatTRY } from '@/lib/utils/format';

interface HotelRow {
  id: string;
  slug: string;
  title: string;
  city: string;
  district: string | null;
  originalPrice: number;
  discountedPrice: number;
  isActive: boolean;
  publishedAt: string | null;
  star: number | null;
  concept: string | null;
  roomCount: number;
}

interface Props {
  rows: HotelRow[];
}

/**
 * Admin/oteller liste tablosu — server'dan serialize edilmiş satırları
 * alır, multi-select state'i client'ta tutar. ≥1 seçim olunca alta sticky
 * action bar çıkar: "Yayına al / Yayından kaldır / Sil".
 */
export function AdminHotelsTable({ rows }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();
  const allSelected = rows.length > 0 && selected.size === rows.length;
  const someSelected = selected.size > 0;

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(rows.map((r) => r.id)));
    }
  }

  async function runBulk(action: BulkAction, confirmMsg: string) {
    if (selected.size === 0) return;
    if (action === 'delete' && typeof window !== 'undefined') {
      const ok = window.confirm(
        `${selected.size} oteli SİLMEK üzeresin. Bu geri alınamaz (deal_categories/hotel_meta/oda tipleri de düşer). Emin misin?`,
      );
      if (!ok) return;
    }
    const ids = [...selected];
    startTransition(async () => {
      const res = await bulkUpdateHotelsAction(ids, action);
      if (res.ok) {
        toast.success(`${res.count} otel için ${confirmMsg}`);
        setSelected(new Set());
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  if (rows.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground text-sm">Henüz otel / tatil deal&apos;ı yok.</p>
        <Link
          href="/admin/oteller/yeni"
          className={cn(buttonVariants({ variant: 'primary', size: 'sm' }), 'mt-3')}
        >
          İlk otelini ekle
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="border-border bg-background overflow-hidden rounded-lg border">
        {/* Header: select all */}
        <div className="border-border bg-muted/30 flex items-center gap-3 border-b px-4 py-2.5 text-xs sm:px-5">
          <label className="inline-flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleAll}
              className="accent-foreground size-4"
              aria-label={allSelected ? 'Hiçbirini seçme' : 'Hepsini seç'}
            />
            <span className="text-muted-foreground">
              {someSelected ? `${selected.size} seçili` : 'Tümünü seç'}
            </span>
          </label>
          {someSelected ? (
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="text-muted-foreground hover:text-foreground ms-auto text-xs underline-offset-2 hover:underline"
            >
              Temizle
            </button>
          ) : null}
        </div>

        <ul className="divide-y divide-[var(--border)]">
          {rows.map((d) => {
            const isSel = selected.has(d.id);
            return (
              <li
                key={d.id}
                className={cn(
                  'flex flex-col gap-3 p-4 transition-colors sm:flex-row sm:items-center sm:justify-between sm:p-5',
                  isSel ? 'bg-foreground/5' : '',
                )}
              >
                <div className="flex min-w-0 items-start gap-3">
                  <input
                    type="checkbox"
                    checked={isSel}
                    onChange={() => toggleOne(d.id)}
                    aria-label={`${d.title} seç`}
                    className="accent-foreground mt-1 size-4 shrink-0"
                  />
                  <div className="flex min-w-0 flex-col gap-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={d.isActive ? 'success' : 'outline'} size="sm">
                        {d.isActive ? 'Aktif' : 'Pasif'}
                      </Badge>
                      {!d.publishedAt ? (
                        <Badge variant="default" size="sm">Yayında değil</Badge>
                      ) : null}
                      {d.star ? (
                        <Badge variant="accent" size="sm">{'★'.repeat(d.star)}</Badge>
                      ) : (
                        <Badge variant="warning" size="sm">Meta eksik</Badge>
                      )}
                      {d.concept ? (
                        <Badge variant="outline" size="sm">{d.concept}</Badge>
                      ) : null}
                      <Badge variant={d.roomCount > 0 ? 'outline' : 'warning'} size="sm">
                        {d.roomCount} oda tipi
                      </Badge>
                    </div>
                    <p className="line-clamp-1 text-sm font-semibold">{d.title}</p>
                    <p className="text-muted-foreground text-xs">
                      {[d.district, d.city].filter(Boolean).join(', ')} ·{' '}
                      {formatTRY(d.discountedPrice)}{' '}
                      <span className="line-through">{formatTRY(d.originalPrice)}</span>
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 sm:flex-nowrap">
                  <Link
                    href={`/f/${d.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
                  >
                    Önizle
                  </Link>
                  <Link
                    href={`/admin/oteller/${d.id}`}
                    className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                  >
                    Düzenle
                  </Link>
                  <DealRowToggle dealId={d.id} isActive={d.isActive} />
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Sticky bulk action bar */}
      {someSelected ? (
        <div
          role="region"
          aria-label="Toplu işlem"
          className="border-foreground bg-background fixed inset-x-4 bottom-4 z-50 flex flex-col gap-3 rounded-xl border-2 p-3 shadow-2xl sm:inset-x-auto sm:left-1/2 sm:flex-row sm:items-center sm:-translate-x-1/2 sm:gap-4 sm:px-5 sm:py-3"
        >
          <p className="text-sm font-semibold">
            {selected.size} otel seçili
          </p>
          <div className="flex flex-wrap gap-2 sm:flex-nowrap">
            <button
              type="button"
              onClick={() => runBulk('publish', 'yayına alındı')}
              disabled={pending}
              className={cn(buttonVariants({ variant: 'primary', size: 'sm' }))}
            >
              {pending ? <Loader2 className="me-1 size-3.5 animate-spin" aria-hidden="true" /> : null}
              Yayına al
            </button>
            <button
              type="button"
              onClick={() => runBulk('unpublish', 'yayından kaldırıldı')}
              disabled={pending}
              className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
            >
              Yayından kaldır
            </button>
            <button
              type="button"
              onClick={() => runBulk('delete', 'silindi')}
              disabled={pending}
              className={cn(
                buttonVariants({ variant: 'outline', size: 'sm' }),
                'border-rose-500/50 text-rose-700 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-950/30',
              )}
            >
              <Trash2 className="me-1 size-3.5" aria-hidden="true" />
              Sil
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
