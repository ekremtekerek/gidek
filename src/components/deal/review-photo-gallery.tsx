'use client';

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { BLUR_DATA_URL } from '@/lib/utils/blur';

interface Photo {
  id: string;
  url: string;
}

interface Props {
  photos: Photo[];
}

/**
 * Yorum fotoğrafları — sayfada 4'lü grid thumbnail; tıklayınca tam ekran
 * lightbox modal'ı açılır. Sol/sağ ok tuşları + buton ile dolaşılabilir,
 * ESC veya backdrop click ile kapanır. Modal `createPortal` ile body'ye
 * basılır → kart overflow'undan etkilenmez.
 */
export function ReviewPhotoGallery({ photos }: Props) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const close = useCallback(() => setOpenIdx(null), []);
  const next = useCallback(() => {
    setOpenIdx((cur) => {
      if (cur === null) return cur;
      return (cur + 1) % photos.length;
    });
  }, [photos.length]);
  const prev = useCallback(() => {
    setOpenIdx((cur) => {
      if (cur === null) return cur;
      return (cur - 1 + photos.length) % photos.length;
    });
  }, [photos.length]);

  useEffect(() => {
    if (openIdx === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
    }
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [openIdx, close, next, prev]);

  if (photos.length === 0) return null;

  const current = openIdx !== null ? photos[openIdx] : null;
  const showNav = photos.length > 1;

  return (
    <>
      <ul className="grid grid-cols-4 gap-1.5">
        {photos.map((p, i) => (
          <li key={p.id}>
            <button
              type="button"
              onClick={() => setOpenIdx(i)}
              aria-label={`Fotoğraf ${i + 1}/${photos.length} — büyüt`}
              className="bg-muted group block aspect-square w-full overflow-hidden rounded-md focus-visible:ring-2 focus-visible:ring-foreground/30 focus-visible:outline-none"
            >
              <Image
                src={p.url}
                alt=""
                width={120}
                height={120}
                className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                placeholder="blur"
                blurDataURL={BLUR_DATA_URL}
              />
            </button>
          </li>
        ))}
      </ul>

      {current && typeof window !== 'undefined'
        ? createPortal(
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Yorum fotoğrafı"
              className="fixed inset-0 z-[200] flex items-center justify-center"
            >
              {/* Backdrop */}
              <button
                type="button"
                aria-label="Kapat"
                tabIndex={-1}
                onClick={close}
                className="absolute inset-0 cursor-default bg-black/85 backdrop-blur-sm"
              />

              {/* İçerik — backdrop click'i durdurmak için stopPropagation */}
              <div
                onClick={(e) => e.stopPropagation()}
                className="relative flex h-full max-h-[92svh] w-full max-w-5xl items-center justify-center px-4"
              >
                {/* Kapat */}
                <button
                  type="button"
                  onClick={close}
                  aria-label="Kapat"
                  className="absolute right-3 top-3 z-10 inline-flex size-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition-colors hover:bg-white/25 focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none sm:right-4 sm:top-4"
                >
                  <X className="size-5" aria-hidden="true" />
                </button>

                {/* Sol/sağ */}
                {showNav ? (
                  <>
                    <button
                      type="button"
                      onClick={prev}
                      aria-label="Önceki"
                      className="absolute left-1 top-1/2 z-10 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition-colors hover:bg-white/25 focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none sm:left-3"
                    >
                      <ChevronLeft className="size-6" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={next}
                      aria-label="Sonraki"
                      className="absolute right-1 top-1/2 z-10 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition-colors hover:bg-white/25 focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none sm:right-3"
                    >
                      <ChevronRight className="size-6" aria-hidden="true" />
                    </button>
                  </>
                ) : null}

                {/* Görsel */}
                <div className="relative h-full max-h-[88svh] w-full">
                  <Image
                    src={current.url}
                    alt="Yorum fotoğrafı"
                    fill
                    sizes="100vw"
                    className="object-contain"
                    priority
                    placeholder="blur"
                    blurDataURL={BLUR_DATA_URL}
                  />
                </div>

                {/* Counter */}
                {showNav ? (
                  <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur">
                    {openIdx! + 1} / {photos.length}
                  </span>
                ) : null}
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
