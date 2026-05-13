'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Bell, CalendarDays, Gift, Heart, Search } from 'lucide-react';
import type { NotificationItem } from '@/lib/db/queries/notifications';
import { cn } from '@/lib/utils/cn';

interface Props {
  /** Anonim kullanıcılar için button gizlenir. */
  isAuthenticated: boolean;
}

const ICONS = {
  expiring_favorite: Heart,
  saved_search: Search,
  referral_claim: Gift,
  booking_upcoming: CalendarDays,
} as const;

/**
 * Header'da çan ikonu — auth'lu kullanıcı için. Açıldığında /api/notifications
 * çağırır, kullanıcının "şu an aksiyon" gerektiren satırlarını listeler.
 * V1'de okundu/okunmadı persistence yok (her açılışta tazelenir). V2'de
 * tablo + last_seen ile dot/unread state.
 */
export function NotificationBell({ isAuthenticated }: Props) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  // Açılınca fetch.
  useEffect(() => {
    if (!open || items !== null) return;
    setLoading(true);
    void fetch('/api/notifications', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : { notifications: [] }))
      .then((d: { notifications?: NotificationItem[] }) => setItems(d.notifications ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [open, items]);

  // Click-outside + Escape close.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!isAuthenticated) return null;

  const hasItems = (items?.length ?? 0) > 0;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          // Açılışta yeniden fetch — küçük cache invalidation.
          if (!open) setItems(null);
        }}
        aria-label={`Bildirimler${hasItems ? ` (${items!.length})` : ''}`}
        aria-expanded={open}
        className="text-muted-foreground hover:text-foreground hover:bg-muted relative inline-flex size-9 items-center justify-center rounded-full transition-colors"
      >
        <Bell className="size-5" aria-hidden="true" />
        {hasItems ? (
          <span
            aria-hidden="true"
            className="absolute right-2 top-2 inline-flex min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white"
          >
            {Math.min(items!.length, 9)}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="border-border bg-background absolute right-0 z-50 mt-2 w-[92vw] max-w-sm overflow-hidden rounded-2xl border shadow-xl">
          <header className="border-border flex items-center justify-between border-b px-4 py-3">
            <h2 className="text-sm font-semibold">Bildirimler</h2>
            <span className="text-muted-foreground text-xs">
              {items === null ? '' : `${items.length} adet`}
            </span>
          </header>

          {loading && items === null ? (
            <div className="p-6 text-center">
              <span className="text-muted-foreground text-sm">Yükleniyor…</span>
            </div>
          ) : !items || items.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="text-muted-foreground mx-auto mb-2 size-6" aria-hidden="true" />
              <p className="text-muted-foreground text-sm">
                Şu an yeni bir şey yok. Tekrar bakmak için açtığında yenilenir.
              </p>
            </div>
          ) : (
            <ul className="max-h-[60vh] divide-y divide-[var(--border)] overflow-y-auto">
              {items.map((it) => {
                const Icon = ICONS[it.type] ?? Bell;
                return (
                  <li key={it.id}>
                    <Link
                      href={it.href}
                      onClick={() => setOpen(false)}
                      className="hover:bg-muted/60 flex gap-3 p-3 transition-colors"
                    >
                      <span
                        className={cn(
                          'mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-full',
                          it.type === 'referral_claim' && 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
                          it.type === 'expiring_favorite' && 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
                          it.type === 'booking_upcoming' && 'bg-violet-500/15 text-violet-600 dark:text-violet-400',
                          it.type === 'saved_search' && 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
                        )}
                      >
                        <Icon className="size-4" aria-hidden="true" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-1 text-sm font-semibold">{it.title}</p>
                        <p className="text-muted-foreground line-clamp-2 text-xs">{it.body}</p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}

          <footer className="border-border border-t px-4 py-2 text-center">
            <Link
              href="/profil"
              onClick={() => setOpen(false)}
              className="text-muted-foreground hover:text-foreground text-xs font-medium"
            >
              Tüm bildirim tercihleri →
            </Link>
          </footer>
        </div>
      ) : null}
    </div>
  );
}
