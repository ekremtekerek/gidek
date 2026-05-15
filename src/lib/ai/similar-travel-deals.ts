import 'server-only';
import { getServiceClient } from '@/lib/db/service';
import type { DealWithMerchant } from '@/lib/db/queries/deals';
import { TRAVEL_CATEGORY_SLUGS } from '@/lib/db/queries/travel';

/**
 * pgvector embedding similarity ile benzer tatil deal'larını bulur.
 * Kullanılan deal'ın kendi embedding'i alınır, `match_deals` RPC'siyle
 * top 12 benzer deal döner; içinden tatil kategorisinde olanlar +
 * kendisi hariç filtrelenir.
 */

interface SimilarDealRow {
  id: string;
  slug: string;
  title: string;
  city: string;
  district: string | null;
  cover_image: string;
  discounted_price: number;
  original_price: number;
  discount_percent: number;
  rating_avg: number | null;
  rating_count: number;
  similarity: number;
}

export async function fetchSimilarTravelDeals(
  dealId: string,
  limit = 6,
): Promise<SimilarDealRow[]> {
  const supabase = getServiceClient();

  // 1) Kendi embedding'ini al
  const { data: source, error: srcErr } = await supabase
    .from('deals')
    .select('embedding')
    .eq('id', dealId)
    .maybeSingle();

  if (srcErr || !source?.embedding) return [];

  // 2) match_deals RPC ile top 12 benzer
  const { data: matches, error: rpcErr } = await supabase.rpc('match_deals', {
    query_embedding: source.embedding as unknown as string,
    match_count: 12,
    filter_city: null,
  });

  if (rpcErr || !matches) return [];

  // 3) Tatil kategorisinde olanları bul
  const candidateIds = (matches as Array<{ id: string }>)
    .map((m) => m.id)
    .filter((id) => id !== dealId);
  if (candidateIds.length === 0) return [];

  const { data: cats } = await supabase
    .from('deal_categories')
    .select('deal_id, category:categories!inner(slug)')
    .in('deal_id', candidateIds)
    .in('category.slug', TRAVEL_CATEGORY_SLUGS as unknown as string[]);

  const travelIds = new Set((cats ?? []).map((r) => r.deal_id));

  // 4) Sırayla filtrele + limit
  const filtered = (matches as Array<SimilarDealRow & { id: string }>)
    .filter((m) => m.id !== dealId && travelIds.has(m.id))
    .slice(0, limit);

  return filtered;
}

/**
 * Geçerli sayılan rating + cover image alanlarını da çekmek için ek query.
 * `match_deals` RPC bunları döndürmüyorsa fallback.
 */
export async function enrichSimilarDeals(rows: SimilarDealRow[]): Promise<DealWithMerchant[]> {
  if (rows.length === 0) return [];
  const supabase = getServiceClient();
  const ids = rows.map((r) => r.id);
  const { data } = await supabase
    .from('deals')
    .select(
      `*, merchant:merchants ( name, slug, city, district, lat, lng, working_hours )`,
    )
    .in('id', ids);

  if (!data) return [];

  // Match_deals ordering'i koruyalım (similarity order)
  const byId = new Map((data as unknown as DealWithMerchant[]).map((d) => [d.id, d]));
  return ids.map((id) => byId.get(id)).filter(Boolean) as DealWithMerchant[];
}
