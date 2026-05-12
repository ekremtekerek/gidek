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
