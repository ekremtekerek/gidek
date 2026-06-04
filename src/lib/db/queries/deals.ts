import 'server-only';
import { unstable_cache } from 'next/cache';
import { getPublicClient } from '@/lib/db/public';
import { CATEGORY_SUBCATEGORIES } from '@/lib/utils/constants';
import type { Bounds } from '@/lib/utils/geo';
import type { Database } from '@/types/supabase';

type DealRow = Database['public']['Tables']['deals']['Row'];
type MerchantRow = Database['public']['Tables']['merchants']['Row'];

/**
 * A deal with its merchant joined in. The shape returned by every list/get
 * query in this module so deal cards and detail pages have a single contract.
 */
export type DealWithMerchant = DealRow & {
  merchant:
    | (Pick<MerchantRow, 'name' | 'slug' | 'city' | 'district'> & {
        lat: number | null;
        lng: number | null;
        address?: string | null;
        working_hours?: MerchantRow['working_hours'];
      })
    | null;
};

export type DealDetailed = DealWithMerchant & {
  categories: { slug: string; name: string }[];
};

const DEAL_SELECT = `
  *,
  merchant:merchants ( name, slug, city, district, address, lat, lng, working_hours )
`;

export type DealSort = 'newest' | 'price-asc' | 'price-desc' | 'popular' | 'trending';

/**
 * Yaşam döngüsü filtresi:
 * - 'active' (varsayılan): is_active=true, valid_until>now, published_at<=now.
 *   Anasayfa, kategori sayfaları, harita ve API her zaman bunu kullanır.
 * - 'expired': süresi dolmuş VEYA admin tarafından deaktive edilmiş ama
 *   bir kez yayınlanmış. /gecmis-firsatlar arşiv sayfası için.
 * - 'all': bir kez yayınlanmış olan her şey — sitemap için.
 */
export type DealStatus = 'active' | 'expired' | 'all';

export interface ListDealsParams {
  /** Filter by main category slug (joins through deal_categories). */
  categorySlug?: string;
  /** Filter by deal city (case-sensitive match — UI sends the canonical value). */
  city?: string;
  /** Filter by tags — every tag must be present on the deal (AND). */
  tags?: string[];
  /** Alt kategori filtresi — affiliate `external_tags` içinde bu değer olmalı. */
  externalTag?: string;
  /**
   * Filter by audience — kullanıcı en az birini seçtiyse, deal'ın audience
   * dizisinin verilen liste ile kesişimi varsa eşleşir (overlaps).
   */
  audience?: string[];
  /** Inclusive lower bound on discounted_price. */
  minPrice?: number;
  /** Inclusive upper bound on discounted_price. */
  maxPrice?: number;
  /** When true, return only deals marked featured (and active). */
  featured?: boolean;
  /** Sort key. Defaults to newest (published_at desc with sort_priority). */
  sort?: DealSort;
  /** Page size cap. Default 24. */
  limit?: number;
  /** Offset for simple pagination. */
  offset?: number;
  /** Yaşam döngüsü filtresi — varsayılan 'active'. */
  status?: DealStatus;
}

// Geriye uyum: server tarafından da kullanılabilsin diye re-export.
export { isDealExpired } from '@/lib/utils/deal-status';

