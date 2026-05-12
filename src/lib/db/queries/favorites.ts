import 'server-only';
import { getServerClient } from '@/lib/db/server';
import type { DealWithMerchant } from '@/lib/db/queries/deals';

const FAVORITE_SELECT = `
  created_at,
  deal:deals (
    *,
    merchant:merchants ( name, slug, city, district )
  )
`;

/**
 * List the caller's favorite deals, newest favorite first. RLS scopes the
 * result to the authenticated user; anonymous callers receive an empty list.
 */
export async function listFavoriteDeals(): Promise<DealWithMerchant[]> {
  const supabase = await getServerClient();
  const { data, error } = await supabase
    .from('favorites')
    .select(FAVORITE_SELECT)
    .order('created_at', { ascending: false });
  if (error) throw error;

  type Row = { deal: DealWithMerchant | null };
  return ((data ?? []) as unknown as Row[])
    .map((r) => r.deal)
    .filter((d): d is DealWithMerchant => d !== null);
}

/**
 * Return true if the caller (the cookie-bound user) has favorited `dealId`.
 * Used by the deal detail page to compute the initial toggle state.
 */
export async function isFavorite(dealId: string): Promise<boolean> {
  const supabase = await getServerClient();
  const { data, error } = await supabase
    .from('favorites')
    .select('deal_id')
    .eq('deal_id', dealId)
    .maybeSingle();
  if (error) {
    // Anonymous callers will be filtered to empty by RLS; treat anything else
    // as "not favorited" to avoid leaking errors into the UI.
    return false;
  }
  return data !== null;
}
