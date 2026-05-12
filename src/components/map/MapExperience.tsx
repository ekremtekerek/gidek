'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useHomeStage } from '@/components/home/home-stage-context';
import type { DealWithCoords } from '@/lib/db/queries/deals';
import type { Bounds, LatLng, MapDeal } from '@/lib/utils/geo';
import { MapFilters, type MapFilterState } from './MapFilters';
import { mergeMapDeals } from './map-deal-adapters';

// Mapbox bundle ~200KB → dynamic import, no SSR (window erişimi).
const MapView = dynamic(() => import('./MapView').then((m) => m.MapView), {
  ssr: false,
  loading: () => (
    <div className="bg-muted/40 text-muted-foreground flex h-full items-center justify-center text-sm">
      Harita yükleniyor…
    </div>
  ),
});

interface Props {
  initialDeals: DealWithCoords[];
  initialCenter?: LatLng;
}

export function MapExperience({ initialDeals, initialCenter }: Props) {
  const [deals, setDeals] = useState<DealWithCoords[]>(initialDeals);
  const [selectedDeal, setSelectedDeal] = useState<MapDeal | null>(null);
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [locating, setLocating] = useState(false);
  const [filterState, setFilterState] = useState<MapFilterState>({
    categorySlug: null,
    maxPrice: null,
  });

  const lastBoundsRef = useRef<Bounds | null>(null);
  const debounceRef = useRef<number | null>(null);

  const stage = useHomeStage();
  const aiSuggestedDeals = stage?.aiSuggestedDeals ?? null;

  // Konum state'i değişince stage context'e de yaz — Welcome carousel'ı
  // yakından uzağa sıralamak için.
  const stageSetUserLocation = stage?.setUserLocation;
  useEffect(() => {
    stageSetUserLocation?.(userLocation);
  }, [userLocation, stageSetUserLocation]);

  // Bbox + AI önerilerini tek MapDeal listesinde birleştir, maxPrice filtrele.
  const mergedDeals = useMemo<MapDeal[]>(() => {
    const merged = mergeMapDeals(deals, aiSuggestedDeals);
    const max = filterState.maxPrice;
    return max === null ? merged : merged.filter((d) => d.discounted_price <= max);
  }, [deals, aiSuggestedDeals, filterState.maxPrice]);

  // AI marker'larına işaret koymak için id seti.
  const aiHighlightIds = useMemo<Set<string>>(() => {
    if (!aiSuggestedDeals) return new Set();
    return new Set(aiSuggestedDeals.map((d) => d.id));
  }, [aiSuggestedDeals]);

  // AI yeni öneri geldiğinde haritayı fit'le.
  const fitToIds = useMemo<string[] | null>(() => {
    if (!aiSuggestedDeals || aiSuggestedDeals.length === 0) return null;
    return aiSuggestedDeals.filter((d) => d.lat !== null && d.lng !== null).map((d) => d.id);
  }, [aiSuggestedDeals]);

  const fetchBounds = useCallback(
    async (b: Bounds, categorySlug: string | null) => {
      try {
        const params = new URLSearchParams({
          swLat: String(b.sw.lat),
          swLng: String(b.sw.lng),
          neLat: String(b.ne.lat),
          neLng: String(b.ne.lng),
        });
        if (categorySlug) params.set('category', categorySlug);
        const res = await fetch(`/api/deals/in-bounds?${params}`, { cache: 'no-store' });
        if (!res.ok) throw new Error('fetch failed');
        const json = (await res.json()) as { deals: DealWithCoords[] };
        setDeals(json.deals ?? []);
      } catch {
        toast.error('Harita verileri yüklenemedi.');
      }
    },
    [],
  );

  const handleBoundsChange = useCallback(
    (b: Bounds) => {
      lastBoundsRef.current = b;
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      debounceRef.current = window.setTimeout(
        () => fetchBounds(b, filterState.categorySlug),
        400,
      );
    },
    [fetchBounds, filterState.categorySlug],
  );

  // Kategori değişince selection temizle + yeniden fetch.
  useEffect(() => {
    setSelectedDeal(null);
    if (!lastBoundsRef.current) return;
    fetchBounds(lastBoundsRef.current, filterState.categorySlug);
  }, [filterState.categorySlug, fetchBounds]);

  const requestLocation = useCallback((opts: { silent?: boolean } = {}) => {
    if (!('geolocation' in navigator)) {
      if (!opts.silent) toast.error('Tarayıcın konum servisini desteklemiyor.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        if (opts.silent) return; // auto-prompt'ta sessiz başarısızlık
        if (err.code === err.PERMISSION_DENIED) {
          toast('Konum izni reddedildi. Haritayı manuel sürükleyebilirsin.');
        } else {
          toast.error('Konum alınamadı.');
        }
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60_000 },
    );
  }, []);

  const handleLocationRequest = useCallback(() => requestLocation(), [requestLocation]);

  // Otomatik konum onayı — site açılır açılmaz bir kez denenir. İzin
  // 'granted' ise sessizce yer alınır; 'prompt' ise tarayıcı izin diyaloğunu
  // gösterir. Reddedilmişse hiç çağırmaz, kullanıcı butonla manuel deneyebilir.
  useEffect(() => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) return;
    let cancelled = false;

    async function autoPrompt() {
      const askedFlag = 'gidek-geo-asked';
      try {
        if ('permissions' in navigator) {
          const status = await navigator.permissions.query({ name: 'geolocation' });
          if (status.state === 'denied') return;
          if (status.state === 'granted') {
            if (!cancelled) requestLocation({ silent: true });
            return;
          }
        }
        // 'prompt' veya Permissions API yok — bir kerelik tetikleme.
        if (window.localStorage.getItem(askedFlag) === '1') return;
        window.localStorage.setItem(askedFlag, '1');
        if (!cancelled) requestLocation({ silent: true });
      } catch {
        // Permissions API ya da localStorage erişim sorunu — sessizce geç.
      }
    }
    void autoPrompt();
    return () => {
      cancelled = true;
    };
  }, [requestLocation]);

  return (
    <div className="bg-background flex h-full flex-col">
      <MapFilters
        state={filterState}
        onChange={setFilterState}
        onLocationRequest={handleLocationRequest}
        locating={locating}
        hasLocation={userLocation !== null}
      />

      <div className="relative min-h-0 flex-1">
        <MapView
          deals={mergedDeals}
          selectedDeal={selectedDeal}
          onSelectDeal={setSelectedDeal}
          onBoundsChange={handleBoundsChange}
          userLocation={userLocation}
          initialCenter={initialCenter}
          aiHighlightIds={aiHighlightIds}
          fitToIds={fitToIds}
        />
      </div>
    </div>
  );
}
