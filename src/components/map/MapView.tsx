'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import Link from 'next/link';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin, Sun, SunDim, Moon } from 'lucide-react';
import { ISTANBUL_CENTER, type Bounds, type LatLng, type MapDeal } from '@/lib/utils/geo';
import { formatTRY } from '@/lib/utils/format';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils/cn';

interface Props {
  deals: MapDeal[];
  selectedDeal: MapDeal | null;
  onSelectDeal: (deal: MapDeal | null) => void;
  onBoundsChange: (b: Bounds) => void;
  userLocation: LatLng | null;
  initialCenter?: LatLng;
  /** Set of deal id'leri AI önerisi olarak işaretle (overlay marker stili). */
  aiHighlightIds?: Set<string>;
  /** AI önerileri geldiğinde haritayı bu deal'ları kapsayacak şekilde fit'ler. */
  fitToIds?: string[] | null;
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '';

type LightPreset = 'day' | 'dusk' | 'night';
const LIGHT_STORAGE_KEY = 'gidek-map-light';

function readStoredLight(): LightPreset {
  if (typeof window === 'undefined') return 'day';
  const v = window.localStorage.getItem(LIGHT_STORAGE_KEY);
  return v === 'dusk' || v === 'night' || v === 'day' ? v : 'day';
}

export function MapView({
  deals,
  selectedDeal,
  onSelectDeal,
  onBoundsChange,
  userLocation,
  initialCenter,
  aiHighlightIds,
  fitToIds,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const [popupContainer, setPopupContainer] = useState<HTMLDivElement | null>(null);
  const [light, setLight] = useState<LightPreset>('day');
  const [styleReady, setStyleReady] = useState(false);

  const onBoundsChangeRef = useRef(onBoundsChange);
  const onSelectDealRef = useRef(onSelectDeal);
  onBoundsChangeRef.current = onBoundsChange;
  onSelectDealRef.current = onSelectDeal;

  const dealsRef = useRef<MapDeal[]>(deals);
  dealsRef.current = deals;

  // Init map once.
  useEffect(() => {
    if (!containerRef.current || !MAPBOX_TOKEN) return;
    mapboxgl.accessToken = MAPBOX_TOKEN;

    const initialLight = readStoredLight();
    setLight(initialLight);

    const startCenter = initialCenter ?? ISTANBUL_CENTER;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/standard',
      center: [startCenter.lng, startCenter.lat],
      zoom: 11.5,
      pitch: 45,
      bearing: -17.6,
      antialias: true,
      attributionControl: false,
    });

    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'top-right');
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right');

    map.on('style.load', () => {
      try {
        map.setConfigProperty('basemap', 'lightPreset', initialLight);
        map.setConfigProperty('basemap', 'showPointOfInterestLabels', true);
        map.setConfigProperty('basemap', 'showPlaceLabels', true);
        map.setConfigProperty('basemap', 'showRoadLabels', true);
        if (typeof map.setLanguage === 'function') map.setLanguage('tr');
      } catch {
        // ignore
      }
      setStyleReady(true);
    });

    const emitBounds = () => {
      const b = map.getBounds();
      if (!b) return;
      onBoundsChangeRef.current({
        ne: { lat: b.getNorth(), lng: b.getEast() },
        sw: { lat: b.getSouth(), lng: b.getWest() },
      });
    };

    map.on('load', emitBounds);
    map.on('moveend', (e) => {
      if (e.originalEvent) emitBounds();
    });
    map.on('click', () => onSelectDealRef.current(null));

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current.clear();
      setStyleReady(false);
    };
  }, []);

  // Light toggle.
  useEffect(() => {
    if (!styleReady || !mapRef.current) return;
    try {
      mapRef.current.setConfigProperty('basemap', 'lightPreset', light);
      window.localStorage.setItem(LIGHT_STORAGE_KEY, light);
    } catch {
      // ignore
    }
  }, [light, styleReady]);

  // Sync markers.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const incoming = new Set(deals.map((d) => d.id));
    for (const [id, marker] of markersRef.current) {
      if (!incoming.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    }

    for (const deal of deals) {
      if (markersRef.current.has(deal.id)) continue;
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'gidek-marker';
      const price = Math.round(deal.discounted_price);
      el.textContent = `₺${price.toLocaleString('tr-TR')}`;
      el.setAttribute('aria-label', `${deal.title} — ${price}₺`);
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const current = dealsRef.current.find((d) => d.id === deal.id) ?? deal;
        onSelectDealRef.current(current);
      });

      const marker = new mapboxgl.Marker(el, { anchor: 'bottom' })
        .setLngLat([deal.lng, deal.lat])
        .addTo(map);
      markersRef.current.set(deal.id, marker);
    }
  }, [deals]);

  // AI highlight + selected state — pure class toggle, doesn't recreate markers.
  useEffect(() => {
    const selId = selectedDeal?.id ?? null;
    for (const [id, marker] of markersRef.current) {
      const el = marker.getElement();
      el.classList.toggle('is-selected', id === selId);
      el.classList.toggle('is-ai', aiHighlightIds?.has(id) ?? false);
    }
  }, [selectedDeal, aiHighlightIds, deals]);

  // Popup + smooth fly-to.
  useEffect(() => {
    const map = mapRef.current;
    if (popupRef.current) {
      popupRef.current.remove();
      popupRef.current = null;
      setPopupContainer(null);
    }
    if (!map || !selectedDeal) return;

    const lng = selectedDeal.lng;
    const lat = selectedDeal.lat;

    map.flyTo({
      center: [lng, lat - 0.002],
      zoom: Math.max(map.getZoom(), 14.5),
      pitch: 60,
      bearing: -17.6,
      duration: 900,
      essential: true,
    });

    const container = document.createElement('div');
    const popup = new mapboxgl.Popup({
      offset: 32,
      closeButton: false,
      maxWidth: '280px',
      className: 'gidek-popup',
    })
      .setLngLat([lng, lat])
      .setDOMContent(container)
      .addTo(map);

    popup.on('close', () => onSelectDealRef.current(null));
    popupRef.current = popup;
    setPopupContainer(container);
  }, [selectedDeal]);

  // Fit to AI-suggested deals when they arrive.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !fitToIds || fitToIds.length === 0 || !styleReady) return;

    const pins = deals.filter((d) => fitToIds.includes(d.id));
    if (pins.length === 0) return;

    if (pins.length === 1) {
      map.flyTo({
        center: [pins[0].lng, pins[0].lat],
        zoom: 14,
        pitch: 45,
        duration: 900,
        essential: true,
      });
      return;
    }

    const bounds = new mapboxgl.LngLatBounds();
    for (const p of pins) bounds.extend([p.lng, p.lat]);
    map.fitBounds(bounds, { padding: 80, maxZoom: 14, duration: 900 });
  }, [fitToIds, deals, styleReady]);

  // User location marker + fly-to.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }
    if (!userLocation) return;

    const el = document.createElement('div');
    el.className = 'gidek-user-marker';
    userMarkerRef.current = new mapboxgl.Marker(el)
      .setLngLat([userLocation.lng, userLocation.lat])
      .addTo(map);

    map.flyTo({ center: [userLocation.lng, userLocation.lat], zoom: 13, essential: true });
  }, [userLocation]);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="bg-muted text-muted-foreground flex h-full items-center justify-center p-6 text-center text-sm">
        <div>
          <p className="text-foreground font-medium">Harita için Mapbox token gerekiyor.</p>
          <p className="mt-1 text-xs">
            <code className="bg-background rounded px-1.5 py-0.5">NEXT_PUBLIC_MAPBOX_TOKEN</code>{' '}
            <code>.env.local</code>&apos;a eklenince devreye girer.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div ref={containerRef} className="size-full" />
      <LightToggle value={light} onChange={setLight} disabled={!styleReady} />
      {popupContainer && selectedDeal
        ? createPortal(<PopupCard deal={selectedDeal} />, popupContainer)
        : null}
    </>
  );
}

