'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, MapPin, Search } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '';

export interface AddressSelection {
  address: string;
  city?: string;
  district?: string;
  lat: number;
  lng: number;
}

interface Props {
  defaultValue?: string;
  onSelect: (selection: AddressSelection) => void;
  /** Hidden input adı — form'a değer iletilir; AddressAutocomplete typed text'i tutar. */
  name?: string;
  placeholder?: string;
}

interface Feature {
  properties: {
    name?: string;
    full_address?: string;
    place_formatted?: string;
    feature_type?: string;
    context?: {
      place?: { name?: string };
      region?: { name?: string };
      district?: { name?: string };
      locality?: { name?: string };
    };
    coordinates?: { latitude: number; longitude: number };
  };
  geometry?: { coordinates: [number, number] };
}

/**
 * Mapbox Geocoding v6 ile adres autocomplete'i. Türkiye + Türkçe.
 * Yaz → 300ms debounce → öneriler → seç → callback parent'a tüm alanları
 * verir (adres, şehir, ilçe, koordinat).
 */
export function AddressAutocomplete({
  defaultValue = '',
  onSelect,
  name = 'address_search',
  placeholder = 'Adres veya yer adı yaz…',
}: Props) {
  const [q, setQ] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [features, setFeatures] = useState<Feature[]>([]);
  const ref = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(() => {
    const trimmed = q.trim();
    /* eslint-disable react-hooks/set-state-in-effect */
    if (trimmed.length < 3 || !MAPBOX_TOKEN) {
      setFeatures([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    /* eslint-enable react-hooks/set-state-in-effect */
    const timer = window.setTimeout(async () => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      try {
        const params = new URLSearchParams({
          q: trimmed,
          access_token: MAPBOX_TOKEN,
          language: 'tr',
          country: 'tr',
          limit: '8',
          autocomplete: 'true',
          types: 'address,place,poi,locality,neighborhood,street',
        });
        const res = await fetch(`https://api.mapbox.com/search/geocode/v6/forward?${params}`, {
          signal: ctrl.signal,
        });
        if (!res.ok) throw new Error('geocode failed');
        const data = (await res.json()) as { features?: Feature[] };
        setFeatures(data.features ?? []);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') setFeatures([]);
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }, 300);
    return () => window.clearTimeout(timer);
  }, [q]);

  function pick(f: Feature) {
    const ctx = f.properties.context;
    // Mapbox v6 coordinates properties.coordinates'ta veya geometry.coordinates'ta
    const lng = f.properties.coordinates?.longitude ?? f.geometry?.coordinates?.[0];
    const lat = f.properties.coordinates?.latitude ?? f.geometry?.coordinates?.[1];
    if (lat === undefined || lng === undefined) return;

    const address =
      f.properties.full_address ?? f.properties.name ?? f.properties.place_formatted ?? '';
    const city = ctx?.place?.name ?? ctx?.region?.name;
    const district = ctx?.district?.name ?? ctx?.locality?.name;

    onSelect({ address, city, district, lat: Number(lat), lng: Number(lng) });
    setQ(address);
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <input type="hidden" name={name} value={q} />
      <div className="border-border bg-background focus-within:border-foreground/40 inline-flex w-full items-center gap-2 rounded-md border px-3 py-2 transition-colors">
        <Search className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
        <input
          type="text"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="placeholder:text-muted-foreground/70 gidek-no-focus-ring flex-1 bg-transparent text-sm outline-none"
        />
        {loading ? (
          <Loader2 className="text-muted-foreground size-4 shrink-0 animate-spin" aria-hidden="true" />
        ) : null}
      </div>

      {open && q.trim().length >= 3 ? (
        <div
          role="listbox"
          className="border-border bg-background absolute left-0 right-0 z-50 mt-1 max-h-72 overflow-y-auto rounded-xl border p-1 shadow-xl"
        >
          {features.length === 0 && !loading ? (
            <p className="text-muted-foreground px-3 py-4 text-center text-sm">
              Sonuç yok. Daha açık yaz veya manuel doldur.
            </p>
          ) : (
            features.map((f, i) => {
              const ctx = f.properties.context;
              const place = ctx?.district?.name ?? ctx?.locality?.name;
              const main = f.properties.name ?? f.properties.full_address ?? '—';
              const sub =
                f.properties.place_formatted ??
                [place, ctx?.place?.name].filter(Boolean).join(', ');
              return (
                <button
                  key={i}
                  type="button"
                  role="option"
                  aria-selected={false}
                  onClick={() => pick(f)}
                  className={cn(
                    'hover:bg-muted/60 flex w-full items-start gap-2 rounded-md p-2 text-left',
                  )}
                >
                  <MapPin
                    className="text-muted-foreground mt-0.5 size-3.5 shrink-0"
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium leading-tight">{main}</span>
                    {sub ? (
                      <span className="text-muted-foreground block text-xs">{sub}</span>
                    ) : null}
                  </span>
                </button>
              );
            })
          )}
        </div>
      ) : null}
    </div>
  );
}