async function fetchDeals({
  categorySlug,
  city,
  tags,
  externalTag,
  audience,
  minPrice,
  maxPrice,
  featured,
  sort,
  limit = 24,
  offset = 0,
  status = 'active',
}: ListDealsParams = {}): Promise<DealWithMerchant[]> {
  const supabase = getPublicClient();

  // Kategori filtresi: inline `!inner` JOIN (deal_categories → categories.slug).
  // Eski iki-aşamalı `.in('id', [yüzlerce UUID])` yaklaşımı PostgREST URL
  // limitini aşıp 414 "URI too long" veriyordu (ör. tiyatro 194 deal).
  const selectStr = categorySlug
    ? `${DEAL_SELECT}, deal_categories!inner ( category:categories!inner ( slug ) )`
    : DEAL_SELECT;

  let query = supabase
    .from('deals')
    .select(selectStr)
    .range(offset, offset + limit - 1);

  // Sorting — chained .order() calls compose into a multi-column sort.
  // `id` tiebreaker her zaman en sonda: ties durumunda Postgres'in nondeterministic
  // sıralaması nedeniyle paginated query'lerde page boundaries'te overlap oluşmasın.
  // NOT: 'trending' burada DB tarafında ORDER edilemiyor (PostgREST function
  // çağrısı desteklemiyor). DB'den 'popular' gibi geniş çek, dönerken JS'te
  // trending_score ile yeniden sırala. Bu sayede SQL function ile aynı formül.
  const useTrending = sort === 'trending';
  switch (sort) {
    case 'price-asc':
      query = query.order('discounted_price', { ascending: true });
      break;
    case 'price-desc':
      query = query.order('discounted_price', { ascending: false });
      break;
    case 'popular':
    case 'trending':
      // Trending JS'te yeniden sıralanacak; ön-sıralama view+sold (geniş net).
      query = query
        .order('view_count', { ascending: false })
        .order('sold_count', { ascending: false });
      break;
    case 'newest':
    default:
      query = query
        .order('sort_priority', { ascending: false })
        .order('published_at', { ascending: false });
  }
  query = query.order('id', { ascending: true });

  if (categorySlug) query = query.eq('deal_categories.category.slug', categorySlug);
  if (city) query = query.eq('city', city);
  if (tags && tags.length > 0) query = query.contains('tags', tags);
  if (externalTag) query = query.contains('external_tags', [externalTag]);
  if (audience && audience.length > 0) query = query.overlaps('audience', audience);
  if (minPrice !== undefined) query = query.gte('discounted_price', minPrice);
  if (maxPrice !== undefined) query = query.lte('discounted_price', maxPrice);
  if (featured) query = query.eq('is_featured', true);

  // Yaşam döngüsü filtresi — tüm public listings için varsayılan 'active'.
  const nowIso = new Date().toISOString();
  if (status === 'active') {
    query = query.eq('is_active', true).lte('published_at', nowIso).gt('valid_until', nowIso);
  } else if (status === 'expired') {
    // Süresi dolmuş VEYA deaktive edilmiş (ama bir kez yayınlanmış). Filtre
    // tamamen deals kolonları üzerinde → tek sorgu. ISO timestamp'in `:`/`.`
    // karakterleri PostgREST .or() ayracıyla karışmasın diye değer çift tırnak
    // içinde verilir. (Eski iki-sorgu + `.in('id', [...])` affiliate ölçeğinde
    // 414 "URI too long" veriyordu.)
    query = query.lte('published_at', nowIso).or(`valid_until.lte."${nowIso}",is_active.eq.false`);
  } else {
    // 'all' — yayınlanmış her şey
    query = query.lte('published_at', nowIso);
  }

  const { data, error } = await query;
  if (error) throw error;
  const rows = (data ?? []) as unknown as DealWithMerchant[];

  if (useTrending) {
    return rows
      .map((d) => ({ deal: d, score: trendingScore(d) }))
      .sort((a, b) => b.score - a.score)
      .map((x) => x.deal);
  }
  return rows;
}

/**
 * Aynı liste sorgusu (anasayfa, kategori) tekrar tekrar DB'ye gitmesin — param
 * kombinasyonu başına 5 dk cache. TTFB düşer; affiliate sync sonrası en geç
 * 5 dk'da tazelenir. (unstable_cache args'ı serialize edip anahtar üretir.)
 */
export const listDeals = unstable_cache(fetchDeals, ['list-deals'], {
  revalidate: 300,
  tags: ['deals'],
});

/**
 * SQL public.deal_trending_score ile birebir aynı formül — DB tarafından
 * sıralama yapamadığımız için (PostgREST function ORDER BY desteklemiyor)
 * JS tarafında yeniden sıralıyoruz. View + sold + 14 günlük yarı-ömür.
 */
