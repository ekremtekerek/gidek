// Mapbox Geocoding — affiliate deal'lerinin tam adresini kesin koordinata
// çevirir (latLngs vermeyen browse deal'leri + tüm etkinlikler için "nokta
// atışı" harita konumu). Sadece sync script'inde (Node) çalışır.
import type { LatLng } from '@/lib/utils/geo';

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '';

export function hasGeocoder(): boolean {
  return TOKEN.length > 0;
}

/**
 * Adresi Türkiye sınırında tek sonuçla geocode eder. Başarısızsa null.
 * Mapbox `center` [lng, lat] sırasıyla döner.
 */
export async function geocodeAddress(query: string): Promise<LatLng | null> {
  const q = query.trim();
  if (!TOKEN || q.length < 4) return null;
  const url =
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json` +
    `?access_token=${TOKEN}&country=tr&language=tr&limit=1&types=address,poi,place,locality,neighborhood`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = (await res.json()) as { features?: { center?: [number, number] }[] };
    const center = json.features?.[0]?.center;
    if (!center || center.length !== 2) return null;
    const [lng, lat] = center;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng };
  } catch {
    return null;
  }
}
