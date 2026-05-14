import 'server-only';
import { getPublicClient } from '@/lib/db/public';
import { getServerClient } from '@/lib/db/server';
import { getCurrentUser } from '@/lib/security/auth';

export interface ReviewPhoto {
  id: string;
  url: string;
}

export interface ReviewReply {
  id: string;
  display_name: string;
  body: string;
  is_merchant_reply: boolean;
  created_at: string;
  user_id: string | null;
}

export interface ReviewRow {
  id: string;
  user_id: string | null;
  display_name: string;
  rating: number;
  body: string;
  created_at: string;
  photos: ReviewPhoto[];
  replies: ReviewReply[];
}

export interface ReviewStats {
  count: number;
  average: number | null;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
}

/** Bir fırsat için aktif yorumları (en yeniden eskiye) listeler. */
export async function listReviewsForDeal(
  dealId: string,
  limit = 24,
): Promise<ReviewRow[]> {
  const supabase = getPublicClient();
  const { data, error } = await supabase
    .from('reviews')
    .select(
      `id, user_id, display_name, rating, body, created_at,
       photos:review_photos ( id, url, sort_order ),
       replies:review_replies ( id, display_name, body, is_merchant_reply, created_at, user_id, is_active )`,
    )
    .eq('deal_id', dealId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;

  type RawRow = {
    id: string;
    user_id: string | null;
    display_name: string;
    rating: number;
    body: string;
    created_at: string;
    photos?: { id: string; url: string; sort_order: number }[] | null;
    replies?: {
      id: string;
      display_name: string;
      body: string;
      is_merchant_reply: boolean;
      created_at: string;
      user_id: string | null;
      is_active: boolean;
    }[] | null;
  };

  return ((data ?? []) as unknown as RawRow[]).map((r) => ({
    id: r.id,
    user_id: r.user_id,
    display_name: r.display_name,
    rating: r.rating,
    body: r.body,
    created_at: r.created_at,
    photos: [...(r.photos ?? [])]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((p) => ({ id: p.id, url: p.url })),
    replies: (r.replies ?? [])
      .filter((rp) => rp.is_active)
      .sort((a, b) => (a.created_at < b.created_at ? -1 : 1))
      .map((rp) => ({
        id: rp.id,
        display_name: rp.display_name,
        body: rp.body,
        is_merchant_reply: rp.is_merchant_reply,
        created_at: rp.created_at,
        user_id: rp.user_id,
      })),
  }));
}

/**
 * Yorumlardan istatistik üretir — ortalama, toplam, 1-5 yıldız dağılımı.
 * UI'da bar chart için kullanılır. SQL aggregate yerine client-side yapılır
 * çünkü zaten yorum listesi alındı ve böylece tek query ile çalışır.
 */
export type ReviewEligibility =
  | { canReview: true; defaultName: string }
  | { canReview: false; reason: 'unauth' | 'no_booking' | 'already_reviewed' };

/**
 * "Bu kullanıcı bu fırsata yorum yazabilir mi?" gate'i. Sırayla:
 *  1. Auth gerekli
 *  2. confirmed/used statüsünde en az bir booking var mı
 *  3. Daha önce yorum yapmış mı
 *
 * Form ve action katmanında aynı kuralı uygularız; bu helper ikisinde de
 * çağrılır (state'i tek noktadan üretir).
 */
export async function getUserReviewEligibility(dealId: string): Promise<ReviewEligibility> {
  const user = await getCurrentUser();
  if (!user) return { canReview: false, reason: 'unauth' };

  const supabase = await getServerClient();

  const { count: bookingCount } = await supabase
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('deal_id', dealId)
    .in('status', ['confirmed', 'used']);
  if (!bookingCount || bookingCount === 0) {
    return { canReview: false, reason: 'no_booking' };
  }

  const { count: reviewCount } = await supabase
    .from('reviews')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('deal_id', dealId);
  if (reviewCount && reviewCount > 0) {
    return { canReview: false, reason: 'already_reviewed' };
  }

  // Default display name: profile.display_name → email prefix.
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .maybeSingle();
  const fromProfile = profile?.display_name?.trim();
  const fromEmail = user.email ? user.email.split('@')[0] : '';
  const defaultName = (fromProfile || fromEmail || 'Müşteri').slice(0, 50);

  return { canReview: true, defaultName };
}

export function summariseReviews(reviews: ReviewRow[]): ReviewStats {
  if (reviews.length === 0) {
    return { count: 0, average: null, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
  }
  const dist: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let total = 0;
  for (const r of reviews) {
    const v = r.rating as 1 | 2 | 3 | 4 | 5;
    if (v >= 1 && v <= 5) {
      dist[v]++;
      total += v;
    }
  }
  return {
    count: reviews.length,
    average: Number((total / reviews.length).toFixed(2)),
    distribution: dist,
  };
}
