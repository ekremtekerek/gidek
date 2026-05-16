import 'server-only';
import { getServerClient } from '@/lib/db/server';
import type { Database } from '@/types/supabase';

export type BookingRow = Database['public']['Tables']['bookings']['Row'];

export type BookingWithDeal = BookingRow & {
  deal:
    | (Pick<
        Database['public']['Tables']['deals']['Row'],
        | 'id'
        | 'slug'
        | 'title'
        | 'cover_image'
        | 'city'
        | 'district'
        | 'duration_minutes'
        | 'max_per_user'
      > & {
        merchant:
          | { name: string; lat: number | null; lng: number | null }
          | null;
      })
    | null;
};

const BOOKING_SELECT = `
  *,
  deal:deals (
    id, slug, title, cover_image, city, district, duration_minutes, max_per_user,
    merchant:merchants ( name, lat, lng )
  )
`;

/**
 * List the caller's bookings, newest first. RLS scopes results to the user.
 */
export async function listBookings(): Promise<BookingWithDeal[]> {
  const supabase = await getServerClient();
  const { data, error } = await supabase
    .from('bookings')
    .select(BOOKING_SELECT)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as BookingWithDeal[];
}

/**
 * Onaylanmış + tarihi bugün/sonra olan rezervasyonlar (en yakından
 * uzağa). Header'daki "yaklaşan rezervasyonlar" bell'i için.
 */
export async function listUpcomingBookings(limit = 5): Promise<BookingWithDeal[]> {
  const supabase = await getServerClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from('bookings')
    .select(BOOKING_SELECT)
    .eq('status', 'confirmed')
    .or(`selected_date.is.null,selected_date.gte.${today}`)
    .order('selected_date', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as unknown as BookingWithDeal[];
}

export async function getBookingByCode(code: string): Promise<BookingWithDeal | null> {
  const supabase = await getServerClient();
  const { data, error } = await supabase
    .from('bookings')
    .select(BOOKING_SELECT)
    .eq('booking_code', code)
    .maybeSingle();
  if (error) {
    // RLS hides bookings the user doesn't own — treat like "not found"
    return null;
  }
  return (data ?? null) as unknown as BookingWithDeal | null;
}
