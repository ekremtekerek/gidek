import 'server-only';
import { getPublicClient } from '@/lib/db/public';
import type { Database } from '@/types/supabase';
import { type DealWithMerchant } from '@/lib/db/queries/deals';

type MerchantRow = Database['public']['Tables']['merchants']['Row'];

export type MerchantDetail = MerchantRow & {
  deal_count: number;
  avg_rating: number | null;
  rating_count: number;
};

/**
 * Slug'a göre tek bir merchant + agregat istatistikler (aktif fırsat sayısı,
 * ortalama puan tüm fırsatlarından, toplam yorum sayısı).
 */
export async function getMerchantBySlug(slug: string): Promise<MerchantDetail | null> {
  const supabase = getPublicClient();

  const { data: merchant, error } = await supabase
    .from('merchants')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();

  if (error || !merchant) return null;

  // Aktif fırsat sayısı + ortalama puan agregesi.
  const { data: deals, error: dErr } = await supabase
    .from('deals')
    .select('id, rating_avg, rating_count')
    .eq('merchant_id', merchant.id)
    .eq('is_active', true);

  if (dErr) {
    return { ...merchant, deal_count: 0, avg_rating: null, rating_count: 0 };
  }

  const dealCount = deals?.length ?? 0;
  let totalRatingSum = 0;
  let totalRatingCount = 0;
  for (const d of deals ?? []) {
    const c = d.rating_count ?? 0;
    const a = d.rating_avg ? Number(d.rating_avg) : null;
    if (a !== null && c > 0) {
      totalRatingSum += a * c;
      totalRatingCount += c;
    }
  }

  return {
    ...merchant,
    deal_count: dealCount,
    avg_rating: totalRatingCount > 0 ? Number((totalRatingSum / totalRatingCount).toFixed(2)) : null,
    rating_count: totalRatingCount,
  };
}

/** Bir merchant'ın aktif tüm fırsatları, normal sıralamada. */
export async function listDealsForMerchant(
  merchantId: string,
  limit = 24,
): Promise<DealWithMerchant[]> {
  // listDeals'i tekrar kullanabilirdik ama merchant filter parametresi yok;
  // doğrudan bir query açmak daha temiz ve tek select.
  const supabase = getPublicClient();
  const { data, error } = await supabase
    .from('deals')
    .select(
      `
      *,
      merchant:merchants ( name, slug, city, district, lat, lng )
    `,
    )
    .eq('merchant_id', merchantId)
    .order('sort_priority', { ascending: false })
    .order('published_at', { ascending: false })
    .order('id', { ascending: true })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as unknown as DealWithMerchant[];
}

/** Sitemap için yayında olan tüm merchant slug'ları. */
export async function listPublishedMerchantSlugs(): Promise<string[]> {
  const supabase = getPublicClient();
  const { data, error } = await supabase
    .from('merchants')
    .select('slug')
    .eq('is_active', true);
  if (error) throw error;
  return (data ?? []).map((m) => m.slug);
}
