import 'server-only';
import { getServiceClient } from '@/lib/db/service';
import type { BookingStatus } from '@/lib/utils/constants';

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

export interface AdminBookingRow {
  id: string;
  bookingCode: string;
  status: BookingStatus;
  quantity: number;
  totalAmount: number;
  unitPrice: number;
  discountAmount: number;
  couponCode: string | null;
  currency: string;
  selectedDate: string | null;
  selectedTime: string | null;
  notes: string | null;
  adminNotes: string | null;
  cancelledByAdminAt: string | null;
  refundedAt: string | null;
  createdAt: string;
  updatedAt: string;
  userId: string | null;
  dealId: string;
  dealTitle: string;
  dealSlug: string;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  // Otel rezervasyonları için ek alanlar (event/etkinlik için null)
  checkInDate: string | null;
  checkOutDate: string | null;
  nights: number | null;
  adultCount: number | null;
  childCount: number | null;
  roomTypeId: string | null;
  boardBasis: string | null;
  tourismTaxTotal: number;
}

/**
 * Admin booking list — son rezervasyonlar, deal + müşteri bilgisiyle birlikte.
 * Service-role client RLS'i bypass eder. E-posta auth.users'tan ayrıca alınır
 * (profiles tablosunda email yok).
 */
export async function getAdminBookings(limit = 100): Promise<AdminBookingRow[]> {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from('bookings')
    .select(
      `id, booking_code, status, quantity, total_amount, unit_price, currency,
       discount_amount, coupon_code,
       selected_date, selected_time, notes, admin_notes,
       cancelled_by_admin_at, refunded_at,
       created_at, updated_at, user_id,
       guest_name, guest_email, guest_phone,
       check_in_date, check_out_date, nights, adult_count, child_count,
       room_type_id, board_basis, tourism_tax_total,
       deal:deals ( id, title, slug ),
       profile:profiles ( display_name, phone )`,
    )
    .order('created_at', { ascending: false })
    .limit(limit);

  const rows = data ?? [];
  const userIds = [...new Set(rows.map((r) => r.user_id).filter(Boolean) as string[])];
  const emailByUserId = new Map<string, string>();
  if (userIds.length) {
    // auth.users.email — service-role admin API üzerinden batch fetch.
    // V1 ölçeğinde 100 üst sınır kabul edilebilir.
    await Promise.all(
      userIds.map(async (uid) => {
        const { data: u } = await supabase.auth.admin.getUserById(uid);
        if (u?.user?.email) emailByUserId.set(uid, u.user.email);
      }),
    );
  }

  return rows.map((b) => {
    const dealRel = b.deal as
      | { id: string; title: string; slug: string }
      | { id: string; title: string; slug: string }[]
      | null;
    const deal = Array.isArray(dealRel) ? dealRel[0] : dealRel;
    const profileRel = b.profile as
      | { display_name: string | null; phone: string | null }
      | { display_name: string | null; phone: string | null }[]
      | null;
    const profile = Array.isArray(profileRel) ? profileRel[0] : profileRel;
    const authEmail = b.user_id ? emailByUserId.get(b.user_id) : undefined;

    return {
      id: b.id,
      bookingCode: b.booking_code,
      status: b.status as BookingStatus,
      quantity: b.quantity,
      totalAmount: Number(b.total_amount),
      unitPrice: Number(b.unit_price),
      discountAmount: Number(b.discount_amount ?? 0),
      couponCode: b.coupon_code,
      currency: b.currency,
      selectedDate: b.selected_date,
      selectedTime: b.selected_time,
      notes: b.notes,
      adminNotes: b.admin_notes,
      cancelledByAdminAt: b.cancelled_by_admin_at,
      refundedAt: b.refunded_at,
      createdAt: b.created_at,
      updatedAt: b.updated_at,
      userId: b.user_id,
      dealId: deal?.id ?? '',
      dealTitle: deal?.title ?? '—',
      dealSlug: deal?.slug ?? '',
      customerName: profile?.display_name ?? b.guest_name ?? null,
      customerEmail: authEmail ?? b.guest_email ?? null,
      customerPhone: profile?.phone ?? b.guest_phone ?? null,
      checkInDate: b.check_in_date,
      checkOutDate: b.check_out_date,
      nights: b.nights,
      adultCount: b.adult_count,
      childCount: b.child_count,
      roomTypeId: b.room_type_id,
      boardBasis: b.board_basis,
      tourismTaxTotal: Number(b.tourism_tax_total ?? 0),
    };
  });
}

/**
 * Tek bir rezervasyonun admin detayı — booking_code ile çekilir, deal +
 * müşteri ekleri ile birlikte. Geri kalan alanlar liste ile aynı şekil.
 */
export async function getAdminBookingByCode(code: string): Promise<AdminBookingRow | null> {
  const supabase = getServiceClient();
  const { data: b } = await supabase
    .from('bookings')
    .select(
      `id, booking_code, status, quantity, total_amount, unit_price, currency,
       discount_amount, coupon_code,
       selected_date, selected_time, notes, admin_notes,
       cancelled_by_admin_at, refunded_at,
       created_at, updated_at, user_id,
       guest_name, guest_email, guest_phone,
       check_in_date, check_out_date, nights, adult_count, child_count,
       room_type_id, board_basis, tourism_tax_total,
       deal:deals ( id, title, slug ),
       profile:profiles ( display_name, phone )`,
    )
    .eq('booking_code', code)
    .maybeSingle();

  if (!b) return null;

  const dealRel = b.deal as
    | { id: string; title: string; slug: string }
    | { id: string; title: string; slug: string }[]
    | null;
  const deal = Array.isArray(dealRel) ? dealRel[0] : dealRel;
  const profileRel = b.profile as
    | { display_name: string | null; phone: string | null }
    | { display_name: string | null; phone: string | null }[]
    | null;
  const profile = Array.isArray(profileRel) ? profileRel[0] : profileRel;

  let authEmail: string | undefined;
  if (b.user_id) {
    const { data: u } = await supabase.auth.admin.getUserById(b.user_id);
    authEmail = u?.user?.email ?? undefined;
  }

  return {
    id: b.id,
    bookingCode: b.booking_code,
    status: b.status as BookingStatus,
    quantity: b.quantity,
    totalAmount: Number(b.total_amount),
    unitPrice: Number(b.unit_price),
    discountAmount: Number(b.discount_amount ?? 0),
    couponCode: b.coupon_code,
    currency: b.currency,
    selectedDate: b.selected_date,
    selectedTime: b.selected_time,
    notes: b.notes,
    adminNotes: b.admin_notes,
    cancelledByAdminAt: b.cancelled_by_admin_at,
    refundedAt: b.refunded_at,
    createdAt: b.created_at,
    updatedAt: b.updated_at,
    userId: b.user_id,
    dealId: deal?.id ?? '',
    dealTitle: deal?.title ?? '—',
    dealSlug: deal?.slug ?? '',
    customerName: profile?.display_name ?? b.guest_name ?? null,
    customerEmail: authEmail ?? b.guest_email ?? null,
    customerPhone: profile?.phone ?? b.guest_phone ?? null,
    checkInDate: b.check_in_date,
    checkOutDate: b.check_out_date,
    nights: b.nights,
    adultCount: b.adult_count,
    childCount: b.child_count,
    roomTypeId: b.room_type_id,
    boardBasis: b.board_basis,
    tourismTaxTotal: Number(b.tourism_tax_total ?? 0),
  };
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
