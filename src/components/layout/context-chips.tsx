'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { Check, MapPin, ChevronDown } from 'lucide-react';
import { SUPPORTED_CITIES, type SupportedCity } from '@/lib/utils/constants';
import { setCityAction } from '@/lib/security/user-context-actions';
import { cn } from '@/lib/utils/cn';

interface CityProps {
  value: SupportedCity;
}

/** Şehir seçim chip'i — popover ile şehir listesi, cookie'ye yazar. */
export function CityChip({ value }: CityProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement | null>(null);

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

  function pick(city: SupportedCity) {
    setOpen(false);
    if (city === value) return;
    startTransition(() => {
      void setCityAction(city);
    });
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={pending}
        className={cn(
          'border-border bg-background hover:border-foreground/40 inline-flex h-9 max-w-[180px] items-center gap-1.5 rounded-full border px-3 text-sm font-medium transition-colors disabled:opacity-60',
          open && 'border-foreground bg-foreground text-background',
        )}
      >
        <MapPin className="size-4" aria-hidden="true" />
        <span className="truncate">{value}</span>
        <ChevronDown className="size-3.5 shrink-0 opacity-70" aria-hidden="true" />
      </button>

      {open ? (
        <div
          role="dialog"
          className="border-border bg-background absolute right-0 z-50 mt-2 w-56 rounded-xl border p-2 shadow-xl"
        >
          <p className="text-muted-foreground mb-1 px-2 text-[11px] font-medium uppercase">
            Şehir
          </p>
          <ul role="listbox" className="flex max-h-72 flex-col overflow-y-auto">
            {SUPPORTED_CITIES.map((city) => {
              const selected = city === value;
              return (
                <li key={city}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => pick(city)}
                    className={cn(
                      'hover:bg-muted flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-sm',
                      selected && 'bg-muted font-medium',
                    )}
                  >
                    <span>{city}</span>
                    {selected ? <Check className="size-4" aria-hidden="true" /> : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
