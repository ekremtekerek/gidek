'use client';

import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
  /** Opsiyonel kısa açıklama, dropdown'da label altında çıkar. */
  hint?: string;
  /** Sol ikon */
  icon?: React.ReactNode;
}

interface SelectProps<T extends string = string> {
  value: T;
  onChange: (value: T) => void;
  options: ReadonlyArray<SelectOption<T>>;
  placeholder?: string;
  /** Tetikleyici aria-label */
  label?: string;
  /** Tetikleyici sınıfı override */
  className?: string;
  disabled?: boolean;
  /** Tetikleyici büyüklüğü — Input ile tutarlı */
  size?: 'sm' | 'md';
}

/**
 * Tasarıma uyumlu select. Native `<select>` yerine custom dropdown — tutarlı
 * stil, focus ring, ikon desteği, klavye navigasyonu (Enter/Space açar, ok
 * tuşları gezinir, Escape kapatır).
 */
export const Select = forwardRef<HTMLButtonElement, SelectProps>(function Select(
  {
    value,
    onChange,
    options,
    placeholder = 'Seç',
    label,
    className,
    disabled,
    size = 'md',
  },
  ref,
) {
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState<number>(
    Math.max(0, options.findIndex((o) => o.value === value)),
  );
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);
  const id = useId();

  const setRefs = useCallback(
    (node: HTMLButtonElement | null) => {
      triggerRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );

  const current = options.find((o) => o.value === value);

  // Dışarı tıklayınca kapat
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      const t = e.target as Node;
      if (!triggerRef.current?.contains(t) && !listRef.current?.contains(t)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  // Açılınca aktif item'a scroll
  useEffect(() => {
    if (!open || !listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(
      `[data-idx="${activeIdx}"]`,
    );
    el?.scrollIntoView({ block: 'nearest' });
  }, [open, activeIdx]);

  function handleKey(e: KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return;
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(options.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const next = options[activeIdx];
      if (next) {
        onChange(next.value);
        setOpen(false);
      }
    }
  }

  const heightCls = size === 'sm' ? 'h-9' : 'h-11';

  return (
    <div className="relative">
      <button
        ref={setRefs}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={label ? `${id}-label` : undefined}
        aria-label={label}
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={handleKey}
        className={cn(
          'border-border bg-background hover:border-foreground/30 focus-visible:ring-foreground/20 flex w-full items-center justify-between gap-2 rounded-md border px-3.5 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
          heightCls,
          className,
        )}
      >
        <span className="inline-flex min-w-0 items-center gap-2">
          {current?.icon}
          <span
            className={cn(
              'truncate',
              !current && 'text-muted-foreground',
            )}
          >
            {current?.label ?? placeholder}
          </span>
        </span>
        <ChevronDown
          className={cn(
            'text-muted-foreground size-4 shrink-0 transition-transform',
            open && 'rotate-180',
          )}
          aria-hidden="true"
        />
      </button>

      {open ? (
        <ul
          ref={listRef}
          role="listbox"
          aria-labelledby={label ? `${id}-label` : undefined}
          tabIndex={-1}
          className="border-border bg-background animate-in fade-in-0 zoom-in-95 absolute z-50 mt-1 max-h-64 w-full min-w-[200px] overflow-y-auto rounded-md border p-1 shadow-lg"
        >
          {options.map((opt, idx) => {
            const selected = opt.value === value;
            const active = idx === activeIdx;
            return (
              <li key={opt.value}>
                <button
                  type="button"
                  role="option"
                  data-idx={idx}
                  aria-selected={selected}
                  onMouseEnter={() => setActiveIdx(idx)}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                    triggerRef.current?.focus();
                  }}
                  className={cn(
                    'flex w-full items-center justify-between gap-2 rounded px-2.5 py-1.5 text-left text-sm transition-colors',
                    active && 'bg-muted',
                    selected && 'font-semibold',
                  )}
                >
                  <span className="inline-flex min-w-0 items-center gap-2">
                    {opt.icon}
                    <span className="truncate">
                      {opt.label}
                      {opt.hint ? (
                        <span className="text-muted-foreground ms-1 text-[11px] font-normal">
                          {opt.hint}
                        </span>
                      ) : null}
                    </span>
                  </span>
                  {selected ? (
                    <Check className="text-foreground size-4 shrink-0" aria-hidden="true" />
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}) as <T extends string = string>(
  props: SelectProps<T> & { ref?: React.Ref<HTMLButtonElement> },
) => React.ReactElement;
