import 'server-only';

/**
 * Server-side reverse geocode — verilen koordinatı Mapbox v6 ile en yakın
 * district/place'e çevirir. Chat AI'ya kullanıcının semt bilgisini sunmak
 * için kullanıyoruz; başka bir yere taşımadan önce burayı genişlet.
 *
 * Hatalı/timeout durumda null döner — caller daima fallback'e düşmeli.
 * Token: NEXT_PUBLIC_MAPBOX_TOKEN (server-side fetch de aynı token'ı kabul
 * ediyor, ayrı bir secret token tutmuyoruz).
 */
export interface ReverseGeocodeResult {
  city: string | null;
  district: string | null;
  /** "Maltepe, İstanbul" formatında insan-okunur kısa ad. */
  label: string;
}

interface Feature {
  properties: {
    name?: string;
    place_formatted?: string;
    feature_type?: string;
    context?: {
      place?: { name?: string };
      region?: { name?: string };
      district?: { name?: string };
      locality?: { name?: string };
      neighborhood?: { name?: string };
    };
  };
}

const cache = new Map<string, ReverseGeocodeResult | null>();
const CACHE_MAX = 200;

function keyFor(lat: number, lng: number): string {
  // ~110m precision — yakın koordinatları aynı anahtarda topla.
  return `${lat.toFixed(3)},${lng.toFixed(3)}`;
}

export async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<ReverseGeocodeResult | null> {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token) return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const key = keyFor(lat, lng);
  if (cache.has(key)) return cache.get(key) ?? null;

  const params = new URLSearchParams({
    longitude: String(lng),
    latitude: String(lat),
    access_token: token,
    language: 'tr',
    types: 'neighborhood,district,locality,place',
    limit: '1',
  });

  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 1500);
    const res = await fetch(
      `https://api.mapbox.com/search/geocode/v6/reverse?${params}`,
      { signal: ctrl.signal, cache: 'no-store' },
    );
    clearTimeout(timer);
    if (!res.ok) {
      remember(key, null);
      return null;
    }
    const data = (await res.json()) as { features?: Feature[] };
    const f = data.features?.[0];
    if (!f) {
      remember(key, null);
      return null;
    }
    const ctx = f.properties.context;
    const district =
      ctx?.district?.name ?? ctx?.locality?.name ?? ctx?.neighborhood?.name ?? null;
    const city = ctx?.place?.name ?? ctx?.region?.name ?? null;
    const result: ReverseGeocodeResult = {
      city,
      district,
      label: [district, city].filter(Boolean).join(', ') || (f.properties.name ?? 'bilinmeyen'),
    };
    remember(key, result);
    return result;
  } catch {
    remember(key, null);
    return null;
  }
}

function remember(key: string, value: ReverseGeocodeResult | null) {
  if (cache.size >= CACHE_MAX) {
    const first = cache.keys().next().value;
    if (first !== undefined) cache.delete(first);
  }
  cache.set(key, value);
}
