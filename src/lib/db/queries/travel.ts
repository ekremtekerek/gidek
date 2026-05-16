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
  /** Bu destinasyondaki tüm tatil deal'larının ortalama yıldız puanı */
  ratingAvg: number | null;
  /** Toplam yorum sayısı */
  reviewCount: number;
}

export async function listTravelDestinations(limit = 8): Promise<TravelDestination[]> {
  const supabase = getPublicClient();

  // Inline JOIN — deal_categories üzerinden travel kategorilerini filtrele.
  // İki-aşamalı `.in('id', [1000+ UUID])` yaklaşımı PostgREST URL limitini
  // aştığı için (~37KB query string) silent fail ediyordu.
  const now = new Date().toISOString();
  const { data: deals } = await supabase
    .from('deals')
    .select(
      'id, city, district, cover_image, discounted_price, rating_avg, rating_count, valid_until, is_active, published_at, deal_categories!inner(category:categories!inner(slug))',
    )
    .in('deal_categories.category.slug', TRAVEL_CATEGORY_SLUGS)
    .eq('is_active', true)
    .gt('valid_until', now)
    .not('published_at', 'is', null)
    .order('discounted_price', { ascending: true })
    .limit(2000);

  // Her destinasyon için rating ağırlıklı ortalama + toplam yorum
  interface Accum {
    dealCount: number;
    coverImage: string | null;
    fromPrice: number | null;
    ratingSum: number;
    ratingWeights: number;
    reviewCount: number;
  }
  const accum = new Map<string, Accum & { city: string; district: string | null }>();

  for (const d of deals ?? []) {
    if (!d.city) continue;
    const key = `${d.city}|${d.district ?? ''}`;
    const reviewCount = d.rating_count ?? 0;
    const rating = d.rating_avg ? Number(d.rating_avg) : null;
    const existing = accum.get(key);
    if (existing) {
      existing.dealCount += 1;
      existing.reviewCount += reviewCount;
      if (rating && reviewCount > 0) {
        existing.ratingSum += rating * reviewCount;
        existing.ratingWeights += reviewCount;
      }
    } else {
      accum.set(key, {
        city: d.city,
        district: d.district,
        dealCount: 1,
        coverImage: d.cover_image,
        fromPrice: Number(d.discounted_price) || null,
        ratingSum: rating && reviewCount > 0 ? rating * reviewCount : 0,
        ratingWeights: rating && reviewCount > 0 ? reviewCount : 0,
        reviewCount,
      });
    }
  }

  const out: TravelDestination[] = [...accum.values()].map((a) => ({
    city: a.city,
    district: a.district,
    dealCount: a.dealCount,
    coverImage: a.coverImage,
    fromPrice: a.fromPrice,
    ratingAvg: a.ratingWeights > 0 ? Number((a.ratingSum / a.ratingWeights).toFixed(1)) : null,
    reviewCount: a.reviewCount,
  }));

  return out.sort((a, b) => b.dealCount - a.dealCount).slice(0, limit);
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

  const now = new Date().toISOString();
  let query = supabase
    .from('deals')
    .select(
      `*, merchant:merchants ( name, slug, city, district, lat, lng, working_hours ), deal_categories!inner(category:categories!inner(slug))`,
    )
    .in('deal_categories.category.slug', TRAVEL_CATEGORY_SLUGS)
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
  const now = new Date().toISOString();
  const { data: deals } = await supabase
    .from('deals')
    .select(
      'city, district, deal_categories!inner(category:categories!inner(slug))',
    )
    .in('deal_categories.category.slug', TRAVEL_CATEGORY_SLUGS)
    .eq('is_active', true)
    .gt('valid_until', now)
    .not('published_at', 'is', null)
    .limit(2000);

  const set = new Set<string>();
  for (const d of deals ?? []) {
    if (d.district) set.add(d.district);
    if (d.city) set.add(d.city);
  }
  return [...set].sort((a, b) => a.localeCompare(b, 'tr'));
}

/**
 * Tatil paketi tasarlamak için bölgedeki TÜM kategorilerden envanter +
 * her deal'ın birincil kategori slug'ı. AI paket builder bunu kullanır
 * — otel, yemek, aktivite, spa hepsi tek listte.
 */
export async function fetchPackageInventory(
  destination: string,
  limit = 60,
): Promise<{ deals: DealWithMerchant[]; categoryByDealId: Map<string, string> }> {
  const supabase = getPublicClient();
  const dest = destination.trim();
  if (!dest) return { deals: [], categoryByDealId: new Map() };

  const now = new Date().toISOString();
  const { data: deals } = await supabase
    .from('deals')
    .select(
      `*, merchant:merchants ( name, slug, city, district, lat, lng, working_hours )`,
    )
    .eq('is_active', true)
    .gt('valid_until', now)
    .not('published_at', 'is', null)
    .or(`city.eq.${dest},district.eq.${dest}`)
    .order('sold_count', { ascending: false })
    .limit(limit);

  const dealList = (deals ?? []) as unknown as DealWithMerchant[];
  if (dealList.length === 0) return { deals: [], categoryByDealId: new Map() };

  const ids = dealList.map((d) => d.id);
  const { data: cats } = await supabase
    .from('deal_categories')
    .select('deal_id, category:categories!inner(slug)')
    .in('deal_id', ids);

  const categoryByDealId = new Map<string, string>();
  for (const row of cats ?? []) {
    if (!row.deal_id) continue;
    const slug = (row as { category: { slug: string } | null }).category?.slug;
    if (slug && !categoryByDealId.has(row.deal_id)) {
      categoryByDealId.set(row.deal_id, slug);
    }
  }

  return { deals: dealList, categoryByDealId };
}

/**
 * Tatil için popüler fırsatlar — landing carousel.
 */
export async function listTravelDeals(limit = 12): Promise<DealWithMerchant[]> {
  const supabase = getPublicClient();
  const now = new Date().toISOString();
  const { data } = await supabase
    .from('deals')
    .select(
      `*, merchant:merchants ( name, slug, city, district, lat, lng, working_hours ), deal_categories!inner(category:categories!inner(slug))`,
    )
    .in('deal_categories.category.slug', TRAVEL_CATEGORY_SLUGS)
    .eq('is_active', true)
    .gt('valid_until', now)
    .not('published_at', 'is', null)
    .order('sold_count', { ascending: false })
    .limit(limit);

  return (data ?? []) as unknown as DealWithMerchant[];
}
