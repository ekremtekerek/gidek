import 'server-only';
import { getPublicClient } from '@/lib/db/public';

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
