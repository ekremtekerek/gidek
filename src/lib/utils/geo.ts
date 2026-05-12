/**
 * Geo yardımcıları. Hem seed (mock koordinat üretimi) hem harita
 * bileşenleri (default merkez, "yakınımdaki" sıralama) buradan beslenir.
 */

export type LatLng = { lat: number; lng: number };

export const ISTANBUL_CENTER: LatLng = { lat: 41.0082, lng: 28.9784 };

export const CITY_CENTROIDS: Record<string, LatLng> = {
  İstanbul: { lat: 41.0082, lng: 28.9784 },
  Ankara: { lat: 39.9334, lng: 32.8597 },
  İzmir: { lat: 38.4192, lng: 27.1287 },
  Antalya: { lat: 36.8969, lng: 30.7133 },
  Bursa: { lat: 40.1828, lng: 29.067 },
  Adana: { lat: 37.0, lng: 35.3213 },
  Eskişehir: { lat: 39.7767, lng: 30.5206 },
  Muğla: { lat: 37.2153, lng: 28.3636 },
  Aydın: { lat: 37.8444, lng: 27.8458 },
  Çanakkale: { lat: 40.1553, lng: 26.4142 },
  Trabzon: { lat: 41.0027, lng: 39.7168 },
  Konya: { lat: 37.8716, lng: 32.4847 },
  Gaziantep: { lat: 37.0594, lng: 37.3825 },
  Nevşehir: { lat: 38.6244, lng: 34.7236 },
  Kayseri: { lat: 38.7322, lng: 35.4853 },
};

/** Haversine — iki nokta arası kilometre cinsinden mesafe. */
export function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const x =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(x));
}

/** Map bounds tipi — Mapbox'tan gelen NE/SW corner'lar. */
export type Bounds = {
  ne: LatLng;
  sw: LatLng;
};

export function isValidBounds(b: Bounds): boolean {
  return b.ne.lat > b.sw.lat && b.ne.lng > b.sw.lng;
}

/**
 * Harita marker/popup için minimal deal şekli. Hem bbox-fetched DealWithCoords
 * hem AI tool'larından dönen DealShape buna dönüştürülerek tek bir tipte
 * render edilir. `isAi` flag'i AI önerisi olanları farklı stilize etmek için.
 */
export interface MapDeal {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  cover_image: string;
  city: string;
  district: string | null;
  discounted_price: number;
  original_price: number;
  discount_percent: number;
  lat: number;
  lng: number;
  isAi?: boolean;
}
