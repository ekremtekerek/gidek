'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { X } from 'lucide-react';
import { TravelCard } from '@/components/travel/travel-card';

// Mapbox GL JS ~600KB — sadece harita view'a geçince bundle'a katılsın.
const MapView = dynamic(
  () => import('@/components/map/MapView').then((m) => m.MapView),
  {
    ssr: false,
    loading: () => (
      <div className="bg-muted/30 flex h-full items-center justify-center">
        <p className="text-muted-foreground text-sm">Harita yükleniyor…</p>
      </div>
    ),
  },
);
import type { DealWithMerchant } from '@/lib/db/queries/deals';
import type { MapDeal } from '@/lib/utils/geo';
import { cn } from '@/lib/utils/cn';
import { formatTRY } from '@/lib/utils/format';

interface Props {
  deals: DealWithMerchant[];
}

/**
 * Tatil arama sonuçlarının harita gösterimi. Mevcut MapView'ı reuse eder;
 * tıklanan deal sağ-üstte kart olarak gözükür.
 */
export function TravelMapView({ deals }: Props) {
  const [selected, setSelected] = useState<MapDeal | null>(null);

  const mapDeals = useMemo<MapDeal[]>(() => {
    const out: MapDeal[] = [];
    for (const d of deals) {
      const lat = d.merchant?.lat;
      const lng = d.merchant?.lng;
      if (lat === null || lat === undefined || lng === null || lng === undefined) continue;
      out.push({
        id: d.id,
        slug: d.slug,
        title: d.title,
        subtitle: d.subtitle ?? null,
        cover_image: d.cover_image,
        city: d.city,
        district: d.merchant?.district ?? d.district ?? null,
        discounted_price: Number(d.discounted_price),
        original_price: Number(d.original_price),
        discount_percent: d.discount_percent ?? 0,
        lat: Number(lat),
        lng: Number(lng),
      });
    }
    return out;
  }, [deals]);

  const selectedFull = useMemo(
    () => (selected ? deals.find((d) => d.id === selected.id) ?? null : null),
    [selected, deals],
  );

  const withoutCoordsCount = deals.length - mapDeals.length;

  if (mapDeals.length === 0) {
    return (
      <div className="border-border bg-muted/30 rounded-xl border border-dashed p-10 text-center">
        <p className="text-sm font-semibold">Bu filtrelerde haritalanacak otel yok</p>
        <p className="text-muted-foreground mt-1 text-xs">
          Liste görünümüne geri dön veya filtreleri gevşet.
        </p>
      </div>
    );
  }

  return (
    <div className="border-border bg-background relative overflow-hidden rounded-xl border shadow-sm">
      <div className="h-[70svh] min-h-[480px] w-full">
        <MapView
          deals={mapDeals}
          selectedDeal={selected}
          onSelectDeal={setSelected}
          onBoundsChange={() => {
            /* no-op — bu sayfada bbox dinamik fetch yok */
          }}
          userLocation={null}
        />
      </div>

      {/* Sol-üst — sayım rozeti */}
      <span className="bg-background/95 absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs font-bold shadow-sm backdrop-blur">
        Haritada{' '}
        <span className="text-foreground tabular-nums">{mapDeals.length}</span>
        {withoutCoordsCount > 0 ? (
          <span className="text-muted-foreground font-normal">
            · {withoutCoordsCount} koordinatsız
          </span>
        ) : null}
      </span>

      {/* Sağ-üst — seçili deal kartı */}
      {selectedFull ? (
        <div
          className={cn(
            'pointer-events-auto absolute right-3 top-3 w-72 max-w-[calc(100vw-2rem)]',
            'animate-in slide-in-from-right duration-200',
          )}
        >
          <div className="border-border bg-background relative overflow-hidden rounded-xl border shadow-2xl">
            <button
              type="button"
              onClick={() => setSelected(null)}
              aria-label="Kapat"
              className="bg-background/80 hover:bg-background absolute right-2 top-2 z-10 inline-flex size-7 items-center justify-center rounded-full backdrop-blur transition-colors"
            >
              <X className="size-3.5" aria-hidden="true" />
            </button>
            <Link href={`/f/${selectedFull.slug}`} className="block">
              <Image
                src={selectedFull.cover_image}
                alt={selectedFull.title}
                width={288}
                height={160}
                className="aspect-[16/9] w-full object-cover"
                priority
              />
              <div className="p-3">
                <p className="text-muted-foreground text-[10px] uppercase tracking-wide">
                  {[selectedFull.district, selectedFull.city].filter(Boolean).join(', ') ||
                    'Türkiye'}
                </p>
                <h3 className="mt-0.5 line-clamp-2 text-sm font-semibold leading-snug">
                  {selectedFull.title}
                </h3>
                <p className="mt-2 text-base font-bold tabular-nums">
                  {formatTRY(Number(selectedFull.discounted_price))}{' '}
                  <span className="text-muted-foreground text-[10px] font-normal">
                    kişi başı
                  </span>
                </p>
              </div>
            </Link>
          </div>
          {/* Alternatif: TravelCard kullanmak istersen burayı değiştir */}
          {/* <TravelCard deal={selectedFull} /> */}
        </div>
      ) : null}
    </div>
  );
}

// Lint hush — TravelCard ileride seçili kartta kullanılabilir.
export const __unused_TravelCard = TravelCard;
