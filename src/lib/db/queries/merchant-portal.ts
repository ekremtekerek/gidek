import 'server-only';
import { getServiceClient } from '@/lib/db/service';
import type { BookingStatus } from '@/lib/utils/constants';

/**
 * Merchant self-service portal query'leri — service-role kullanır (RLS
 * bypass) ve her query explicit `merchant_id` filtresi atar. Yetki kontrolü
 * action/layout katmanında requireMerchant() ile yapıldıktan sonra
 * çağrıldığını varsayar.
 */

export interface MerchantStats {
  totalDeals: number;
  publishedDeals: number;
  pendingDeals: number;
  totalBookings: number;
  totalRevenue: number;
  avgRating: number | null;
}

export async function getMerchantStats(merchantId: string): Promise<MerchantStats> {
  const supabase = getServiceClient();

  const [
    { count: totalDeals },
    { count: publishedDeals },
    { data: dealIds },
    { data: ratingRows },
  ] = await Promise.all([
    supabase.from('deals').select('id', { count: 'exact', head: true }).eq('merchant_id', merchantId),
    supabase
      .from('deals')
      .select('id', { count: 'exact', head: true })
      .eq('merchant_id', merchantId)
      .eq('is_active', true)
      .not('published_at', 'is', null),
    supabase.from('deals').select('id').eq('merchant_id', merchantId),
    supabase
      .from('deals')
      .select('rating_avg, rating_count')
      .eq('merchant_id', merchantId)
      .not('rating_avg', 'is', null),
  ]);

  const allDealIds = (dealIds ?? []).map((d) => d.id);
  let totalBookings = 0;
  let totalRevenue = 0;
  if (allDealIds.length > 0) {
    const { data: bookings } = await supabase
      .from('bookings')
      .select('total_amount, status')
      .in('deal_id', allDealIds)
      .in('status', ['confirmed', 'used']);
    totalBookings = bookings?.length ?? 0;
    totalRevenue = (bookings ?? []).reduce((s, b) => s + Number(b.total_amount), 0);
  }

  // Weighted average across deals
  let avgRating: number | null = null;
  const weighted = (ratingRows ?? []).reduce(
    (acc, r) => {
      const cnt = r.rating_count ?? 0;
      const avg = Number(r.rating_avg ?? 0);
      if (cnt > 0 && avg > 0) {
        acc.sum += avg * cnt;
        acc.count += cnt;
      }
      return acc;
    },
    { sum: 0, count: 0 },
  );
  if (weighted.count > 0) avgRating = Number((weighted.sum / weighted.count).toFixed(2));

  return {
    totalDeals: totalDeals ?? 0,
    publishedDeals: publishedDeals ?? 0,
    pendingDeals: (totalDeals ?? 0) - (publishedDeals ?? 0),
    totalBookings,
    totalRevenue,
    avgRating,
  };
}

export interface MerchantDealRow {
  id: string;
  slug: string;
  title: string;
  city: string;
  originalPrice: number;
  discountedPrice: number;
  isActive: boolean;
  publishedAt: string | null;
  soldCount: number;
  ratingAvg: number | null;
  ratingCount: number;
  createdAt: string;
}

export async function listMerchantDeals(merchantId: string): Promise<MerchantDealRow[]> {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from('deals')
    .select(
      'id, slug, title, city, original_price, discounted_price, is_active, published_at, sold_count, rating_avg, rating_count, created_at',
    )
    .eq('merchant_id', merchantId)
    .order('created_at', { ascending: false });

  return (data ?? []).map((d) => ({
    id: d.id,
    slug: d.slug,
    title: d.title,
    city: d.city,
    originalPrice: Number(d.original_price),
    discountedPrice: Number(d.discounted_price),
    isActive: d.is_active,
    publishedAt: d.published_at,
    soldCount: d.sold_count ?? 0,
    ratingAvg: d.rating_avg ? Number(d.rating_avg) : null,
    ratingCount: d.rating_count ?? 0,
    createdAt: d.created_at,
  }));
}

export interface MerchantBookingRow {
  id: string;
  bookingCode: string;
  status: BookingStatus;
  quantity: number;
  totalAmount: number;
  selectedDate: string | null;
  selectedTime: string | null;
  createdAt: string;
  dealTitle: string;
  dealSlug: string;
  customerName: string | null;
  customerPhone: string | null;
}

/**
 * Merchant'a ait deal'lerin son rezervasyonları. Müşteri e-postası
 * dahil edilmez — gizlilik için. Telefon görünür çünkü işletmenin
 * müşteriye ulaşması operasyonel ihtiyaç.
 */
export async function listMerchantBookings(
  merchantId: string,
  limit = 50,
): Promise<MerchantBookingRow[]> {
  const supabase = getServiceClient();

  const { data: deals } = await supabase
    .from('deals')
    .select('id, title, slug')
    .eq('merchant_id', merchantId);
  const dealMap = new Map<string, { title: string; slug: string }>();
  for (const d of deals ?? []) dealMap.set(d.id, { title: d.title, slug: d.slug });

  const dealIds = [...dealMap.keys()];
  if (dealIds.length === 0) return [];

  const { data } = await supabase
    .from('bookings')
    .select(
      `id, booking_code, status, quantity, total_amount, selected_date, selected_time, created_at,
       deal_id, guest_name, guest_phone,
       profile:profiles ( display_name, phone )`,
    )
    .in('deal_id', dealIds)
    .order('created_at', { ascending: false })
    .limit(limit);

  return (data ?? []).map((b) => {
    const profileRel = b.profile as
      | { display_name: string | null; phone: string | null }
      | { display_name: string | null; phone: string | null }[]
      | null;
    const profile = Array.isArray(profileRel) ? profileRel[0] : profileRel;
    const deal = dealMap.get(b.deal_id) ?? { title: '—', slug: '' };
    return {
      id: b.id,
      bookingCode: b.booking_code,
      status: b.status as BookingStatus,
      quantity: b.quantity,
      totalAmount: Number(b.total_amount),
      selectedDate: b.selected_date,
      selectedTime: b.selected_time,
      createdAt: b.created_at,
      dealTitle: deal.title,
      dealSlug: deal.slug,
      customerName: profile?.display_name ?? b.guest_name ?? null,
      customerPhone: profile?.phone ?? b.guest_phone ?? null,
    };
  });
}

export interface MerchantInfo {
  id: string;
  slug: string;
  name: string;
  city: string | null;
  district: string | null;
  is_active: boolean;
  is_verified: boolean;
}

export async function getMerchantInfo(merchantId: string): Promise<MerchantInfo | null> {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from('merchants')
    .select('id, slug, name, city, district, is_active, is_verified')
    .eq('id', merchantId)
    .maybeSingle();
  return data;
}
