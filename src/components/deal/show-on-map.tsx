'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { MapPin, Navigation, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { googleMapsDirectionsUrl } from '@/lib/utils/maps';

interface Props {
  lat: number;
  lng: number;
  title: string;
  address?: string | null;
  className?: string;
}

// Mapbox bundle ~200KB — sadece modal açıldığında yükle.
const InlineMap = dynamic(() => import('./inline-map').then((m) => m.InlineMap), {
  ssr: false,
  loading: () => (
    <div className="bg-muted text-muted-foreground flex h-full items-center justify-center text-sm">
      Harita yükleniyor…
    </div>
  ),
});

/** Buton + modal Mapbox — merchant konumunu öne çıkarır, yol tarifini dış uygulamaya bırakır. */
export function ShowOnMap({ lat, lng, title, address, className }: Props) {
  const [open, setOpen] = useState(false);
  const directionsUrl = googleMapsDirectionsUrl(lat, lng);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <div className={cn('flex flex-wrap items-center gap-2', className)}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="border-border bg-background hover:border-foreground/40 hover:bg-muted inline-flex h-10 items-center gap-2 rounded-md border px-4 text-sm font-medium transition-colors"
        >
          <MapPin className="size-4" aria-hidden="true" />
          Haritada göster
        </button>
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${title} için yol tarifi al`}
          className="border-border bg-background hover:border-foreground/40 hover:bg-muted inline-flex h-10 items-center gap-2 rounded-md border px-4 text-sm font-medium transition-colors"
        >
          <Navigation className="size-4" aria-hidden="true" />
          Yol tarifi
        </a>
      </div>

      {open && typeof window !== 'undefined'
        ? createPortal(
            <div
              role="dialog"
              aria-modal="true"
              aria-label={`${title} — harita`}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8"
            >
              <button
                type="button"
                aria-label="Kapat"
                tabIndex={-1}
                onClick={() => setOpen(false)}
                className="absolute inset-0 bg-black/55 backdrop-blur-sm"
              />
              <div className="border-border bg-background relative flex h-[min(80svh,640px)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border shadow-2xl">
                <header className="border-border flex items-center justify-between gap-3 border-b px-5 py-4">
                  <div className="min-w-0">
                    <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
                    {address ? (
                      <p className="text-muted-foreground inline-flex items-center gap-1 text-xs">
                        <MapPin className="size-3" aria-hidden="true" />
                        {address}
                      </p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    aria-label="Kapat"
                    onClick={() => setOpen(false)}
                    className="hover:bg-muted inline-flex size-9 shrink-0 items-center justify-center rounded-md transition-colors"
                  >
                    <X className="size-5" aria-hidden="true" />
                  </button>
                </header>

                <div className="relative flex-1">
                  <InlineMap lat={lat} lng={lng} title={title} />
                </div>

                <footer className="border-border bg-background border-t px-5 py-3">
                  <a
                    href={directionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-foreground text-background hover:bg-foreground/90 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition-colors sm:w-auto"
                  >
                    <Navigation className="size-4" aria-hidden="true" />
                    Yol tarifi al
                  </a>
                  <p className="text-muted-foreground mt-1.5 text-[11px]">
                    Google Maps'te açılır — mobilde harita uygulamana yönlenir.
                  </p>
                </footer>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
