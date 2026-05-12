import 'server-only';
import { getServiceClient } from '@/lib/db/service';

export type AdminCounts = {
  totalDeals: number;
  activeDeals: number;
  featuredDeals: number;
  merchants: number;
  bookings: number;
  aiQueries30d: number;
};

/**
 * Aggregate counts for the /admin dashboard. Service-role client bypasses
 * RLS so the numbers are global (not just the caller's rows).
 */
export async function getAdminCounts(): Promise<AdminCounts> {
  const supabase = getServiceClient();
  const since30 = new Date();
  since30.setDate(since30.getDate() - 30);

  const [
    { count: totalDeals },
    { count: activeDeals },
    { count: featuredDeals },
    { count: merchants },
    { count: bookings },
    { count: aiQueries30d },
  ] = await Promise.all([
    supabase.from('deals').select('*', { count: 'exact', head: true }),
    supabase.from('deals').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('deals').select('*', { count: 'exact', head: true }).eq('is_featured', true),
    supabase.from('merchants').select('*', { count: 'exact', head: true }),
    supabase.from('bookings').select('*', { count: 'exact', head: true }),
    supabase
      .from('ai_query_logs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', since30.toISOString()),
  ]);

  return {
    totalDeals: totalDeals ?? 0,
    activeDeals: activeDeals ?? 0,
    featuredDeals: featuredDeals ?? 0,
    merchants: merchants ?? 0,
    bookings: bookings ?? 0,
    aiQueries30d: aiQueries30d ?? 0,
  };
}

export interface DayCount {
  /** YYYY-MM-DD */
  day: string;
  count: number;
}

export interface CategoryCount {
  slug: string;
  name: string;
  count: number;
}

/** Son 7 günün her biri için rezervasyon sayısı, eski → yeni. */
export async function getBookingsLast7Days(): Promise<DayCount[]> {
  const supabase = getServiceClient();
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - 6);

  const { data } = await supabase
    .from('bookings')
    .select('created_at')
    .gte('created_at', start.toISOString());

  const buckets = new Map<string, number>();
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    buckets.set(d.toISOString().slice(0, 10), 0);
  }
  for (const row of data ?? []) {
    const day = (row.created_at as string).slice(0, 10);
    if (buckets.has(day)) buckets.set(day, (buckets.get(day) ?? 0) + 1);
  }
  return [...buckets.entries()].map(([day, count]) => ({ day, count }));
}

/** En çok rezervasyon alan kategoriler (top 5, all-time). */
export async function getTopCategoriesByBookings(): Promise<CategoryCount[]> {
  const supabase = getServiceClient();
  const { data: bookings } = await supabase.from('bookings').select('deal_id');
  if (!bookings || bookings.length === 0) return [];

  const dealCounts = new Map<string, number>();
  for (const b of bookings) {
    if (!b.deal_id) continue;
    dealCounts.set(b.deal_id, (dealCounts.get(b.deal_id) ?? 0) + 1);
  }
  if (dealCounts.size === 0) return [];

  const dealIds = [...dealCounts.keys()];
  const { data: joins } = await supabase
    .from('deal_categories')
    .select('deal_id, category:categories ( slug, name )')
    .in('deal_id', dealIds);

  const catAgg = new Map<string, { slug: string; name: string; count: number }>();
  for (const j of joins ?? []) {
    // PostgREST embedded relation array veya tek obje dönebilir; her ikisini de destekle.
    const rel = j.category as unknown as
      | { slug: string; name: string }
      | { slug: string; name: string }[]
      | null;
    const cat = Array.isArray(rel) ? rel[0] : rel;
    if (!cat) continue;
    const n = dealCounts.get(j.deal_id) ?? 0;
    const cur = catAgg.get(cat.slug);
    if (cur) cur.count += n;
    else catAgg.set(cat.slug, { slug: cat.slug, name: cat.name, count: n });
  }

  return [...catAgg.values()].sort((a, b) => b.count - a.count).slice(0, 5);
}
