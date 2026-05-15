'use client';

import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Loader2, MapPin, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface Props {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  /** Tetikleyici aria-label */
  label?: string;
  className?: string;
  /** Sol ikon override (default MapPin) */
  icon?: React.ReactNode;
  /** Boş değere temizleme butonu göster */
  clearable?: boolean;
  size?: 'sm' | 'md';
  disabled?: boolean;
  /**
   * Asenkron arama — kullanıcı yazınca debounced çağrılır. Dönen sonuçlar
   * statik `options` ile birleştirilip dropdown'a yansır. Boş query'de
   * sadece options gösterilir.
   */
  asyncSearch?: (query: string, signal: AbortSignal) => Promise<string[]>;
  /** Debounce ms (asyncSearch için) — default 280 */
  asyncDebounceMs?: number;
}

/**
 * Tasarıma uyumlu autocomplete combobox. Native <input list> yerine custom
 * dropdown: filtreli liste, klavye nav, tıklayınca seçer, dışa tıklayınca
 * kapanır. Serbest metin yazmaya izin verir (options'da olmayan değer de
 * kabul edilir).
 */
export const Combobox = forwardRef<HTMLInputElement, Props>(function Combobox(
  {
    value,
    onChange,
    options,
    placeholder = 'Seç ya da yaz',
    label,
    className,
    icon,
    clearable = true,
    size = 'md',
    disabled,
    asyncSearch,
    asyncDebounceMs = 280,
  },
  ref,
) {
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [asyncResults, setAsyncResults] = useState<string[]>([]);
  const [asyncLoading, setAsyncLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [rect, setRect] = useState<{ top: number; left: number; width: number; bottom: number } | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const id = useId();

  useEffect(() => setMounted(true), []);

  // Açıkken root pozisyonunu takip et — scroll/resize'da güncelle
  useLayoutEffect(() => {
    if (!open) return;
    function updateRect() {
      const el = rootRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, bottom: r.bottom });
    }
    updateRect();
    window.addEventListener('scroll', updateRect, true);
    window.addEventListener('resize', updateRect);
    return () => {
      window.removeEventListener('scroll', updateRect, true);
      window.removeEventListener('resize', updateRect);
    };
  }, [open]);

  const setRefs = useCallback(
    (node: HTMLInputElement | null) => {
      inputRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );

  // Async fetch — debounced; her input değişiminde önceki abort edilir.
  useEffect(() => {
    if (!asyncSearch) return;
    const q = value.trim();
    if (q.length < 2) {
      setAsyncResults([]);
      setAsyncLoading(false);
      return;
    }
    setAsyncLoading(true);
    const controller = new AbortController();
    const id = window.setTimeout(async () => {
      try {
        const results = await asyncSearch(q, controller.signal);
        if (!controller.signal.aborted) {
          setAsyncResults(results);
          setAsyncLoading(false);
        }
      } catch {
        if (!controller.signal.aborted) setAsyncLoading(false);
      }
    }, asyncDebounceMs);
    return () => {
      controller.abort();
      window.clearTimeout(id);
    };
  }, [value, asyncSearch, asyncDebounceMs]);

  // Birleşik liste: önce async (varsa) + sonra static, duplicate'leri kaldır.
  const normalizedQuery = value.toLocaleLowerCase('tr');
  const staticFiltered =
    normalizedQuery.length === 0
      ? options
      : options.filter((o) => o.toLocaleLowerCase('tr').includes(normalizedQuery));
  const filtered = asyncSearch
    ? [
        ...asyncResults,
        ...staticFiltered.filter((o) => !asyncResults.includes(o)),
      ]
    : staticFiltered;

  // Dışarı tıklama
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  // Aktif item'a scroll
  useEffect(() => {
    if (!open || !listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(`[data-idx="${activeIdx}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [open, activeIdx]);

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if (disabled) return;
    if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      e.preventDefault();
      setOpen(true);
      return;
    }
    if (e.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(filtered.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter' && open && filtered[activeIdx]) {
      e.preventDefault();
      onChange(filtered[activeIdx]);
      setOpen(false);
    }
  }

  const heightCls = size === 'sm' ? 'h-9' : 'h-11';

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <div
        className={cn(
          'border-border bg-background hover:border-foreground/30 focus-within:border-foreground/50 focus-within:ring-foreground/10 flex w-full items-center gap-2 rounded-md border px-3 transition-colors focus-within:ring-2',
          heightCls,
          disabled && 'cursor-not-allowed opacity-50',
        )}
      >
        <span className="text-muted-foreground shrink-0">
          {icon ?? <MapPin className="size-4" aria-hidden="true" />}
        </span>
        <input
          ref={setRefs}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={`${id}-list`}
          aria-autocomplete="list"
          aria-label={label}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
            setActiveIdx(0);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKey}
          disabled={disabled}
          placeholder={placeholder}
          className="placeholder:text-muted-foreground min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none sm:text-base"
        />
        {clearable && value ? (
          <button
            type="button"
            aria-label="Temizle"
            onClick={() => {
              onChange('');
              inputRef.current?.focus();
            }}
            className="text-muted-foreground hover:text-foreground inline-flex size-6 shrink-0 items-center justify-center rounded-full"
          >
            <X className="size-3.5" aria-hidden="true" />
          </button>
        ) : null}
        <button
          type="button"
          tabIndex={-1}
          aria-label={open ? 'Listeyi kapat' : 'Listeyi aç'}
          onClick={() => {
            setOpen((v) => !v);
            inputRef.current?.focus();
          }}
          className="text-muted-foreground shrink-0"
        >
          {asyncLoading ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <ChevronDown
              className={cn('size-4 transition-transform', open && 'rotate-180')}
              aria-hidden="true"
            />
          )}
        </button>
      </div>

      {/* Portal dropdown — overflow:hidden parent'lardan etkilenmez */}
      {open && mounted && rect && filtered.length > 0
        ? createPortal(
            <ul
              ref={listRef}
              id={`${id}-list`}
              role="listbox"
              style={{
                position: 'fixed',
                top: rect.bottom + 4,
                left: rect.left,
                width: rect.width,
              }}
              className="border-border bg-background animate-in fade-in-0 zoom-in-95 z-[120] max-h-64 overflow-y-auto rounded-md border p-1 shadow-lg"
            >
              {filtered.map((opt, idx) => (
                <li key={opt}>
                  <button
                    type="button"
                    role="option"
                    data-idx={idx}
                    aria-selected={value === opt}
                    onMouseEnter={() => setActiveIdx(idx)}
                    onClick={() => {
                      onChange(opt);
                      setOpen(false);
                    }}
                    className={cn(
                      'flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-left text-sm transition-colors',
                      idx === activeIdx && 'bg-muted',
                      value === opt && 'font-semibold',
                    )}
                  >
                    <MapPin className="text-muted-foreground size-3.5 shrink-0" aria-hidden="true" />
                    <span className="truncate">{opt}</span>
                  </button>
                </li>
              ))}
            </ul>,
            document.body,
          )
        : null}

      {open && mounted && rect && filtered.length === 0 && value
        ? createPortal(
            <div
              style={{
                position: 'fixed',
                top: rect.bottom + 4,
                left: rect.left,
                width: rect.width,
              }}
              className="border-border bg-background z-[120] rounded-md border p-3 text-center text-xs shadow-lg"
            >
              <span className="text-muted-foreground">
                &ldquo;{value}&rdquo; için sonuç yok — serbest metin olarak gönderilecek.
              </span>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
});