function trendingScore(d: {
  view_count: number | null;
  sold_count: number | null;
  published_at: string | null;
}): number {
  const v = Number(d.view_count ?? 0);
  const s = Number(d.sold_count ?? 0);
  let recency = 0;
  if (d.published_at) {
    const ageSec = (Date.now() - new Date(d.published_at).getTime()) / 1000;
    if (ageSec >= 0) recency = 50 * Math.exp(-ageSec / (14 * 86400));
  }
  return v + s * 5 + recency;
}

export async function getDealBySlug(slug: string): Promise<DealDetailed | null> {
  const supabase = getPublicClient();
  const { data, error } = await supabase
    .from('deals')
    .select(`${DEAL_SELECT}, deal_categories ( category:categories ( slug, name ) )`)
    .eq('slug', slug)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const raw = data as unknown as DealWithMerchant & {
    deal_categories: { category: { slug: string; name: string } | null }[] | null;
  };

  const categories = (raw.deal_categories ?? [])
    .map((dc) => dc.category)
    .filter((c): c is { slug: string; name: string } => c !== null);

  const { deal_categories: _omit, ...rest } = raw;
  void _omit;
  return { ...rest, categories };
}

/**
 * Aynı işletmenin diğer aktif fırsatları (detay sayfası "İşletmenin Diğer
 * Fırsatları" bloğu). Mevcut deal hariç.
 */
