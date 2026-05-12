'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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

  useEffect(() => {
    if (all.length < 2) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setIndex((i) => Math.min(i + 1, all.length - 1));
      if (e.key === 'ArrowLeft') setIndex((i) => Math.max(i - 1, 0));
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [all.length]);

  const active = all[index] ?? cover;
  const hasMultiple = all.length > 1;
  const showDiscount = discount > 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="border-border bg-muted relative aspect-[4/3] w-full overflow-hidden rounded-xl border">
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
            <button
              type="button"
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              disabled={index === 0}
              aria-label="Önceki görsel"
              className="bg-background/85 hover:bg-background absolute top-1/2 left-3 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-full shadow-md backdrop-blur transition-all disabled:opacity-40"
            >
              <ChevronLeft className="size-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setIndex((i) => Math.min(all.length - 1, i + 1))}
              disabled={index === all.length - 1}
              aria-label="Sonraki görsel"
              className="bg-background/85 hover:bg-background absolute top-1/2 right-3 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-full shadow-md backdrop-blur transition-all disabled:opacity-40"
            >
              <ChevronRight className="size-5" aria-hidden="true" />
            </button>

            <div
              aria-hidden="true"
              className="bg-background/85 text-foreground absolute right-4 bottom-4 rounded-full px-2.5 py-1 text-xs font-medium backdrop-blur"
            >
              {index + 1} / {all.length}
            </div>
          </>
        ) : null}
      </div>

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
    </div>
  );
}
