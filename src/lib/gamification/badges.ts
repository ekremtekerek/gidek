import 'server-only';
import { getServiceClient } from '@/lib/db/service';

/**
 * Rozet değerlendirme — kullanıcının mevcut istatistiklerini hesaplar,
 * katalog rozetleriyle karşılaştırır, daha önce kazanmadığı + kriter
 * eşiğine ulaşmış olanları `user_badges`'a ekler.
 *
 * Çağrı yerleri:
 *  - confirm_booking_payment başarılı sonrası (booking_count, category_*, district_count)
 *  - createReviewAction başarılı sonrası (review_count)
 *  - toggleFavoriteAction sonrası (favorite_count) — opsiyonel, mevcut UX'i bozma
 *
 * Fire-and-forget olarak çağırılır; hata olursa sessizce log'la.
 *
 * @returns Yeni kazanılan rozet slug'ları (toast için)
 */
export async function evaluateAndGrantBadges(userId: string): Promise<string[]> {
  const supabase = getServiceClient();

  const [
    { data: badges },
    { data: alreadyEarned },
    bookingStats,
    reviewCount,
    favoriteCount,
    streakWeeks,
  ] = await Promise.all([
    supabase.from('badges').select('id, slug, criteria_type, criteria_value, criteria_extra'),
    supabase.from('user_badges').select('badge_id').eq('user_id', userId),
    fetchBookingStats(userId),
    fetchReviewCount(userId),
    fetchFavoriteCount(userId),
    fetchStreakWeeks(userId),
  ]);

  if (!badges || badges.length === 0) return [];

  const earnedSet = new Set((alreadyEarned ?? []).map((r) => r.badge_id));
  const toGrant: { user_id: string; badge_id: string }[] = [];
  const grantedSlugs: string[] = [];

  for (const b of badges) {
    if (earnedSet.has(b.id)) continue;
    if (qualifies(b, bookingStats, reviewCount, favoriteCount, streakWeeks)) {
      toGrant.push({ user_id: userId, badge_id: b.id });
      grantedSlugs.push(b.slug);
    }
  }

  if (toGrant.length > 0) {
    const { error } = await supabase.from('user_badges').insert(toGrant);
    if (error) {
      console.error('[badges] insert failed:', error);
      return [];
    }
  }

  return grantedSlugs;
}

interface BookingStats {
  total: number;
  byCategory: Map<string, number>;
  districts: Set<string>;
}

async function fetchBookingStats(userId: string): Promise<BookingStats> {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from('bookings')
    .select('deal_id, status, deal:deals ( district, deal_categories ( category:categories ( slug ) ) )')
    .eq('user_id', userId)
    .in('status', ['confirmed', 'used']);

  let total = 0;
  const byCategory = new Map<string, number>();
  const districts = new Set<string>();

  for (const row of data ?? []) {
    total++;
    const dealRel = row.deal as
      | { district: string | null; deal_categories: { category: { slug: string } | { slug: string }[] }[] }
      | { district: string | null; deal_categories: { category: { slug: string } | { slug: string }[] }[] }[]
      | null;
    const deal = Array.isArray(dealRel) ? dealRel[0] : dealRel;
    if (!deal) continue;

    if (deal.district) districts.add(deal.district);

    for (const dc of deal.deal_categories ?? []) {
      const catRel = dc.category as { slug: string } | { slug: string }[] | null;
      const cat = Array.isArray(catRel) ? catRel[0] : catRel;
      if (!cat) continue;
      byCategory.set(cat.slug, (byCategory.get(cat.slug) ?? 0) + 1);
    }
  }

  return { total, byCategory, districts };
}

async function fetchReviewCount(userId: string): Promise<number> {
  const supabase = getServiceClient();
  const { count } = await supabase
    .from('reviews')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_active', true);
  return count ?? 0;
}

async function fetchFavoriteCount(userId: string): Promise<number> {
  const supabase = getServiceClient();
  const { count } = await supabase
    .from('favorites')
    .select('user_id', { count: 'exact', head: true })
    .eq('user_id', userId);
  return count ?? 0;
}

async function fetchStreakWeeks(userId: string): Promise<number> {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from('profiles')
    .select('streak_weeks')
    .eq('id', userId)
    .maybeSingle();
  return ((data as { streak_weeks?: number } | null)?.streak_weeks ?? 0);
}

interface BadgeCriteria {
  id: string;
  slug: string;
  criteria_type: string;
  criteria_value: number;
  criteria_extra: string | null;
}

function qualifies(
  b: BadgeCriteria,
  bookings: BookingStats,
  reviewCount: number,
  favoriteCount: number,
  streakWeeks: number,
): boolean {
  switch (b.criteria_type) {
    case 'booking_count':
      return bookings.total >= b.criteria_value;
    case 'category_first':
      if (!b.criteria_extra) return false;
      return (bookings.byCategory.get(b.criteria_extra) ?? 0) >= 1;
    case 'category_count':
      if (!b.criteria_extra) return false;
      return (bookings.byCategory.get(b.criteria_extra) ?? 0) >= b.criteria_value;
    case 'district_count':
      return bookings.districts.size >= b.criteria_value;
    case 'review_count':
      return reviewCount >= b.criteria_value;
    case 'favorite_count':
      return favoriteCount >= b.criteria_value;
    case 'streak_weeks':
      return streakWeeks >= b.criteria_value;
    default:
      return false;
  }
}

// ---------------------------------------------------------------------------
// Public read helpers — profil ve /u sayfası için
// ---------------------------------------------------------------------------

export interface BadgeRow {
  id: string;
  slug: string;
  name: string;
  description: string;
  emoji: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  earned: boolean;
  earnedAt: string | null;
}

/**
 * Tüm rozetler — kullanıcının kazandıkları işaretli, kazanılmayanlar da
 * grayed-out vitrin için döner. sort_order'a göre sıralı.
 */
export async function listBadgesForUser(userId: string): Promise<BadgeRow[]> {
  const supabase = getServiceClient();
  const [{ data: all }, { data: earned }] = await Promise.all([
    supabase
      .from('badges')
      .select('id, slug, name, description, emoji, tier, sort_order')
      .order('sort_order', { ascending: true }),
    supabase.from('user_badges').select('badge_id, earned_at').eq('user_id', userId),
  ]);

  const earnedMap = new Map<string, string>();
  for (const e of earned ?? []) earnedMap.set(e.badge_id, e.earned_at);

  return (all ?? []).map((b) => ({
    id: b.id,
    slug: b.slug,
    name: b.name,
    description: b.description,
    emoji: b.emoji,
    tier: b.tier as BadgeRow['tier'],
    earned: earnedMap.has(b.id),
    earnedAt: earnedMap.get(b.id) ?? null,
  }));
}
