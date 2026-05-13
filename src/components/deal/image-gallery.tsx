'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Maximize2, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { BLUR_DATA_URL } from '@/lib/utils/blur';
import { cn } from '@/lib/utils/cn';

interface Props {
  title: string;
  cover: string;
  images?: string[] | null;
  discount?: number;
  isFeatured?: boolean;
}

/**
 * E-ticaret tarzı detay galerisi: büyük ana foto + altta thumbnail strip.
 * Klavye okları ile geçiş, küçük thumbnail click ile değişim, ufak swipe
 * hover scale efekti. Tek foto varsa thumbnail strip render olmaz.
 */
export function ImageGallery({ title, cover, images, discount = 0, isFeatured }: Props) {
  const all = [cover, ...(images ?? []).filter((i) => i && i !== cover)];
  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && lightbox) setLightbox(false);
      if (all.length < 2) return;
      if (e.key === 'ArrowRight') setIndex((i) => Math.min(i + 1, all.length - 1));
      if (e.key === 'ArrowLeft') setIndex((i) => Math.max(i - 1, 0));
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [all.length, lightbox]);

  // Lightbox açıkken body scroll lock.
  useEffect(() => {
    if (!lightbox) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [lightbox]);

  const active = all[index] ?? cover;
  const hasMultiple = all.length > 1;
  const showDiscount = discount > 0;

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => setLightbox(true)}
        aria-label="Görseli büyüt"
        className="border-border bg-muted group relative aspect-[4/3] w-full overflow-hidden rounded-xl border"
      >
        <Image
          key={active}
          src={active}
          alt={`${title} — ${index + 1}/${all.length}`}
          fill
          sizes="(min-width: 1024px) 60vw, 100vw"
          className="object-cover transition-opacity duration-300"
          priority={index === 0}
          placeholder="blur"
          blurDataURL={BLUR_DATA_URL}
        />
        <span className="bg-background/85 text-foreground absolute right-3 top-3 inline-flex size-9 items-center justify-center rounded-full opacity-0 backdrop-blur transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
          <Maximize2 className="size-4" aria-hidden="true" />
        </span>

        {showDiscount ? (
          <div className="absolute top-4 left-4">
            <Badge variant="discount" size="lg">
              %{discount} indirim
            </Badge>
          </div>
        ) : null}
        {isFeatured ? (
          <div className="absolute top-4 right-4">
            <Badge variant="accent" size="md">
              Öne çıkan
            </Badge>
          </div>
        ) : null}

        {hasMultiple ? (
          <>
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                setIndex((i) => Math.max(0, i - 1));
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.stopPropagation();
                  e.preventDefault();
                  setIndex((i) => Math.max(0, i - 1));
                }
              }}
              aria-label="Önceki görsel"
              aria-disabled={index === 0}
              className={cn(
                'bg-background/85 hover:bg-background absolute top-1/2 left-3 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-full shadow-md backdrop-blur transition-all',
                index === 0 ? 'pointer-events-none opacity-40' : '',
              )}
            >
              <ChevronLeft className="size-5" aria-hidden="true" />
            </span>
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                setIndex((i) => Math.min(all.length - 1, i + 1));
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.stopPropagation();
                  e.preventDefault();
                  setIndex((i) => Math.min(all.length - 1, i + 1));
                }
              }}
              aria-label="Sonraki görsel"
              aria-disabled={index === all.length - 1}
              className={cn(
                'bg-background/85 hover:bg-background absolute top-1/2 right-3 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-full shadow-md backdrop-blur transition-all',
                index === all.length - 1 ? 'pointer-events-none opacity-40' : '',
              )}
            >
              <ChevronRight className="size-5" aria-hidden="true" />
            </span>

            <div
              aria-hidden="true"
              className="bg-background/85 text-foreground absolute right-4 bottom-4 rounded-full px-2.5 py-1 text-xs font-medium backdrop-blur"
            >
              {index + 1} / {all.length}
            </div>
          </>
        ) : null}
      </button>

      {hasMultiple ? (
        <div className="gidek-scroll-x flex gap-2 overflow-x-auto pb-1">
          {all.map((src, i) => (
            <button
              key={`${src}-${i}`}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Görsel ${i + 1}`}
              aria-current={i === index}
              className={cn(
                'group relative aspect-[4/3] w-24 shrink-0 overflow-hidden rounded-md border transition-all sm:w-28',
                i === index
                  ? 'border-foreground ring-foreground/40 ring-2'
                  : 'border-border opacity-70 hover:opacity-100',
              )}
            >
              <Image
                src={src}
                alt=""
                fill
                sizes="112px"
                className="object-cover transition-transform group-hover:scale-105"
                placeholder="blur"
                blurDataURL={BLUR_DATA_URL}
              />
            </button>
          ))}
        </div>
      ) : null}

      {lightbox ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${title} — büyük görsel`}
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/95 p-3 sm:p-8"
          onClick={() => setLightbox(false)}
        >
          <button
            type="button"
            onClick={() => setLightbox(false)}
            aria-label="Kapat"
            className="bg-background/90 text-foreground absolute top-3 right-3 inline-flex size-10 items-center justify-center rounded-full backdrop-blur"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
          <div
            className="relative h-full max-h-[92vh] w-full max-w-6xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              key={`lb-${active}`}
              src={active}
              alt={`${title} — ${index + 1}/${all.length}`}
              fill
              sizes="100vw"
              className="object-contain"
              priority
            />
            {hasMultiple ? (
              <>
                <button
                  type="button"
                  onClick={() => setIndex((i) => Math.max(0, i - 1))}
                  disabled={index === 0}
                  aria-label="Önceki"
                  className="bg-background/90 hover:bg-background absolute top-1/2 left-3 inline-flex size-12 -translate-y-1/2 items-center justify-center rounded-full shadow-md backdrop-blur disabled:opacity-40"
                >
                  <ChevronLeft className="size-6" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => setIndex((i) => Math.min(all.length - 1, i + 1))}
                  disabled={index === all.length - 1}
                  aria-label="Sonraki"
                  className="bg-background/90 hover:bg-background absolute top-1/2 right-3 inline-flex size-12 -translate-y-1/2 items-center justify-center rounded-full shadow-md backdrop-blur disabled:opacity-40"
                >
                  <ChevronRight className="size-6" aria-hidden="true" />
                </button>
                <span className="bg-background/85 text-foreground absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs font-medium backdrop-blur">
                  {index + 1} / {all.length}
                </span>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
