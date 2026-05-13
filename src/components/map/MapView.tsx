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

const SOURCE_DEALS = 'gidek-deals';
const LAYER_CLUSTERS = 'gidek-clusters';
const LAYER_CLUSTER_COUNT = 'gidek-cluster-count';
const LAYER_POINT_BG = 'gidek-point-bg';
const LAYER_POINT_LABEL = 'gidek-point-label';

function readStoredLight(): LightPreset {
  if (typeof window === 'undefined') return 'day';
  const v = window.localStorage.getItem(LIGHT_STORAGE_KEY);
  return v === 'dusk' || v === 'night' || v === 'day' ? v : 'day';
}

/**
 * Aktif harita gösterimi. Native pgvector kullanımı gibi haritada da native
 * Mapbox clustering kullanıyoruz: kalın trafik ağırlıklı semtlerde 50+
 * pin tek bir baloncuğa toplanıyor, zoom'la dağılıyor. AI'nın önerdiği
 * fırsatlar ayrı bir DOM marker katmanında kalıyor — kullanıcı asla
 * kaybolmasın diye kümeye girmez.
 */
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
  const aiMarkersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const [popupContainer, setPopupContainer] = useState<HTMLDivElement | null>(null);
  const [light, setLight] = useState<LightPreset>('day');
  const [styleReady, setStyleReady] = useState(false);
  const [layersReady, setLayersReady] = useState(false);

  const onBoundsChangeRef = useRef(onBoundsChange);
  const onSelectDealRef = useRef(onSelectDeal);
  onBoundsChangeRef.current = onBoundsChange;
  onSelectDealRef.current = onSelectDeal;

  const dealsRef = useRef<MapDeal[]>(deals);
  dealsRef.current = deals;
  const aiHighlightIdsRef = useRef<Set<string> | undefined>(aiHighlightIds);
  aiHighlightIdsRef.current = aiHighlightIds;

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
      installLayers(map);
      setStyleReady(true);
      setLayersReady(true);
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
    map.on('click', (e) => {
      // Genel arka plan tıklaması seçimi kapatır — ancak sadece bizim layer
      // dışında bir yere düştüyse. Layer'a düşen tıkları aşağıdaki spesifik
      // listener'lar yakalar ve event'i stop'lamasak da öncelik sırası bizi korur.
      const hits = map.queryRenderedFeatures(e.point, {
        layers: [LAYER_CLUSTERS, LAYER_POINT_BG, LAYER_POINT_LABEL],
      });
      if (hits.length === 0) onSelectDealRef.current(null);
    });

    // Cluster click → expansion zoom.
    map.on('click', LAYER_CLUSTERS, (e) => {
      const feat = e.features?.[0];
      if (!feat) return;
      const clusterId = (feat.properties as { cluster_id: number }).cluster_id;
      const source = map.getSource(SOURCE_DEALS) as mapboxgl.GeoJSONSource;
      source.getClusterExpansionZoom(clusterId, (err, zoom) => {
        if (err || typeof zoom !== 'number') return;
        const geom = feat.geometry as { type: string; coordinates: [number, number] };
        if (geom.type !== 'Point') return;
        map.easeTo({
          center: geom.coordinates,
          zoom: Math.min(zoom + 0.4, 16),
          duration: 600,
        });
      });
    });

    // Unclustered point click → seç (popup açılır).
    const pointClick = (e: mapboxgl.MapMouseEvent) => {
      const feat = e.features?.[0];
      if (!feat) return;
      const id = (feat.properties as { id?: string }).id;
      if (!id) return;
      const deal = dealsRef.current.find((d) => d.id === id);
      if (deal) onSelectDealRef.current(deal);
    };
    map.on('click', LAYER_POINT_BG, pointClick);
    map.on('click', LAYER_POINT_LABEL, pointClick);

    // Cursor pointer üzerinde.
    const setPointer = () => (map.getCanvas().style.cursor = 'pointer');
    const resetCursor = () => (map.getCanvas().style.cursor = '');
    for (const id of [LAYER_CLUSTERS, LAYER_POINT_BG, LAYER_POINT_LABEL]) {
      map.on('mouseenter', id, setPointer);
      map.on('mouseleave', id, resetCursor);
    }

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      aiMarkersRef.current.clear();
      setStyleReady(false);
      setLayersReady(false);
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

  // GeoJSON source verisini güncelle — AI deal'larını dışla.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !layersReady) return;
    const source = map.getSource(SOURCE_DEALS) as mapboxgl.GeoJSONSource | undefined;
    if (!source) return;

    const aiSet = aiHighlightIds ?? new Set<string>();
    const features = deals
      .filter((d) => !aiSet.has(d.id))
      .map((d) => ({
        type: 'Feature' as const,
        properties: {
          id: d.id,
          price: Math.round(Number(d.discounted_price) || 0),
        },
        geometry: {
          type: 'Point' as const,
          coordinates: [d.lng, d.lat] as [number, number],
        },
      }));

    source.setData({ type: 'FeatureCollection', features });
  }, [deals, aiHighlightIds, layersReady]);

  // AI marker'ları DOM olarak tut — clustering dışında, distinctive görünüm.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const aiSet = aiHighlightIds ?? new Set<string>();

    const wanted = new Set<string>();
    for (const d of deals) if (aiSet.has(d.id)) wanted.add(d.id);

    // Silinmesi gerekenler
    for (const [id, marker] of aiMarkersRef.current) {
      if (!wanted.has(id)) {
        marker.remove();
        aiMarkersRef.current.delete(id);
      }
    }
    // Yeni gelenler
    for (const deal of deals) {
      if (!aiSet.has(deal.id)) continue;
      if (aiMarkersRef.current.has(deal.id)) continue;
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'gidek-marker is-ai';
      const price = Math.round(deal.discounted_price);
      el.textContent = `₺${price.toLocaleString('tr-TR')}`;
      el.setAttribute('aria-label', `${deal.title} — ${price}₺ (AI önerisi)`);
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const current = dealsRef.current.find((d) => d.id === deal.id) ?? deal;
        onSelectDealRef.current(current);
      });
      const marker = new mapboxgl.Marker(el, { anchor: 'bottom' })
        .setLngLat([deal.lng, deal.lat])
        .addTo(map);
      aiMarkersRef.current.set(deal.id, marker);
    }
  }, [deals, aiHighlightIds]);

  // Seçili AI marker stilini güncelle.
  useEffect(() => {
    const selId = selectedDeal?.id ?? null;
    for (const [id, marker] of aiMarkersRef.current) {
      marker.getElement().classList.toggle('is-selected', id === selId);
    }
  }, [selectedDeal]);

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

