import 'server-only';
import { getServiceClient } from '@/lib/db/service';
import type { LoyaltyTier } from '@/lib/utils/loyalty';

/**
 * /u Topluluk sayfası için query'ler — service-role kullanır (RLS bypass)
 * ama yalnız public profillere ait verileri döndürür. Sayfa ISR ile
 * cache'lenir → sık DB hit'i yok.
 */

const SEVEN_DAYS_AGO = () => {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString();
};

const THIRTY_DAYS_AGO = () => {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString();
};

const YEAR_AGO = () => {
  const d = new Date();
  d.setDate(d.getDate() - 365);
  return d.toISOString();
};

const FOURTEEN_DAYS_AGO = () => {
  const d = new Date();
  d.setDate(d.getDate() - 14);
  return d.toISOString();
};

export interface PublicProfileBrief {
  id: string;
  publicSlug: string;
  displayName: string;
  avatarUrl: string | null;
  loyaltyPoints: number;
  favoriteCount: number;
  bookingCount: number;
  joinedAt: string;
}

export interface Champion extends PublicProfileBrief {
  /** Pencere içinde yaptığı booking sayısı */
  windowBookings: number;
}

export interface FavoritedDeal {
  id: string;
  slug: string;
  title: string;
  city: string;
  district: string | null;
  coverImage: string;
  discountedPrice: number;
  originalPrice: number;
  favoriteCount: number;
}

export interface LoyaltyDistribution {
  bronze: number;
  silver: number;
  gold: number;
  total: number;
}

export interface CommunityStats {
  publicProfiles: number;
  totalFavorites: number;
  newJoiners14d: number;
  goldMembers: number;
}

interface PublicProfileRow {
  id: string;
  public_slug: string | null;
  display_name: string | null;
  avatar_url: string | null;
  loyalty_points: number;
  created_at: string;
}

async function fetchAllPublicProfiles(): Promise<PublicProfileRow[]> {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from('profiles')
    .select('id, public_slug, display_name, avatar_url, loyalty_points, created_at')
    .eq('is_public', true)
    .not('public_slug', 'is', null)
    .limit(500);
  return (data ?? []).filter((p) => p.public_slug);
}

function toBrief(p: PublicProfileRow, favCount: number, bookingCount: number): PublicProfileBrief {
  return {
    id: p.id,
    publicSlug: p.public_slug ?? '',
    displayName: p.display_name ?? p.public_slug ?? '—',
    avatarUrl: p.avatar_url,
    loyaltyPoints: p.loyalty_points ?? 0,
    favoriteCount: favCount,
    bookingCount,
    joinedAt: p.created_at,
  };
}

/**
 * Verilen zaman penceresinde EN ÇOK confirmed booking yapan public
 * profillerden top N. "Haftanın/ayın şampiyonları" için.
 */
async function getChampionsInWindow(sinceIso: string, top = 3): Promise<Champion[]> {
  const supabase = getServiceClient();
  const profiles = await fetchAllPublicProfiles();
  if (profiles.length === 0) return [];

  const ids = profiles.map((p) => p.id);

  const [windowBookings, allBookings, allFavorites] = await Promise.all([
    supabase
      .from('bookings')
      .select('user_id')
      .in('user_id', ids)
      .gte('created_at', sinceIso)
      .in('status', ['confirmed', 'used']),
    supabase
      .from('bookings')
      .select('user_id')
      .in('user_id', ids)
      .in('status', ['confirmed', 'used']),
    supabase.from('favorites').select('user_id').in('user_id', ids),
  ]);

  const windowCounts = new Map<string, number>();
  for (const b of windowBookings.data ?? []) {
    if (b.user_id) windowCounts.set(b.user_id, (windowCounts.get(b.user_id) ?? 0) + 1);
  }
  const totalBookingCounts = new Map<string, number>();
  for (const b of allBookings.data ?? []) {
    if (b.user_id) totalBookingCounts.set(b.user_id, (totalBookingCounts.get(b.user_id) ?? 0) + 1);
  }
  const favCounts = new Map<string, number>();
  for (const f of allFavorites.data ?? []) {
    if (f.user_id) favCounts.set(f.user_id, (favCounts.get(f.user_id) ?? 0) + 1);
  }

  const champions: Champion[] = profiles
    .map((p) => {
      const wc = windowCounts.get(p.id) ?? 0;
      return {
        ...toBrief(p, favCounts.get(p.id) ?? 0, totalBookingCounts.get(p.id) ?? 0),
        windowBookings: wc,
      };
    })
    .filter((c) => c.windowBookings > 0)
    .sort((a, b) => b.windowBookings - a.windowBookings || b.loyaltyPoints - a.loyaltyPoints)
    .slice(0, top);

  return champions;
}