function LightToggle({
  value,
  onChange,
  disabled,
}: {
  value: LightPreset;
  onChange: (next: LightPreset) => void;
  disabled: boolean;
}) {
  const options: { value: LightPreset; Icon: typeof Sun; label: string }[] = [
    { value: 'day', Icon: Sun, label: 'Gündüz' },
    { value: 'dusk', Icon: SunDim, label: 'Gün batımı' },
    { value: 'night', Icon: Moon, label: 'Gece' },
  ];

  return (
    <div
      className={cn(
        'border-border bg-background/90 absolute bottom-10 left-3 z-10 flex rounded-full border p-1 shadow-lg backdrop-blur transition-opacity sm:bottom-6 sm:left-4',
        disabled && 'opacity-50',
      )}
    >
      {options.map(({ value: v, Icon, label }) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          disabled={disabled}
          title={label}
          aria-label={label}
          aria-pressed={value === v}
          className={cn(
            'inline-flex size-8 items-center justify-center rounded-full transition-colors',
            value === v
              ? 'bg-foreground text-background'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted',
          )}
        >
          <Icon className="size-4" aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}

function PopupCard({ deal }: { deal: MapDeal }) {
  const discount = deal.discount_percent ?? 0;
  const showDiscount = discount > 0 && deal.discounted_price < deal.original_price;
  const location = [deal.district, deal.city].filter(Boolean).join(', ');

  return (
    <Link href={`/f/${deal.slug}`} className="block w-[260px]">
      <div className="bg-muted relative aspect-[16/10] overflow-hidden">
        <Image src={deal.cover_image} alt={deal.title} fill sizes="260px" className="object-cover" />
        {showDiscount ? (
          <Badge variant="discount" size="sm" className="absolute top-2 left-2">
            %{discount}
          </Badge>
        ) : null}
        {deal.isAi ? (
          <Badge
            variant="accent"
            size="sm"
            className="absolute top-2 right-2 bg-amber-500 text-white"
          >
            ✨ AI
          </Badge>
        ) : null}
      </div>
      <div className="p-3">
        <h4 className="line-clamp-2 text-sm font-semibold leading-snug">{deal.title}</h4>
        {location ? (
          <p className="text-muted-foreground mt-1 inline-flex items-center gap-1 text-xs">
            <MapPin className="size-3" aria-hidden="true" />
            <span className="line-clamp-1">{location}</span>
          </p>
        ) : null}
        <div className="mt-2 flex items-baseline justify-between gap-2">
          <div className="flex items-baseline gap-1.5">
            {showDiscount ? (
              <span className="text-muted-foreground text-xs line-through">
                {formatTRY(deal.original_price)}
              </span>
            ) : null}
            <span className="text-sm font-semibold">{formatTRY(deal.discounted_price)}</span>
          </div>
          <span className="text-foreground/80 text-xs font-medium underline-offset-4 hover:underline">
            İncele &rarr;
          </span>
        </div>
      </div>
    </Link>
  );
}
