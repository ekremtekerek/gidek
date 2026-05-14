import 'server-only';
import { getPublicClient } from '@/lib/db/public';
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
        working_hours?: MerchantRow['working_hours'];
      })
    | null;
};

export type DealDetailed = DealWithMerchant & {
  categories: { slug: string; name: string }[];
};

const DEAL_SELECT = `
  *,
  merchant:merchants ( name, slug, city, district, lat, lng, working_hours )
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

export async function listDeals({
  categorySlug,
  city,
  tags,
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

  let dealIdsByCategory: string[] | undefined;
  if (categorySlug) {
    const { data: cat, error: catErr } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', categorySlug)
      .eq('is_active', true)
      .maybeSingle();

    if (catErr) throw catErr;
    if (!cat) return [];

    const { data: joins, error: joinErr } = await supabase
      .from('deal_categories')
      .select('deal_id')
      .eq('category_id', cat.id);

    if (joinErr) throw joinErr;
    dealIdsByCategory = (joins ?? []).map((j) => j.deal_id);
    if (dealIdsByCategory.length === 0) return [];
  }

  let query = supabase.from('deals').select(DEAL_SELECT).range(offset, offset + limit - 1);

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

  if (dealIdsByCategory) query = query.in('id', dealIdsByCategory);
  if (city) query = query.eq('city', city);
  if (tags && tags.length > 0) query = query.contains('tags', tags);
  if (audience && audience.length > 0) query = query.overlaps('audience', audience);
  if (minPrice !== undefined) query = query.gte('discounted_price', minPrice);
  if (maxPrice !== undefined) query = query.lte('discounted_price', maxPrice);
  if (featured) query = query.eq('is_featured', true);

  // Yaşam döngüsü filtresi — tüm public listings için varsayılan 'active'.
  const nowIso = new Date().toISOString();
  if (status === 'active') {
    query = query
      .eq('is_active', true)
      .lte('published_at', nowIso)
      .gt('valid_until', nowIso);
  } else if (status === 'expired') {
    // PostgREST .or() içine ISO timestamp koymak kırılgan (`:` ayraçla
    // karışıyor). İki ayrı sorgu yapıp ID seti üzerinden filtre uyguluyoruz.
    const [byTime, byActive] = await Promise.all([
      supabase
        .from('deals')
        .select('id')
        .lte('published_at', nowIso)
        .lte('valid_until', nowIso),
      supabase
        .from('deals')
        .select('id')
        .lte('published_at', nowIso)
        .eq('is_active', false),
    ]);
    const expiredIds = new Set<string>();
    for (const r of byTime.data ?? []) expiredIds.add(r.id);
    for (const r of byActive.data ?? []) expiredIds.add(r.id);
    if (expiredIds.size === 0) return [];
    query = query.in('id', Array.from(expiredIds));
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

export async function getDealsInBounds(
  bounds: Bounds,
  options: { categorySlug?: string; limit?: number } = {},
): Promise<DealWithCoords[]> {
  const supabase = getPublicClient();
  const limit = options.limit ?? 60;

  // Category filter: same pattern as listDeals — resolve dealIds via the
  // deal_categories junction first, then constrain the main query.
  let dealIdsByCategory: string[] | undefined;
  if (options.categorySlug) {
    const { data: cat, error: catErr } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', options.categorySlug)
      .eq('is_active', true)
      .maybeSingle();
    if (catErr) throw catErr;
    if (!cat) return [];

    const { data: joins, error: joinErr } = await supabase
      .from('deal_categories')
      .select('deal_id')
      .eq('category_id', cat.id);
    if (joinErr) throw joinErr;
    dealIdsByCategory = (joins ?? []).map((j) => j.deal_id);
    if (dealIdsByCategory.length === 0) return [];
  }

  const nowIso = new Date().toISOString();
  let query = supabase
    .from('deals')
    .select(
      `
      *,
      merchant:merchants!inner ( name, slug, city, district, lat, lng )
    `,
    )
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

  if (dealIdsByCategory) query = query.in('id', dealIdsByCategory);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as DealWithCoords[];
}
