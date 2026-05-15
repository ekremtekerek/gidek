'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { createPortal } from 'react-dom';
import { CalendarRange, MapPin, Search, Users, X } from 'lucide-react';
import { TravelTopSearchBar } from '@/components/travel/travel-top-search-bar';

interface Props {
  locations: string[];
}

/**
 * Tatil dünyasında header'da gözüken kompakt arama widget'ı. Booking.com
 * benzeri tek trigger button (📍 Nereye? · 📅 Tarih · 👥 Kişi) — tıklanınca
 * full-form modal'a genişler. Mevcut TravelTopSearchBar reuse edilir, böylece
 * tek tutarlılık.
 */
export function TravelHeaderSearch({ locations }: Props) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Route/searchParams değişince modal'ı kapat — form submit sonrası
  // router.push olunca otomatik kapanma sağlanır.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpen(false);
  }, [pathname, searchParams]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Tatil ara"
        className="border-border bg-background hover:border-foreground/40 hover:shadow-md group flex h-11 w-full max-w-2xl items-center gap-2 rounded-full border px-2 pl-4 text-sm font-medium transition-all"
      >
        <Search className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />

        <div className="flex flex-1 items-center gap-2 overflow-hidden">
          <Chip icon={<MapPin className="size-3.5" aria-hidden="true" />} label="Nereye gidelim?" />
          <Divider />
          <Chip icon={<CalendarRange className="size-3.5" aria-hidden="true" />} label="Tarih" />
          <Divider />
          <Chip icon={<Users className="size-3.5" aria-hidden="true" />} label="Kişi" />
        </div>

        <span className="from-sky-600 to-cyan-500 group-hover:from-sky-700 group-hover:to-cyan-600 ml-auto inline-flex h-9 items-center gap-1.5 rounded-full bg-gradient-to-r px-4 text-xs font-bold text-white shadow transition-colors">
          <Search className="size-3.5" aria-hidden="true" />
          Ara
        </span>
      </button>

      {mounted && open
        ? createPortal(
            <div
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-[200] flex items-start justify-center bg-black/60 p-4 pt-20 backdrop-blur-sm sm:pt-24"
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="border-border bg-background w-full max-w-4xl rounded-2xl border p-4 shadow-2xl sm:p-5"
              >
                <header className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sky-700 dark:text-sky-300 text-[10px] font-bold uppercase tracking-widest">
                      Tatil ara
                    </p>
                    <h2 className="text-base font-bold tracking-tight">
                      Nereye gidelim?
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="hover:bg-muted inline-flex size-9 items-center justify-center rounded-full transition-colors"
                    aria-label="Kapat"
                  >
                    <X className="size-4" aria-hidden="true" />
                  </button>
                </header>

                <TravelTopSearchBar locations={locations} />
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

function Chip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="text-muted-foreground inline-flex items-center gap-1 truncate text-xs">
      {icon}
      <span className="truncate">{label}</span>
    </span>
  );
}

function Divider() {
  return <span className="text-muted-foreground/40 select-none">·</span>;
}
