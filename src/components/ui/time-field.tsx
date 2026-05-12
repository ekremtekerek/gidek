'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Clock, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface Props {
  name: string;
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  id?: string;
  className?: string;
  /** Start hour (default 6). */
  startHour?: number;
  /** End hour exclusive (default 24). */
  endHour?: number;
  /** Step minutes (default 15). */
  stepMinutes?: number;
}

/**
 * Şık saat seçici — 15dk slot'larla popover liste, klavye okları ile dolaşım.
 * Form'a HH:mm gönderir.
 */
export function TimeField({
  name,
  defaultValue,
  value: controlledValue,
  onChange,
  placeholder = 'Saat seç',
  required,
  disabled,
  id,
  className,
  startHour = 6,
  endHour = 24,
  stepMinutes = 15,
}: Props) {
  const autoId = useId();
  const inputId = id ?? `time-${autoId}`;
  const isControlled = controlledValue !== undefined;

  const [internal, setInternal] = useState<string>(defaultValue ?? '');
  const value = isControlled ? (controlledValue as string) : internal;

  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
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

  // Scroll selected into view when popup opens.
  useEffect(() => {
    if (!open || !value || !listRef.current) return;
    const node = listRef.current.querySelector<HTMLElement>(`[data-time="${value}"]`);
    if (node) node.scrollIntoView({ block: 'center' });
  }, [open, value]);

  function commit(next: string) {
    if (!isControlled) setInternal(next);
    onChange?.(next);
  }

  const slots: string[] = [];
  for (let h = startHour; h < endHour; h++) {
    for (let m = 0; m < 60; m += stepMinutes) {
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <input type="hidden" name={name} value={value} required={required} />
      <button
        id={inputId}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          'border-border bg-background focus:border-foreground/50 focus:ring-foreground/10 inline-flex h-11 w-full items-center justify-between gap-2 rounded-md border px-3.5 text-sm transition-colors focus:ring-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60',
          !value && 'text-muted-foreground',
        )}
      >
        <span className="inline-flex items-center gap-2">
          <Clock className="text-muted-foreground size-4" aria-hidden="true" />
          {value || placeholder}
        </span>
        {value ? (
          <span
            role="button"
            tabIndex={0}
            aria-label="Temizle"
            onClick={(e) => {
              e.stopPropagation();
              commit('');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                commit('');
              }
            }}
            className="text-muted-foreground hover:text-foreground -mr-1 inline-flex size-6 items-center justify-center rounded-full"
          >
            <X className="size-3.5" aria-hidden="true" />
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          role="listbox"
          ref={listRef}
          className="border-border bg-background absolute left-0 z-50 mt-2 max-h-64 w-full min-w-[160px] overflow-y-auto rounded-xl border p-1 shadow-xl"
        >
          {slots.map((slot) => {
            const active = value === slot;
            return (
              <button
                key={slot}
                type="button"
                role="option"
                aria-selected={active}
                data-time={slot}
                onClick={() => {
                  commit(slot);
                  setOpen(false);
                }}
                className={cn(
                  'flex w-full items-center justify-center rounded-md px-3 py-1.5 text-sm transition-colors',
                  active ? 'bg-foreground text-background' : 'hover:bg-muted',
                )}
              >
                {slot}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
