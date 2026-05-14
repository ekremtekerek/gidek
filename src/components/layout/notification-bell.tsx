'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Bell,
  CalendarDays,
  CheckCheck,
  Gift,
  Heart,
  Search,
  Trash2,
  X,
} from 'lucide-react';
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

const STORAGE_KEY = 'gidek:notif-dismissed:v1';
/** Aynı id'leri sürekli localStorage'da büyütmeyelim — eski tarihliler düşsün. */
const MAX_DISMISSED_RETAIN = 200;

interface DismissedRecord {
  id: string;
  at: number;
}

function loadDismissed(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as DismissedRecord[];
    return new Set(parsed.map((r) => r.id));
  } catch {
    return new Set();
  }
}

function saveDismissed(set: Set<string>) {
  if (typeof window === 'undefined') return;
  try {
    const records: DismissedRecord[] = [...set]
      .map((id) => ({ id, at: Date.now() }))
      .slice(-MAX_DISMISSED_RETAIN);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {
    /* private mode / quota — sessizce geç */
  }
}

/**
 * Header'da çan ikonu — auth'lu kullanıcı için. /api/notifications'tan
 * üretilen bildirim listesi (computed on-the-fly) gösterilir.
 *
 * "Okundu" ve "sil" semantiği DB tarafında değil; bildirimler stateless
 * üretildiği için localStorage'da dismiss id seti tutuyoruz. Bir bildirimi
 * dismiss eden kullanıcı onu o cihazda bir daha görmez. Cihazlar arası
 * senkron yok (V1 kabul) — ileride dismissed_notifications tablosuna
 * geçirilebilir.
 */
export function NotificationBell({ isAuthenticated }: Props) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [hydrated, setHydrated] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  // localStorage'dan dismissed set'ini mount'ta yükle (SSR ile uyumsuzluk
  // olmasın diye effect içinde).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDismissed(loadDismissed());
    setHydrated(true);
  }, []);

  // Açılınca fetch.
  useEffect(() => {
    if (!open || items !== null) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    void fetch('/api/notifications', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : { notifications: [] }))
      .then((d: { notifications?: NotificationItem[] }) =>
        setItems(d.notifications ?? []),
      )
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

  const dismissOne = useCallback((id: string) => {
    setDismissed((prev) => {
      const next = new Set(prev);
      next.add(id);
      saveDismissed(next);
      return next;
    });
  }, []);

  const dismissAll = useCallback(() => {
    if (!items || items.length === 0) return;
    setDismissed((prev) => {
      const next = new Set(prev);
      for (const it of items) next.add(it.id);
      saveDismissed(next);
      return next;
    });
  }, [items]);

  const visibleItems = useMemo(() => {
    if (!items) return null;
    // SSR-client mismatch yaşamamak için hydrate öncesi filtrelemiyoruz
    if (!hydrated) return items;
    return items.filter((i) => !dismissed.has(i.id));
  }, [items, dismissed, hydrated]);

  if (!isAuthenticated) return null;

  const hasVisible = (visibleItems?.length ?? 0) > 0;
  const totalFetched = items?.length ?? 0;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          // Açılışta yeniden fetch — küçük cache invalidation.
          if (!open) setItems(null);
        }}
        aria-label={`Bildirimler${hasVisible ? ` (${visibleItems!.length})` : ''}`}
        aria-expanded={open}
        className="text-muted-foreground hover:text-foreground hover:bg-muted relative inline-flex size-9 items-center justify-center rounded-full transition-colors"
      >
        <Bell className="size-5" aria-hidden="true" />
        {hasVisible ? (
          <span
            aria-hidden="true"
            className="absolute right-2 top-2 inline-flex min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white"
          >
            {Math.min(visibleItems!.length, 9)}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="border-border bg-background absolute right-0 z-50 mt-2 w-[92vw] max-w-sm overflow-hidden rounded-2xl border shadow-xl">
          <header className="border-border flex items-center justify-between gap-2 border-b px-4 py-3">
            <h2 className="text-sm font-semibold">Bildirimler</h2>
            <span className="text-muted-foreground text-xs">
              {visibleItems === null ? '' : `${visibleItems.length} adet`}
            </span>
          </header>

          {/* Bulk eylemler — yalnız görünür bildirim varken */}
          {hasVisible ? (
            <div className="border-border flex items-center gap-1 border-b bg-muted/30 px-2 py-1.5">
              <button
                type="button"
                onClick={dismissAll}
                className="text-muted-foreground hover:bg-background hover:text-foreground inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium transition-colors"
              >
                <CheckCheck className="size-3.5" aria-hidden="true" />
                Tümünü okundu işaretle
              </button>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Tüm bildirimleri silmek istediğine emin misin?')) {
                    dismissAll();
                  }
                }}
                className="text-muted-foreground hover:bg-rose-500/10 hover:text-rose-600 ms-auto inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium transition-colors"
              >
                <Trash2 className="size-3.5" aria-hidden="true" />
                Tümünü sil
              </button>
            </div>
          ) : null}

          {loading && items === null ? (
            <div className="p-6 text-center">
              <span className="text-muted-foreground text-sm">Yükleniyor…</span>
            </div>
          ) : !visibleItems || visibleItems.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="text-muted-foreground mx-auto mb-2 size-6" aria-hidden="true" />
              <p className="text-muted-foreground text-sm">
                {totalFetched > 0
                  ? 'Tüm bildirimleri okudun. Yeni bir şey olunca burada görünür.'
                  : 'Şu an yeni bir şey yok. Tekrar bakmak için açtığında yenilenir.'}
              </p>
            </div>
          ) : (
            <ul className="max-h-[60vh] divide-y divide-[var(--border)] overflow-y-auto">
              {visibleItems.map((it) => {
                const Icon = ICONS[it.type] ?? Bell;
                return (
                  <li key={it.id} className="group/notif relative">
                    <Link
                      href={it.href}
                      onClick={() => {
                        // Tıklanan bildirim otomatik okundu sayılır + panel kapanır
                        dismissOne(it.id);
                        setOpen(false);
                      }}
                      className="hover:bg-muted/60 flex gap-3 p-3 pe-10 transition-colors"
                    >
                      <span
                        className={cn(
                          'mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-full',
                          it.type === 'referral_claim' &&
                            'bg-amber-500/15 text-amber-600 dark:text-amber-400',
                          it.type === 'expiring_favorite' &&
                            'bg-rose-500/15 text-rose-600 dark:text-rose-400',
                          it.type === 'booking_upcoming' &&
                            'bg-violet-500/15 text-violet-600 dark:text-violet-400',
                          it.type === 'saved_search' &&
                            'bg-blue-500/15 text-blue-600 dark:text-blue-400',
                        )}
                      >
                        <Icon className="size-4" aria-hidden="true" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-1 text-sm font-semibold">{it.title}</p>
                        <p className="text-muted-foreground line-clamp-2 text-xs">{it.body}</p>
                      </div>
                    </Link>

                    {/* Per-row dismiss — Link'in dışında, click propagate etmez */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        dismissOne(it.id);
                      }}
                      aria-label="Bu bildirimi sil"
                      title="Sil"
                      className="text-muted-foreground hover:bg-background hover:text-rose-600 absolute right-2 top-1/2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-md opacity-0 transition-opacity group-hover/notif:opacity-100 focus-visible:opacity-100 sm:opacity-100"
                    >
                      <X className="size-4" aria-hidden="true" />
                    </button>
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
