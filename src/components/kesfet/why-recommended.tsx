'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, HelpCircle, Loader2, Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface Rationale {
  rationale: string;
  factors: string[];
}

interface Props {
  dealId: string;
  /** Kullanıcının son sorgusu (chat'ten gelir) — bağlam için. */
  userQuery?: string;
  className?: string;
}

/**
 * Deal kartının sağ-üst köşesinde "neden bu öneri?" rozeti. Beyaz ring +
 * mor gradient + pulse animasyonu — dikkat çeker. Hover'da tooltip
 * "Neden bu öneri?", tıklayınca popover (createPortal ile body'ye basılır
 * → kartın overflow:hidden'ından etkilenmez).
 */
export function WhyRecommended({ dealId, userQuery, className }: Props) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [data, setData] = useState<Rationale | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hovering, setHovering] = useState(false);
  const [fetchTrigger, setFetchTrigger] = useState(0);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);

  // Popover pozisyonunu butona göre hesapla
  useEffect(() => {
    if (!open || !buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const popWidth = 320;
    const margin = 12;
    let left = rect.right - popWidth + window.scrollX;
    left = Math.max(margin + window.scrollX, left);
    const maxLeft = window.scrollX + document.documentElement.clientWidth - popWidth - margin;
    left = Math.min(maxLeft, left);
    const top = rect.bottom + 8 + window.scrollY;
    setCoords({ top, left });
  }, [open]);

  // Fetch — open true iken ve fetchTrigger değişince
  useEffect(() => {
    if (!open) return;
    if (data && fetchTrigger === 0) return; // ilk açılış ve veri zaten var → tekrar fetch yok
    let cancelled = false;
    // Effect içi setState — fetch öncesi durumu sıfırlamak için zorunlu; lint
    // kuralı bunu uyarıyor ama burada gerekli (kullanıcı eylemine bağlı side-effect).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPending(true);
    setError(null);
    fetch('/api/ai/why-recommended', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dealId, userQuery }),
    })
      .then(async (res) => {
        const ct = res.headers.get('content-type') ?? '';
        if (!ct.includes('application/json')) {
          throw new Error(`Sunucu hatası (${res.status})`);
        }
        const json = await res.json();
        if (!res.ok || !json.ok) {
          throw new Error(json.error ?? 'Açıklama alınamadı.');
        }
        if (!cancelled) setData(json.rationale as Rationale);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : 'Beklenmeyen hata.';
        setError(msg);
      })
      .finally(() => {
        if (!cancelled) setPending(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, fetchTrigger, dealId, userQuery]);

  // Dışına tıklama / Esc → kapat
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    function onClick(e: MouseEvent) {
      const target = e.target as Node;
      if (
        popoverRef.current &&
        !popoverRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [open]);

  // Scroll/resize'da popover'ı kapat
  useEffect(() => {
    if (!open) return;
    function onScrollOrResize() {
      setOpen(false);
    }
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [open]);

  return (
    <>
      <div className={cn('relative inline-flex', className)}>
        <button
          ref={buttonRef}
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOpen((v) => !v);
            setHovering(false);
          }}
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
          aria-label="Neden bu öneri?"
          aria-expanded={open}
          className={cn(
            'group/why relative inline-flex size-9 items-center justify-center rounded-full shadow-lg ring-2 ring-white/90 transition-all duration-200',
            'bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white',
            'hover:scale-110 hover:shadow-xl hover:shadow-violet-500/40',
            'focus-visible:ring-4 focus-visible:ring-violet-300 focus-visible:outline-none',
            open ? 'scale-110 ring-4 ring-violet-200' : null,
          )}
        >
          {/* Pulse halkası — kapalıyken ve hover olmayan iken */}
          {!open && !hovering ? (
            <span
              aria-hidden="true"
              className="absolute inset-0 animate-ping rounded-full bg-violet-400/60 opacity-75"
            />
          ) : null}
          <HelpCircle className="relative size-5" aria-hidden="true" />
        </button>

        {/* Hover tooltip — popover kapalı iken */}
        {hovering && !open ? (
          <span
            role="tooltip"
            className="bg-foreground text-background pointer-events-none absolute right-0 top-full z-50 mt-2 whitespace-nowrap rounded-md px-2.5 py-1 text-[11px] font-medium shadow-lg"
          >
            Neden bu öneri?
            <span
              aria-hidden="true"
              className="bg-foreground absolute -top-1 right-3 size-2 rotate-45"
            />
          </span>
        ) : null}
      </div>

      {/* Popover — portal ile body'ye basılır, parent overflow tarafından kesilmez */}
      {open && typeof window !== 'undefined' && coords
        ? createPortal(
            <div
              ref={popoverRef}
              role="dialog"
              aria-label="AI önerisi açıklaması"
              style={{ top: coords.top, left: coords.left, width: 320 }}
              className="border-border bg-background absolute z-[100] overflow-hidden rounded-xl border shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <header className="border-border flex items-center gap-2 border-b bg-gradient-to-r from-violet-500/10 via-fuchsia-500/10 to-violet-500/10 px-3 py-2.5">
                <Sparkles className="size-4 text-violet-600 dark:text-violet-300" aria-hidden="true" />
                <p className="text-sm font-semibold tracking-tight">Neden bu öneri?</p>
                <button
                  type="button"
                  aria-label="Kapat"
                  onClick={() => setOpen(false)}
                  className="text-muted-foreground hover:text-foreground ms-auto inline-flex size-6 items-center justify-center rounded-md"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              </header>

              <div className="p-4">
                {pending ? (
                  <div className="text-muted-foreground flex items-center gap-2 text-sm">
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    AI düşünüyor…
                  </div>
                ) : error ? (
                  <div className="flex flex-col gap-2">
                    <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>
                    <button
                      type="button"
                      onClick={() => setFetchTrigger((t) => t + 1)}
                      className="self-start text-xs font-medium text-violet-600 underline-offset-2 hover:underline dark:text-violet-300"
                    >
                      Tekrar dene
                    </button>
                  </div>
                ) : data ? (
                  <>
                    <p className="text-foreground/90 text-sm leading-relaxed">
                      {data.rationale}
                    </p>
                    {data.factors.length > 0 ? (
                      <ul className="mt-3 flex flex-wrap gap-1.5">
                        {data.factors.map((f) => (
                          <li
                            key={f}
                            className="inline-flex items-center gap-1 rounded-full bg-violet-500/10 px-2 py-0.5 text-[11px] font-medium text-violet-700 dark:text-violet-300"
                          >
                            <CheckCircle2 className="size-3" aria-hidden="true" />
                            {f}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </>
                ) : null}
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
