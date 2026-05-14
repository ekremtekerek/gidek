import 'server-only';
import { getServiceClient } from '@/lib/db/service';

/**
 * Public /trend dashboard query'leri — service-role (RLS bypass) + sayfa
 * tarafında ISR ile cache'lenir. Her sayım gerçek booking verisinden
 * üretilir.
 */

export interface TrendingDeal {
  id: string;
  slug: string;
  title: string;
  city: string;
  coverImage: string;
  bookings7d: number;
  discountedPrice: number;
  originalPrice: number;
}

export interface TrendingCategory {
  slug: string;
  name: string;
  bookings7d: number;
}

export interface TrendStats {
  totalDeals: number;
  totalBookings: number;
  totalUsers: number;
  bookings7d: number;
}

const SEVEN_DAYS_AGO = () => {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString();
};

export async function getTrendingDeals(limit = 6): Promise<TrendingDeal[]> {
  const supabase = getServiceClient();
  const since = SEVEN_DAYS_AGO();

  // Son 7 günün confirmed/used booking'leri için deal_id frekansı
  const { data: bookings } = await supabase
    .from('bookings')
    .select('deal_id')
    .gte('created_at', since)
    .in('status', ['confirmed', 'used']);

  const counts = new Map<string, number>();
  for (const b of bookings ?? []) {
    if (!b.deal_id) continue;
    counts.set(b.deal_id, (counts.get(b.deal_id) ?? 0) + 1);
  }

  const topIds = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id);

  if (topIds.length === 0) return [];

  const { data: deals } = await supabase
    .from('deals')
    .select('id, slug, title, city, cover_image, discounted_price, original_price')
    .in('id', topIds)
    .eq('is_active', true)
    .not('published_at', 'is', null);

  return (deals ?? [])
    .map((d) => ({
      id: d.id,
      slug: d.slug,
      title: d.title,
      city: d.city,
      coverImage: d.cover_image,
      bookings7d: counts.get(d.id) ?? 0,
      discountedPrice: Number(d.discounted_price),
      originalPrice: Number(d.original_price),
    }))
    .sort((a, b) => b.bookings7d - a.bookings7d);
}

export async function getTrendingCategories(limit = 5): Promise<TrendingCategory[]> {
  const supabase = getServiceClient();
  const since = SEVEN_DAYS_AGO();

  const { data: bookings } = await supabase
    .from('bookings')
    .select('deal_id')
    .gte('created_at', since)
    .in('status', ['confirmed', 'used']);

  const dealCounts = new Map<string, number>();
  for (const b of bookings ?? []) {
    if (!b.deal_id) continue;
    dealCounts.set(b.deal_id, (dealCounts.get(b.deal_id) ?? 0) + 1);
  }
  if (dealCounts.size === 0) return [];

  const { data: joins } = await supabase
    .from('deal_categories')
    .select('deal_id, category:categories ( slug, name, is_active )')
    .in('deal_id', [...dealCounts.keys()]);

  const catCounts = new Map<string, { slug: string; name: string; count: number }>();
  for (const j of joins ?? []) {
    const rel = j.category as
      | { slug: string; name: string; is_active: boolean }
      | { slug: string; name: string; is_active: boolean }[]
      | null;
    const cat = Array.isArray(rel) ? rel[0] : rel;
    if (!cat || !cat.is_active) continue;
    const add = dealCounts.get(j.deal_id) ?? 0;
    const existing = catCounts.get(cat.slug);
    if (existing) existing.count += add;
    else catCounts.set(cat.slug, { slug: cat.slug, name: cat.name, count: add });
  }

  return [...catCounts.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map((c) => ({ slug: c.slug, name: c.name, bookings7d: c.count }));
}

export async function getTrendStats(): Promise<TrendStats> {
  const supabase = getServiceClient();
  const since = SEVEN_DAYS_AGO();

  const [
    { count: totalDeals },
    { count: totalBookings },
    { count: totalUsers },
    { count: bookings7d },
  ] = await Promise.all([
    supabase
      .from('deals')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true)
      .not('published_at', 'is', null),
    supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .in('status', ['confirmed', 'used']),
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', since)
      .in('status', ['confirmed', 'used']),
  ]);

  return {
    totalDeals: totalDeals ?? 0,
    totalBookings: totalBookings ?? 0,
    totalUsers: totalUsers ?? 0,
    bookings7d: bookings7d ?? 0,
  };
}
