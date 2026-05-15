import 'server-only';
import { getPublicClient } from '@/lib/db/public';
import type { DealWithMerchant } from '@/lib/db/queries/deals';

/**
 * Tatil dünyası için curated query'ler. `/tatil` route'unun beslenmesi
 * için kullanılır — mevcut deals tablosundaki tatil/otel/tur kategorilerini
 * filtreler, ayrı bir entity yaratmaz.
 *
 * Tatil tetikleyici kategoriler: tatil-otelleri, sehir-otelleri, turlar.
 */

export const TRAVEL_CATEGORY_SLUGS = [
  'tatil-otelleri',
  'sehir-otelleri',
  'turlar',
] as const;

/**
 * Popüler tatil destinasyonları — district bazında otel/tur sayısı.
 * Tatil landing'inde "Destinasyonlar" grid'i için.
 */
export interface TravelDestination {
  city: string;
  district: string | null;
  dealCount: number;
  /** Bu destinasyondan en güzel kapak görseli */
  coverImage: string | null;
  /** Bu destinasyonun en düşük tatil fiyatı (kişi başı tahminî) */
  fromPrice: number | null;
}

export async function listTravelDestinations(limit = 8): Promise<TravelDestination[]> {
  const supabase = getPublicClient();

  // Önce tatil kategorisindeki tüm deal_id'leri çek
  const { data: dealCats } = await supabase
    .from('deal_categories')
    .select('deal_id, category:categories!inner(slug)')
    .in('category.slug', TRAVEL_CATEGORY_SLUGS);

  const travelDealIds = [
    ...new Set((dealCats ?? []).map((r) => r.deal_id).filter(Boolean)),
  ];
  if (travelDealIds.length === 0) return [];

  // Sonra bu deal'ları çek + district'e göre grupla
  const now = new Date().toISOString();
  const { data: deals } = await supabase
    .from('deals')
    .select('id, city, district, cover_image, discounted_price, valid_until, is_active, published_at')
    .in('id', travelDealIds)
    .eq('is_active', true)
    .gt('valid_until', now)
    .not('published_at', 'is', null)
    .order('discounted_price', { ascending: true });

  const grouped = new Map<string, TravelDestination>();
  for (const d of deals ?? []) {
    if (!d.city) continue;
    const key = `${d.city}|${d.district ?? ''}`;
    const existing = grouped.get(key);
    if (existing) {
      existing.dealCount += 1;
    } else {
      grouped.set(key, {
        city: d.city,
        district: d.district,
        dealCount: 1,
        coverImage: d.cover_image,
        fromPrice: Number(d.discounted_price) || null,
      });
    }
  }

  return [...grouped.values()]
    .sort((a, b) => b.dealCount - a.dealCount)
    .slice(0, limit);
}

export interface TravelSearchParams {
  destination?: string;
  /** En düşük kişi başı fiyat */
  minPrice?: number;
  /** En yüksek kişi başı fiyat */
  maxPrice?: number;
  /** Sıralama anahtarı */
  sort?: 'recommended' | 'price-asc' | 'price-desc' | 'discount';
  limit?: number;
}

/**
 * Filtrelenmiş tatil aramaları. UI tarafı (feature/concept/stars) zaten
 * enrich.ts ile post-filter; bu fonksiyon sadece DB-level filtreleri yapar
 * (destinasyon, fiyat, sıralama).
 */
export async function searchTravelDeals(
  params: TravelSearchParams = {},
): Promise<DealWithMerchant[]> {
  const supabase = getPublicClient();
  const limit = Math.min(60, Math.max(1, params.limit ?? 36));

  const { data: dealCats } = await supabase
    .from('deal_categories')
    .select('deal_id, category:categories!inner(slug)')
    .in('category.slug', TRAVEL_CATEGORY_SLUGS);
  const travelDealIds = [
    ...new Set((dealCats ?? []).map((r) => r.deal_id).filter(Boolean)),
  ];
  if (travelDealIds.length === 0) return [];

  const now = new Date().toISOString();
  let query = supabase
    .from('deals')
    .select(
      `*, merchant:merchants ( name, slug, city, district, lat, lng, working_hours )`,
    )
    .in('id', travelDealIds)
    .eq('is_active', true)
    .gt('valid_until', now)
    .not('published_at', 'is', null);

  // Destinasyon — city veya district eşleşmesi
  if (params.destination && params.destination.trim().length > 0) {
    const d = params.destination.trim();
    query = query.or(`city.eq.${d},district.eq.${d}`);
  }
  if (typeof params.minPrice === 'number') {
    query = query.gte('discounted_price', params.minPrice);
  }
  if (typeof params.maxPrice === 'number') {
    query = query.lte('discounted_price', params.maxPrice);
  }

  switch (params.sort) {
    case 'price-asc':
      query = query.order('discounted_price', { ascending: true });
      break;
    case 'price-desc':
      query = query.order('discounted_price', { ascending: false });
      break;
    case 'discount':
      query = query.order('discount_percent', { ascending: false });
      break;
    default:
      query = query
        .order('sold_count', { ascending: false })
        .order('discount_percent', { ascending: false });
  }

  const { data } = await query.limit(limit);
  return (data ?? []) as unknown as DealWithMerchant[];
}

/**
 * Mevcut destinasyon listesi (district + city kombinasyonları).
 * Arama formundaki autocomplete için.
 */
export async function listTravelLocations(): Promise<string[]> {
  const supabase = getPublicClient();
  const { data: dealCats } = await supabase
    .from('deal_categories')
    .select('deal_id, category:categories!inner(slug)')
    .in('category.slug', TRAVEL_CATEGORY_SLUGS);
  const travelDealIds = [
    ...new Set((dealCats ?? []).map((r) => r.deal_id).filter(Boolean)),
  ];
  if (travelDealIds.length === 0) return [];

  const now = new Date().toISOString();
  const { data: deals } = await supabase
    .from('deals')
    .select('city, district')
    .in('id', travelDealIds)
    .eq('is_active', true)
    .gt('valid_until', now)
    .not('published_at', 'is', null);

  const set = new Set<string>();
  for (const d of deals ?? []) {
    if (d.district) set.add(d.district);
    if (d.city) set.add(d.city);
  }
  return [...set].sort((a, b) => a.localeCompare(b, 'tr'));
}

/**
 * Tatil için popüler fırsatlar — landing carousel.
 */
export async function listTravelDeals(limit = 12): Promise<DealWithMerchant[]> {
  const supabase = getPublicClient();

  const { data: dealCats } = await supabase
    .from('deal_categories')
    .select('deal_id, category:categories!inner(slug)')
    .in('category.slug', TRAVEL_CATEGORY_SLUGS);

  const travelDealIds = [
    ...new Set((dealCats ?? []).map((r) => r.deal_id).filter(Boolean)),
  ];
  if (travelDealIds.length === 0) return [];

  const now = new Date().toISOString();
  const { data } = await supabase
    .from('deals')
    .select(
      `*, merchant:merchants ( name, slug, city, district, lat, lng, working_hours )`,
    )
    .in('id', travelDealIds)
    .eq('is_active', true)
    .gt('valid_until', now)
    .not('published_at', 'is', null)
    .order('sold_count', { ascending: false })
    .limit(limit);

  return (data ?? []) as unknown as DealWithMerchant[];
}
