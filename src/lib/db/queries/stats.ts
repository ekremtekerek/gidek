import 'server-only';
import { getPublicClient } from '@/lib/db/public';

/**
 * Anasayfa sosyal kanıt şeritinde gösterilen sayılar. Sadece "var olan
 * aktif" sayıları toplar — pazarlama amaçlı şişirilmez. Public client +
 * head:true ile minimum maliyet.
 */
export interface PlatformStats {
  activeDeals: number;
  merchants: number;
  cities: number;
  reviews: number;
  ratingAvg: number | null;
}

export async function getPlatformStats(): Promise<PlatformStats> {
  const supabase = getPublicClient();
  const nowIso = new Date().toISOString();

  const [dealsCount, merchantsCount, citiesData, reviewsAgg] = await Promise.all([
    supabase
      .from('deals')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true)
      .lte('published_at', nowIso)
      .gt('valid_until', nowIso),
    supabase
      .from('merchants')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true),
    supabase
      .from('deals')
      .select('city')
      .eq('is_active', true)
      .lte('published_at', nowIso)
      .gt('valid_until', nowIso),
    supabase
      .from('reviews')
      .select('rating', { count: 'exact' }),
  ]);

  const uniqueCities = new Set((citiesData.data ?? []).map((d) => d.city));
  const reviewsCount = reviewsAgg.count ?? 0;
  let ratingAvg: number | null = null;
  if (reviewsAgg.data && reviewsAgg.data.length > 0) {
    const sum = reviewsAgg.data.reduce((acc, r) => acc + Number(r.rating ?? 0), 0);
    ratingAvg = sum / reviewsAgg.data.length;
  }

  return {
    activeDeals: dealsCount.count ?? 0,
    merchants: merchantsCount.count ?? 0,
    cities: uniqueCities.size,
    reviews: reviewsCount,
    ratingAvg,
  };
}

/**
 * Yakında biten fırsatlar — `valid_until` önümüzdeki N gün içinde olan,
 * aktif fırsatlar. Aciliyet hissi yaratan "acele et" vitrini için.
 */
export async function listEndingSoonDeals(args: {
  city?: string;
  withinDays?: number;
  limit?: number;
}) {
  const { city, withinDays = 14, limit = 8 } = args;
  const supabase = getPublicClient();
  const nowIso = new Date().toISOString();
  const cutoff = new Date(Date.now() + withinDays * 86400_000).toISOString();

  let query = supabase
    .from('deals')
    .select(`*, merchant:merchants ( name, slug, city, district, lat, lng )`)
    .eq('is_active', true)
    .lte('published_at', nowIso)
    .gt('valid_until', nowIso)
    .lte('valid_until', cutoff)
    .order('valid_until', { ascending: true })
    .limit(limit);
  if (city) query = query.eq('city', city);

  const { data, error } = await query;
  if (error) return [];
  return data ?? [];
}
