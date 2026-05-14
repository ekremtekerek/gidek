import 'server-only';
import { getPublicClient } from '@/lib/db/public';
import { getServerClient } from '@/lib/db/server';
import { getCurrentUser } from '@/lib/security/auth';

export interface ReviewRow {
  id: string;
  display_name: string;
  rating: number;
  body: string;
  created_at: string;
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
    .select('id, display_name, rating, body, created_at')
    .eq('deal_id', dealId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as ReviewRow[];
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
