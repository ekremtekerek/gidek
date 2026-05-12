import type { DealWithCoords } from '@/lib/db/queries/deals';
import type { MapDeal } from '@/lib/utils/geo';
import type { DealShape } from '@/lib/ai/tools';

/** DealWithCoords (bbox fetch) → MapDeal. Koordinat yoksa null. */
export function dealToMapDeal(d: DealWithCoords): MapDeal | null {
  const lat = d.merchant?.lat;
  const lng = d.merchant?.lng;
  if (lat === null || lat === undefined || lng === null || lng === undefined) return null;
  return {
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
  };
}

/** AI tool sonucu DealShape → MapDeal. Koordinat yoksa null. */
export function aiDealToMapDeal(d: DealShape): MapDeal | null {
  if (d.lat === null || d.lng === null) return null;
  return {
    id: d.id,
    slug: d.slug,
    title: d.title,
    subtitle: d.subtitle || null,
    cover_image: d.coverImage,
    city: d.city,
    district: d.district || null,
    discounted_price: d.price,
    original_price: d.originalPrice,
    discount_percent: d.discountPct,
    lat: d.lat,
    lng: d.lng,
    isAi: true,
  };
}

/**
 * Bbox listesi + AI önerileri birleştir. AI önerileri ID üzerinden öncelik
 * kazanır — aynı ID hem listede hem AI'da varsa AI versiyonu (isAi=true)
 * kalır. Sonuç: tek liste, harita üzerinde duplicate marker yok.
 */
export function mergeMapDeals(
  baseDeals: DealWithCoords[],
  aiDeals: DealShape[] | null,
): MapDeal[] {
  const out = new Map<string, MapDeal>();
  for (const d of baseDeals) {
    const m = dealToMapDeal(d);
    if (m) out.set(m.id, m);
  }
  if (aiDeals) {
    for (const d of aiDeals) {
      const m = aiDealToMapDeal(d);
      if (m) out.set(m.id, m);
    }
  }
  return [...out.values()];
}