/**
 * Source + layer kurulumu. Style yenilendiğinde (lightPreset değişince
 * style aslında reload olmuyor; setConfigProperty kullanıyoruz) yeniden
 * çağrılması gerekmez. Yine de defensive: addSource'tan önce duplicate kontrolü.
 */
function installLayers(map: mapboxgl.Map) {
  if (map.getSource(SOURCE_DEALS)) return;

  map.addSource(SOURCE_DEALS, {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] },
    cluster: true,
    clusterMaxZoom: 14,
    clusterRadius: 50,
  });

  // Cluster baloncuğu — sayı'ya göre renk ve boyut.
  map.addLayer({
    id: LAYER_CLUSTERS,
    type: 'circle',
    source: SOURCE_DEALS,
    filter: ['has', 'point_count'],
    paint: {
      'circle-color': [
        'step',
        ['get', 'point_count'],
        '#3b82f6', // blue-500 — küçük cluster (<10)
        10,
        '#f59e0b', // amber-500 — orta (10–49)
        50,
        '#ef4444', // red-500 — büyük (50+)
      ],
      'circle-radius': [
        'step',
        ['get', 'point_count'],
        18,
        10,
        24,
        50,
        30,
      ],
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': 2,
      'circle-opacity': 0.92,
    },
  });

  map.addLayer({
    id: LAYER_CLUSTER_COUNT,
    type: 'symbol',
    source: SOURCE_DEALS,
    filter: ['has', 'point_count'],
    layout: {
      'text-field': ['get', 'point_count_abbreviated'],
      'text-size': 13,
      'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
      'text-allow-overlap': true,
    },
    paint: {
      'text-color': '#ffffff',
    },
  });

  // Unclustered nokta — beyaz pill + fiyat metni.
  map.addLayer({
    id: LAYER_POINT_BG,
    type: 'circle',
    source: SOURCE_DEALS,
    filter: ['!', ['has', 'point_count']],
    paint: {
      'circle-color': '#ffffff',
      'circle-stroke-color': '#0a0a0a',
      'circle-stroke-width': 1.5,
      'circle-radius': 18,
    },
  });

  map.addLayer({
    id: LAYER_POINT_LABEL,
    type: 'symbol',
    source: SOURCE_DEALS,
    filter: ['!', ['has', 'point_count']],
    layout: {
      'text-field': ['concat', '₺', ['to-string', ['get', 'price']]],
      'text-size': 11,
      'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
      'text-allow-overlap': true,
    },
    paint: {
      'text-color': '#0a0a0a',
    },
  });
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