export async function getWeeklyChampions(top = 3): Promise<Champion[]> {
  return getChampionsInWindow(SEVEN_DAYS_AGO(), top);
}

export async function getMonthlyChampions(top = 3): Promise<Champion[]> {
  return getChampionsInWindow(THIRTY_DAYS_AGO(), top);
}

export async function getYearlyChampions(top = 3): Promise<Champion[]> {
  return getChampionsInWindow(YEAR_AGO(), top);
}

/**
 * Tüm public profiller — sıralama loyalty puanına göre. Profil grid'i için.
 */
export async function listPublicProfiles(limit = 24): Promise<PublicProfileBrief[]> {
  const supabase = getServiceClient();
  const profiles = await fetchAllPublicProfiles();
  if (profiles.length === 0) return [];

  const ids = profiles.map((p) => p.id);
  const [favs, books] = await Promise.all([
    supabase.from('favorites').select('user_id').in('user_id', ids),
    supabase
      .from('bookings')
      .select('user_id')
      .in('user_id', ids)
      .in('status', ['confirmed', 'used']),
  ]);

  const favCounts = new Map<string, number>();
  for (const f of favs.data ?? []) {
    if (f.user_id) favCounts.set(f.user_id, (favCounts.get(f.user_id) ?? 0) + 1);
  }
  const bookCounts = new Map<string, number>();
  for (const b of books.data ?? []) {
    if (b.user_id) bookCounts.set(b.user_id, (bookCounts.get(b.user_id) ?? 0) + 1);
  }

  return profiles
    .map((p) => toBrief(p, favCounts.get(p.id) ?? 0, bookCounts.get(p.id) ?? 0))
    .sort((a, b) => b.loyaltyPoints - a.loyaltyPoints || b.favoriteCount - a.favoriteCount)
    .slice(0, limit);
}

/**
 * Topluluğun en çok favorilediği fırsatlar — aktif + yayında olanlardan.
 * "Topluluk seçimi" bölümü için.
 */
export async function getMostFavoritedDeals(limit = 6): Promise<FavoritedDeal[]> {
  const supabase = getServiceClient();
  const { data: favs } = await supabase.from('favorites').select('deal_id').limit(5000);

  const counts = new Map<string, number>();
  for (const f of favs ?? []) {
    if (!f.deal_id) continue;
    counts.set(f.deal_id, (counts.get(f.deal_id) ?? 0) + 1);
  }
  if (counts.size === 0) return [];

  const topIds = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit * 2)
    .map(([id]) => id);

  const { data: deals } = await supabase
    .from('deals')
    .select(
      'id, slug, title, city, district, cover_image, discounted_price, original_price, is_active, published_at, valid_until',
    )
    .in('id', topIds);

  const now = new Date();
  return (deals ?? [])
    .filter((d) => d.is_active && d.published_at && new Date(d.valid_until) > now)
    .map((d) => ({
      id: d.id,
      slug: d.slug,
      title: d.title,
      city: d.city,
      district: d.district,
      coverImage: d.cover_image,
      discountedPrice: Number(d.discounted_price),
      originalPrice: Number(d.original_price),
      favoriteCount: counts.get(d.id) ?? 0,
    }))
    .sort((a, b) => b.favoriteCount - a.favoriteCount)
    .slice(0, limit);
}

/**
 * Loyalty tier dağılımı — bronz/silver/gold sayıları. Topluluk istatistiği.
 * Sadece public profiller mi tüm üyeler mi? Tüm üyeler — community ölçeği.
 */
export async function getLoyaltyDistribution(): Promise<LoyaltyDistribution> {
  const supabase = getServiceClient();
  const { data } = await supabase.from('profiles').select('loyalty_points');
  const dist = { bronze: 0, silver: 0, gold: 0, total: 0 };
  for (const p of data ?? []) {
    const pts = p.loyalty_points ?? 0;
    dist.total++;
    const tier: LoyaltyTier = pts >= 100 ? 'gold' : pts >= 30 ? 'silver' : 'bronze';
    dist[tier]++;
  }
  return dist;
}

export async function getCommunityStats(): Promise<CommunityStats> {
  const supabase = getServiceClient();
  const since14 = FOURTEEN_DAYS_AGO();

  const [
    { count: publicProfiles },
    { count: totalFavorites },
    { count: newJoiners14d },
    { count: goldMembers },
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('is_public', true)
      .not('public_slug', 'is', null),
    supabase.from('favorites').select('user_id', { count: 'exact', head: true }),
    supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', since14),
    supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .gte('loyalty_points', 100),
  ]);

  return {
    publicProfiles: publicProfiles ?? 0,
    totalFavorites: totalFavorites ?? 0,
    newJoiners14d: newJoiners14d ?? 0,
    goldMembers: goldMembers ?? 0,
  };
}