export async function getDealsByMerchant(
  merchantId: string,
  excludeDealId: string,
  limit = 4,
): Promise<DealWithMerchant[]> {
  const supabase = getPublicClient();
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from('deals')
    .select(DEAL_SELECT)
    .eq('merchant_id', merchantId)
    .neq('id', excludeDealId)
    .eq('is_active', true)
    .lte('published_at', nowIso)
    .gt('valid_until', nowIso)
    .order('sort_priority', { ascending: false })
    .order('published_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as unknown as DealWithMerchant[];
}

/**
 * Slug listesine göre aktif fırsatlar — "İncelediğiniz Fırsatlar" (recently
 * viewed) client component'i kısa bir slug listesi gönderir. Sıra korunur.
 */
export async function getDealsBySlugs(slugs: string[]): Promise<DealWithMerchant[]> {
  if (slugs.length === 0) return [];
  const supabase = getPublicClient();
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from('deals')
    .select(DEAL_SELECT)
    .in('slug', slugs.slice(0, 20))
    .eq('is_active', true)
    .lte('published_at', nowIso)
    .gt('valid_until', nowIso);
  if (error) throw error;
  const rows = (data ?? []) as unknown as DealWithMerchant[];
  // İstenen slug sırasını koru.
  const order = new Map(slugs.map((s, i) => [s, i]));
  return rows.sort((a, b) => (order.get(a.slug) ?? 0) - (order.get(b.slug) ?? 0));
}

export interface CategoryMenuItem {
  slug: string;
  name: string;
  /** Alt kategoriler — `external_tags` değerleri (CATEGORY_SUBCATEGORIES). */
  subtags: readonly string[];
}

/**
 * Header mega-menüsü: aktif fırsatı olan ana kategoriler (sıralı) + her birinin
 * küratörlü alt kategorileri (`CATEGORY_SUBCATEGORIES`). Kategori listesi
 * DB'den gelir (boş kategori menüde görünmez); alt kategoriler sabit haritadan
 * — değerler `deals.external_tags` ile birebir eşleşir, link `?alt=<tag>`.
 * unstable_cache ile saatlik cache (her sayfada header render olur).
 */
export const getCategoryMenu = unstable_cache(
  async (): Promise<CategoryMenuItem[]> => {
    const supabase = getPublicClient();
    const nowIso = new Date().toISOString();
    const { data, error } = await supabase
      .from('deals')
      .select('deal_categories!inner ( category:categories!inner ( slug, name, sort_order ) )')
      .eq('is_active', true)
      .lte('published_at', nowIso)
      .gt('valid_until', nowIso)
      .limit(3000);
    if (error) throw error;

    type Row = {
      deal_categories:
        | { category: { slug: string; name: string; sort_order: number } | null }[]
        | null;
    };
    const cats = new Map<string, { name: string; sort: number }>();
    for (const row of (data ?? []) as Row[]) {
      for (const dc of row.deal_categories ?? []) {
        const c = dc.category;
        if (c && !cats.has(c.slug)) cats.set(c.slug, { name: c.name, sort: c.sort_order ?? 0 });
      }
    }

    return [...cats.entries()]
      .sort((a, b) => a[1].sort - b[1].sort)
      .map(([slug, e]) => ({
        slug,
        name: e.name,
        subtags: CATEGORY_SUBCATEGORIES[slug] ?? [],
      }));
  },
  ['category-menu'],
  { revalidate: 3600, tags: ['category-menu'] },
);

export async function listPublishedDealSlugs(): Promise<string[]> {
  const supabase = getPublicClient();
  // Sitemap için bir kez yayınlanmış (published_at <= now) her deal'ın
  // slug'ı yeterli — süresi dolmuş olanlar da arşiv olarak SEO yer kazanır.
  const { data, error } = await supabase
    .from('deals')
    .select('slug')
    .lte('published_at', new Date().toISOString());
  if (error) throw error;
  return (data ?? []).map((d) => d.slug);
}

/**
 * Harita için: belirli bir bbox içindeki merchant'lara ait fırsatlar.
 * `merchant:merchants!inner` ile JOIN, lat/lng filtreleri PostgREST embedded
 * filter syntax'ı (`merchant.lat`) ile çalıştırılır.
 */
export type DealWithCoords = DealWithMerchant & {
  merchant:
    | (Pick<MerchantRow, 'name' | 'slug' | 'city' | 'district'> & {
        lat: number | null;
        lng: number | null;
      })
    | null;
};

async function fetchDealsInBounds(
  bounds: Bounds,
  options: { categorySlug?: string; limit?: number } = {},
): Promise<DealWithCoords[]> {
  const supabase = getPublicClient();
  const limit = options.limit ?? 60;

  // Kategori filtresi: inline `!inner` JOIN — listDeals ile aynı. Eski iki
  // aşamalı `.in('id', [...])` PostgREST URL limitini aşıyordu (414).
  const selectStr = options.categorySlug
    ? `*, merchant:merchants!inner ( name, slug, city, district, lat, lng ), deal_categories!inner ( category:categories!inner ( slug ) )`
    : `*, merchant:merchants!inner ( name, slug, city, district, lat, lng )`;

  const nowIso = new Date().toISOString();
  let query = supabase
    .from('deals')
    .select(selectStr)
    .filter('merchant.lat', 'gte', bounds.sw.lat)
    .filter('merchant.lat', 'lte', bounds.ne.lat)
    .filter('merchant.lng', 'gte', bounds.sw.lng)
    .filter('merchant.lng', 'lte', bounds.ne.lng)
    // Harita yalnızca aktif fırsatları gösterir — arşiv haritada yok.
    .eq('is_active', true)
    .lte('published_at', nowIso)
    .gt('valid_until', nowIso)
    .order('sort_priority', { ascending: false })
    .order('published_at', { ascending: false })
    .limit(limit);

  if (options.categorySlug) query = query.eq('deal_categories.category.slug', options.categorySlug);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as DealWithCoords[];
}

/**
 * Harita bbox sorgusu — anasayfa hero haritası her yüklemede çağırır. Bbox
 * başına 2 dk cache: homepage TTFB düşer, harita panning'de kısa süreli stale
 * kabul edilebilir (fırsatlar dakikalık değişmez).
 */
export const getDealsInBounds = unstable_cache(fetchDealsInBounds, ['deals-in-bounds'], {
  revalidate: 120,
  tags: ['deals'],
});
