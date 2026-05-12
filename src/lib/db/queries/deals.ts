import 'server-only';
import { getPublicClient } from '@/lib/db/public';
import type { Database } from '@/types/supabase';

type DealRow = Database['public']['Tables']['deals']['Row'];
type MerchantRow = Database['public']['Tables']['merchants']['Row'];

/**
 * A deal with its merchant joined in. The shape returned by every list/get
 * query in this module so deal cards and detail pages have a single contract.
 */
export type DealWithMerchant = DealRow & {
  merchant: Pick<MerchantRow, 'name' | 'slug' | 'city' | 'district'> | null;
};

export type DealDetailed = DealWithMerchant & {
  categories: { slug: string; name: string }[];
};

const DEAL_SELECT = `
  *,
  merchant:merchants ( name, slug, city, district )
`;

export type DealSort = 'newest' | 'price-asc' | 'price-desc' | 'popular';

export interface ListDealsParams {
  /** Filter by main category slug (joins through deal_categories). */
  categorySlug?: string;
  /** Filter by deal city (case-sensitive match — UI sends the canonical value). */
  city?: string;
  /** Filter by tags — every tag must be present on the deal (AND). */
  tags?: string[];
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
}

export async function listDeals({
  categorySlug,
  city,
  tags,
  minPrice,
  maxPrice,
  featured,
  sort,
  limit = 24,
  offset = 0,
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
  switch (sort) {
    case 'price-asc':
      query = query.order('discounted_price', { ascending: true });
      break;
    case 'price-desc':
      query = query.order('discounted_price', { ascending: false });
      break;
    case 'popular':
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

  if (dealIdsByCategory) query = query.in('id', dealIdsByCategory);
  if (city) query = query.eq('city', city);
  if (tags && tags.length > 0) query = query.contains('tags', tags);
  if (minPrice !== undefined) query = query.gte('discounted_price', minPrice);
  if (maxPrice !== undefined) query = query.lte('discounted_price', maxPrice);
  if (featured) query = query.eq('is_featured', true);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as DealWithMerchant[];
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
  const { data, error } = await supabase.from('deals').select('slug');
  if (error) throw error;
  return (data ?? []).map((d) => d.slug);
}
