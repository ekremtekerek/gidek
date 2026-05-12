'use client';

import { useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import useEmblaCarousel from 'embla-carousel-react';
import { MapPin, Sparkles } from 'lucide-react';
import type { DealWithMerchant } from '@/lib/db/queries/deals';
import { Badge } from '@/components/ui/badge';
import { useHomeStage } from '@/components/home/home-stage-context';
import { BLUR_DATA_URL } from '@/lib/utils/blur';
import { formatTRY } from '@/lib/utils/format';
import { haversineKm } from '@/lib/utils/geo';

interface Props {
  deals: DealWithMerchant[];
  city: string;
}

/**
 * Welcome state'te chat üstünde sergilenen "yakınınızdaki fırsatlar"
 * carousel'ı. Kullanıcı geolocation izni vermişse fırsatlar konumdan
 * uzaklığa göre sıralanır (yakından uzağa). Konum yoksa SSR'deki featured
 * sıralaması korunur.
 */
export function NearbyCarousel({ deals, city }: Props) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: 'start', dragFree: true });
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const setRefs = (node: HTMLDivElement | null) => {
    emblaRef(node);
    viewportRef.current = node;
  };
  const stage = useHomeStage();
  const userLocation = stage?.userLocation ?? null;

  // Mouse wheel'i embla'nın slide-bazlı navigasyonuna bağla.
  useEffect(() => {
    const el = viewportRef.current;
    if (!el || !emblaApi) return;
    let accum = 0;
    const onWheel = (e: WheelEvent) => {
      if (e.deltaY === 0) return;
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      const canNext = emblaApi.canScrollNext();
      const canPrev = emblaApi.canScrollPrev();
      if ((e.deltaY > 0 && !canNext) || (e.deltaY < 0 && !canPrev)) return;
      e.preventDefault();
      accum += e.deltaY;
      if (accum > 50) {
        emblaApi.scrollNext();
        accum = 0;
      } else if (accum < -50) {
        emblaApi.scrollPrev();
        accum = 0;
      }
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [emblaApi]);

  const ordered = useMemo(() => {
    if (!userLocation) return deals;
    const withDist = deals.map((d) => {
      const lat = d.merchant?.lat;
      const lng = d.merchant?.lng;
      const km =
        lat !== null && lat !== undefined && lng !== null && lng !== undefined
          ? haversineKm(userLocation, { lat: Number(lat), lng: Number(lng) })
          : Number.POSITIVE_INFINITY;
      return { deal: d, km };
    });
    withDist.sort((a, b) => a.km - b.km);
    return withDist.map((x) => x.deal);
  }, [deals, userLocation]);

  if (ordered.length === 0) return null;

  return (
    <div className="w-full max-w-3xl">
      <div className="text-muted-foreground mb-3 flex items-center justify-center gap-1.5 text-xs font-semibold tracking-wide uppercase">
        <Sparkles className="size-3.5" aria-hidden="true" />
        {userLocation ? 'Sana en yakın fırsatlar' : `${city} • Yakınınızdaki fırsatlar`}
      </div>
      <div ref={setRefs} className="overflow-hidden">
        <div className="-ml-3 flex touch-pan-y">
          {ordered.map((deal) => (
            <div
              key={deal.id}
              className="min-w-0 shrink-0 grow-0 basis-[160px] pl-3 sm:basis-[180px]"
            >
              <MiniDealCard deal={deal} userLocation={userLocation} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MiniDealCard({
  deal,
  userLocation,
}: {
  deal: DealWithMerchant;
  userLocation: { lat: number; lng: number } | null;
}) {
  const discount = deal.discount_percent ?? 0;
  const showDiscount = discount > 0 && deal.discounted_price < deal.original_price;
  const location = [deal.district, deal.city].filter(Boolean).join(', ');
  const lat = deal.merchant?.lat;
  const lng = deal.merchant?.lng;
  const distanceKm =
    userLocation && lat !== null && lat !== undefined && lng !== null && lng !== undefined
      ? haversineKm(userLocation, { lat: Number(lat), lng: Number(lng) })
      : null;

  return (
    <Link
      href={`/f/${deal.slug}`}
      className="group block focus-visible:outline-none"
      aria-label={deal.title}
    >
      <div className="bg-muted relative aspect-[3/4] overflow-hidden rounded-xl shadow-sm transition-all group-hover:-translate-y-0.5 group-hover:shadow-md">
        <Image
          src={deal.cover_image}
          alt={deal.title}
          fill
          sizes="180px"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          placeholder="blur"
          blurDataURL={BLUR_DATA_URL}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

        {showDiscount ? (
          <Badge variant="discount" size="sm" className="absolute top-2 left-2">
            %{discount}
          </Badge>
        ) : null}

        {distanceKm !== null && Number.isFinite(distanceKm) ? (
          <span className="bg-background/85 text-foreground absolute top-2 right-2 inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold backdrop-blur">
            <MapPin className="size-2.5" aria-hidden="true" />
            {formatDistance(distanceKm)}
          </span>
        ) : null}

        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 p-2.5 text-white">
          <h4 className="line-clamp-2 text-xs leading-tight font-semibold text-balance sm:text-sm">
            {deal.title}
          </h4>
          {location ? (
            <p className="inline-flex items-center gap-1 text-[10px] opacity-80">
              <MapPin className="size-2.5" aria-hidden="true" />
              <span className="line-clamp-1">{location}</span>
            </p>
          ) : null}
          <p className="mt-0.5 text-xs font-bold sm:text-sm">
            {formatTRY(deal.discounted_price)}
          </p>
        </div>
      </div>
    </Link>
  );
}

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}
