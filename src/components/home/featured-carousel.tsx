'use client';

import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DealCard } from '@/components/deal/deal-card';
import { Container } from '@/components/ui/container';
import type { DealWithMerchant } from '@/lib/db/queries/deals';

interface Props {
  deals: DealWithMerchant[];
}

export function FeaturedCarousel({ deals }: Props) {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: 'start', slidesToScroll: 1 },
    [Autoplay({ delay: 4500, stopOnInteraction: false, stopOnMouseEnter: true })],
  );
  const [selected, setSelected] = useState(0);

  // Subscribe to embla 'select' event so the active dot stays in sync.
  // setSelected lives in the callback, not directly in the effect body,
  // which satisfies react-hooks/set-state-in-effect.
  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelected(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);

  if (deals.length === 0) return null;

  // With slidesToScroll: 1, snap count == deal count, so we can derive
  // the dot list from props instead of reading emblaApi during render.
  const slideCount = deals.length;

  return (
    <section aria-labelledby="featured-heading" className="py-10 sm:py-12">
      <Container>
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-muted-foreground mb-1 text-xs font-semibold tracking-wide uppercase">
              Editör seçimi
            </p>
            <h2 id="featured-heading" className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Bu hafta öne çıkanlar
            </h2>
          </div>
          <div className="hidden gap-2 sm:flex">
            <button
              type="button"
              aria-label="Önceki"
              onClick={() => emblaApi?.scrollPrev()}
              className="border-border bg-background hover:bg-muted inline-flex size-10 items-center justify-center rounded-full border transition-colors"
            >
              <ChevronLeft className="size-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Sonraki"
              onClick={() => emblaApi?.scrollNext()}
              className="border-border bg-background hover:bg-muted inline-flex size-10 items-center justify-center rounded-full border transition-colors"
            >
              <ChevronRight className="size-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div ref={emblaRef} className="overflow-hidden">
          {/* Embla canonical pattern: viewport overflow-hidden, container has
              negative left margin equal to slide left padding so the first
              card sits flush. Each slide owns its own gutter via pl-*. This
              keeps gaps consistent at every scroll position (the previous
              gap-4 made the gap collapse at the right edge during scroll). */}
          <div className="-ml-4 flex touch-pan-y">
            {deals.map((deal, i) => (
              <div
                key={deal.id}
                className="min-w-0 shrink-0 grow-0 basis-full pl-4 sm:basis-1/2 lg:basis-1/3 xl:basis-1/4"
              >
                <DealCard deal={deal} priority={i < 2} />
              </div>
            ))}
          </div>
        </div>

        {slideCount > 1 ? (
          <div
            className="mt-5 flex justify-center gap-1.5"
            role="tablist"
            aria-label="Slayt seçici"
          >
            {Array.from({ length: slideCount }).map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-label={`${i + 1}. slayt`}
                aria-selected={i === selected}
                onClick={() => emblaApi?.scrollTo(i)}
                className={
                  i === selected
                    ? 'bg-foreground h-1.5 w-8 rounded-full transition-all duration-300'
                    : 'bg-muted hover:bg-muted-foreground/40 h-1.5 w-1.5 rounded-full transition-all duration-300'
                }
              />
            ))}
          </div>
        ) : null}
      </Container>
    </section>
  );
}
