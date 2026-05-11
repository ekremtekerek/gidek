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

const DEAL_SELECT = `
  *,
  merchant:merchants ( name, slug, city, district )
`;

export interface ListDealsParams {
  /** Filter by main category slug (joins through deal_categories). */
  categorySlug?: string;
  /** Filter by deal city (case-sensitive match — UI sends the canonical value). */
  city?: string;
  /** When true, return only deals marked featured (and active). */
  featured?: boolean;
  /** Page size cap. Default 24. */
  limit?: number;
  /** Offset for simple pagination. */
  offset?: number;
}

export async function listDeals({
  categorySlug,
  city,
  featured,
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

  let query = supabase
    .from('deals')
    .select(DEAL_SELECT)
    .order('sort_priority', { ascending: false })
    .order('published_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (dealIdsByCategory) query = query.in('id', dealIdsByCategory);
  if (city) query = query.eq('city', city);
  if (featured) query = query.eq('is_featured', true);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as DealWithMerchant[];
}

export async function getDealBySlug(slug: string): Promise<DealWithMerchant | null> {
  const supabase = getPublicClient();
  const { data, error } = await supabase
    .from('deals')
    .select(DEAL_SELECT)
    .eq('slug', slug)
    .maybeSingle();

  if (error) throw error;
  return data as unknown as DealWithMerchant | null;
}

export async function listPublishedDealSlugs(): Promise<string[]> {
  const supabase = getPublicClient();
  const { data, error } = await supabase.from('deals').select('slug');
  if (error) throw error;
  return (data ?? []).map((d) => d.slug);
}
