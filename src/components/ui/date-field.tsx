'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { tr } from 'date-fns/locale';
import { format, parseISO, isValid } from 'date-fns';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import 'react-day-picker/dist/style.css';
import { cn } from '@/lib/utils/cn';

interface Props {
  name: string;
  defaultValue?: string;
  /** ISO date YYYY-MM-DD; if uncontrolled, leave undefined and use defaultValue. */
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  min?: string;
  max?: string;
  required?: boolean;
  disabled?: boolean;
  /** Optional input id for label association. */
  id?: string;
  className?: string;
}

/**
 * Shık tarih seçici — uncontrolled veya controlled. Görünür buton tarihi
 * Türkçe formatla gösterir; gizli input form'a YYYY-MM-DD verir.
 */
export function DateField({
  name,
  defaultValue,
  value: controlledValue,
  onChange,
  placeholder = 'Tarih seç',
  min,
  max,
  required,
  disabled,
  id,
  className,
}: Props) {
  const autoId = useId();
  const inputId = id ?? `date-${autoId}`;
  const isControlled = controlledValue !== undefined;

  const [internal, setInternal] = useState<string>(defaultValue ?? '');
  const value = isControlled ? (controlledValue as string) : internal;

  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

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

  function commit(next: string) {
    if (!isControlled) setInternal(next);
    onChange?.(next);
  }

  const parsed = value ? parseISO(value) : undefined;
  const selected = parsed && isValid(parsed) ? parsed : undefined;
  const label = selected ? format(selected, 'd MMMM yyyy', { locale: tr }) : '';

  const minDate = min ? parseISO(min) : undefined;
  const maxDate = max ? parseISO(max) : undefined;

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <input type="hidden" name={name} value={value} required={required} />
      <button
        id={inputId}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={cn(
          'border-border bg-background focus:border-foreground/50 focus:ring-foreground/10 inline-flex h-11 w-full items-center justify-between gap-2 rounded-md border px-3.5 text-sm transition-colors focus:ring-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60',
          !label && 'text-muted-foreground',
        )}
      >
        <span className="inline-flex items-center gap-2">
          <CalendarIcon className="text-muted-foreground size-4" aria-hidden="true" />
          {label || placeholder}
        </span>
        {label ? (
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
          role="dialog"
          className="border-border bg-background absolute left-0 z-50 mt-2 rounded-xl border p-3 shadow-xl"
        >
          <DayPicker
            mode="single"
            locale={tr}
            weekStartsOn={1}
            selected={selected}
            disabled={[minDate ? { before: minDate } : null, maxDate ? { after: maxDate } : null].filter(
              Boolean,
            ) as never[]}
            onSelect={(d) => {
              if (!d) {
                commit('');
              } else {
                commit(format(d, 'yyyy-MM-dd'));
                setOpen(false);
              }
            }}
            classNames={DAYPICKER_CLASSNAMES}
          />
        </div>
      ) : null}
    </div>
  );
}

/**
 * react-day-picker'ın varsayılan CSS'i import edildi; Tailwind sınıflarıyla
 * site paletine uyumlamak için kritik sınıfları ezdik.
 */
const DAYPICKER_CLASSNAMES: Partial<Record<string, string>> = {
  root: 'rdp text-sm',
  months: 'flex gap-4',
  month_caption: 'flex items-center justify-center px-2 py-1 font-semibold',
  caption_label: 'text-sm font-semibold',
  nav: 'flex items-center gap-1',
  button_previous:
    'inline-flex size-7 items-center justify-center rounded-md hover:bg-muted transition-colors',
  button_next:
    'inline-flex size-7 items-center justify-center rounded-md hover:bg-muted transition-colors',
  weekday: 'text-muted-foreground text-xs font-medium pb-1',
  day: 'p-0',
  day_button:
    'size-9 rounded-md text-sm hover:bg-muted aria-selected:bg-foreground aria-selected:text-background transition-colors',
  selected: 'bg-foreground text-background hover:bg-foreground/90',
  today: 'font-semibold underline underline-offset-4',
  outside: 'text-muted-foreground/50',
  disabled: 'opacity-40 cursor-not-allowed',
};
