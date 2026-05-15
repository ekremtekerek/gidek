'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { BLUR_DATA_URL } from '@/lib/utils/blur';
import { cn } from '@/lib/utils/cn';

interface Props {
  images: string[];
  alt: string;
  priority?: boolean;
  /** Tıklanınca yapılacak — kart Link'i içindeyken navigasyon olur, dışındaysa açılan lightbox vb. */
  onImageClick?: (index: number) => void;
}

/**
 * Tatil kartı için mini foto carousel. Tek foto ise plain Image.
 * 2+ foto varsa sol/sağ arrow + dot indicator.
 * Hover'da arrow'lar görünür (mobil'de her zaman görünür).
 */
export function TravelCardGallery({ images, alt, priority = false, onImageClick }: Props) {
  const list = images.filter((x): x is string => Boolean(x));
  const [idx, setIdx] = useState(0);

  if (list.length === 0) return null;

  const has = list.length > 1;
  const current = list[idx];

  function step(dir: 1 | -1, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIdx((i) => (i + dir + list.length) % list.length);
  }

  function goTo(target: number, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIdx(target);
  }

  return (
    <div
      className="group/gallery relative aspect-[16/10] overflow-hidden"
      onClick={(e) => {
        if (onImageClick) {
          e.preventDefault();
          e.stopPropagation();
          onImageClick(idx);
        }
      }}
    >
      <Image
        src={current}
        alt={alt}
        fill
        sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
        className="object-cover transition-transform duration-500 group-hover/gallery:scale-105"
        placeholder="blur"
        blurDataURL={BLUR_DATA_URL}
        priority={priority}
      />

      {has ? (
        <>
          {/* Sol arrow */}
          <button
            type="button"
            onClick={(e) => step(-1, e)}
            aria-label="Önceki foto"
            className="bg-background/80 text-foreground hover:bg-background absolute left-2 top-1/2 z-10 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-full opacity-0 shadow-md backdrop-blur transition-all hover:scale-110 group-hover/gallery:opacity-100 sm:left-2"
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
          </button>

          {/* Sağ arrow */}
          <button
            type="button"
            onClick={(e) => step(1, e)}
            aria-label="Sonraki foto"
            className="bg-background/80 text-foreground hover:bg-background absolute right-2 top-1/2 z-10 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-full opacity-0 shadow-md backdrop-blur transition-all hover:scale-110 group-hover/gallery:opacity-100 sm:right-2"
          >
            <ChevronRight className="size-4" aria-hidden="true" />
          </button>

          {/* Dot indicators */}
          <div className="absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 gap-1">
            {list.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={(e) => goTo(i, e)}
                aria-label={`Foto ${i + 1}/${list.length}`}
                aria-current={i === idx}
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  i === idx
                    ? 'w-5 bg-white shadow'
                    : 'w-1.5 bg-white/60 hover:bg-white/85',
                )}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
