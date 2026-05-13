import { embed, toPgVector } from '@/lib/ai/embeddings';
import { getServiceClient } from '@/lib/db/service';

/**
 * Pure RAG search — embed the query, ask Postgres to rank by cosine
 * similarity, return shaped deals. No auth, no rate limit, no Gemini
 * ranking pass: the chat AI consumes the results itself and reasons over
 * them, so a separate ranking call would be wasted tokens.
 */
export type MatchedDeal = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string;
  cover_image: string;
  city: string;
  district: string | null;
  venue_name: string | null;
  duration_minutes: number | null;
  original_price: number;
  discounted_price: number;
  discount_percent: number;
  audience: string[];
  tags: string[];
  /** Merchant koordinatları — AI sonuçlarının haritada pinlenebilmesi için. */
  lat: number | null;
  lng: number | null;
  similarity: number;
  /** Kullanıcı konumu verildiyse mesafe km — yoksa null. */
  distance_km: number | null;
};

export interface SearchOptions {
  maxResults?: number;
  filterCity?: string | null;
  /** Konum bağlamı — verilirse match_deals hibrit (similarity + yakınlık) sıralar. */
  nearLat?: number | null;
  nearLng?: number | null;
}

export async function searchDealsByQuery(
  query: string,
  options: SearchOptions = {},
): Promise<MatchedDeal[]> {
  const trimmed = query.trim();
  if (trimmed.length < 3) return [];

  const supabase = getServiceClient();
  const vector = await embed(trimmed);

  const { data, error } = await supabase.rpc('match_deals', {
    query_embedding: toPgVector(vector),
    match_count: Math.max(1, Math.min(options.maxResults ?? 5, 12)),
    filter_city: options.filterCity ?? null,
    near_lat: options.nearLat ?? null,
    near_lng: options.nearLng ?? null,
  });

  if (error) {
    console.error('match_deals RPC failed in search-core:', error);
    return [];
  }
  return (data ?? []) as MatchedDeal[];
}
