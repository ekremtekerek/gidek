'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';

interface Props {
  src: string;
  alt: string;
  /** Thumbnail kapsayıcı className (aspect/size) */
  className?: string;
}

/**
 * Küçük thumbnail görseli — tıklayınca tam ekran lightbox açar. ESC veya
 * arkaplana tıklayarak kapanır. Tek görsel için; çoklu galeri istenirse
 * ileride next prop'u ile genişletilir.
 */
export function RoomImageLightbox({ src, alt, className }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
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
        aria-label={`${alt} — büyüt`}
        className={`group relative overflow-hidden rounded-lg ${className ?? ''}`}
      >
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(min-width: 640px) 160px, 100vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <span
          aria-hidden="true"
          className="bg-foreground/40 absolute inset-0 flex items-center justify-center text-xs font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100"
        >
          Büyüt
        </span>
      </button>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={alt}
          onClick={() => setOpen(false)}
          className="bg-foreground/80 fixed inset-0 z-[200] flex items-center justify-center p-4 backdrop-blur-sm"
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Kapat"
            className="bg-background/90 text-foreground hover:bg-background absolute right-4 top-4 inline-flex size-9 items-center justify-center rounded-full shadow-lg"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
          <div
            className="relative h-full max-h-[88vh] w-full max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={src}
              alt={alt}
              fill
              sizes="100vw"
              className="object-contain"
              priority
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
