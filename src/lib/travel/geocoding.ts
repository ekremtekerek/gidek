/**
 * Mapbox Geocoding API ile Türkiye yer adı autocomplete.
 * Şehir, ilçe, mahalle, semt — public Mapbox token (NEXT_PUBLIC_MAPBOX_TOKEN)
 * ile client-side çağrılır. Server proxy gerekmez; rate limit Mapbox tarafı.
 *
 * Sonuçlar Türkiye odaklı (country=tr, language=tr) ve relevance sırasına göre.
 */

export interface GeocodeResult {
  /** Görünür ad — "Bodrum, Muğla" gibi */
  label: string;
  /** Sadece yer adı — "Bodrum" */
  short: string;
  /** lat/lng — ileride harita için */
  lat?: number;
  lng?: number;
  /** Mapbox tipi (place, locality, neighborhood, district) */
  kind?: string;
}

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

/**
 * Mapbox Geocoding forward search. Boş veya çok kısa query için boş döner.
 *
 * @param query — kullanıcının yazdığı metin
 * @param signal — abort controller (debounced fetch cancel için)
 */
export async function searchPlaces(
  query: string,
  signal?: AbortSignal,
): Promise<GeocodeResult[]> {
  const q = query.trim();
  if (q.length < 2 || !TOKEN) return [];

  const url = new URL(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json`,
  );
  url.searchParams.set('access_token', TOKEN);
  url.searchParams.set('country', 'tr');
  url.searchParams.set('language', 'tr');
  url.searchParams.set('types', 'place,locality,neighborhood,district,region');
  url.searchParams.set('autocomplete', 'true');
  url.searchParams.set('limit', '8');

  try {
    const r = await fetch(url.toString(), { signal });
    if (!r.ok) return [];
    const json = (await r.json()) as {
      features?: Array<{
        text?: string;
        place_name?: string;
        center?: [number, number];
        place_type?: string[];
      }>;
    };
    const out: GeocodeResult[] = [];
    for (const f of json.features ?? []) {
      if (!f.text) continue;
      const short = f.text;
      const label = f.place_name?.replace(/, Türkiye$/, '') ?? short;
      const [lng, lat] = f.center ?? [];
      out.push({
        short,
        label,
        lat,
        lng,
        kind: f.place_type?.[0],
      });
    }
    return out;
  } catch (err) {
    if (err instanceof Error && err.name !== 'AbortError') {
      console.error('[geocoding] fetch failed:', err);
    }
    return [];
  }
}
