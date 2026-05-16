import 'server-only';
import { getPublicClient } from '@/lib/db/public';
import { getServerClient } from '@/lib/db/server';

export interface HotelMeta {
  star_rating: number | null;
  check_in_time: string;
  check_out_time: string;
  concept: string | null;
  has_beach_access: boolean;
  has_private_beach: boolean;
  has_pool: boolean;
  has_indoor_pool: boolean;
  has_spa: boolean;
  has_hamam: boolean;
  has_sauna: boolean;
  has_gym: boolean;
  has_aquapark: boolean;
  has_kids_club: boolean;
  has_kids_pool: boolean;
  has_restaurant: boolean;
  has_bar: boolean;
  has_room_service: boolean;
  has_parking: boolean;
  has_valet: boolean;
  has_wifi: boolean;
  has_aircon: boolean;
  has_breakfast: boolean;
  has_transfer: boolean;
  has_laundry: boolean;
  has_business_center: boolean;
  has_meeting_room: boolean;
  has_disabled_access: boolean;
  pet_friendly: boolean;
  smoking_allowed: boolean;
  cancellation_policy: string | null;
  child_policy: string | null;
  pet_policy: string | null;
  extra_bed_available: boolean;
  extra_bed_price: number | null;
  distance_to_beach_m: number | null;
  distance_to_center_m: number | null;
  distance_to_airport_km: number | null;
  tourism_tax_per_night: number;
  total_rooms: number | null;
}

export interface HotelRoom {
  id: string;
  name: string;
  description: string | null;
  capacity_adults: number;
  capacity_children: number;
  bed_setup: string | null;
  size_sqm: number | null;
  view_type: string | null;
  base_price_per_night: number;
  board_basis: string;
  cover_image: string | null;
  has_balcony: boolean;
  has_jacuzzi: boolean;
  has_kitchenette: boolean;
  has_minibar: boolean;
  has_safe: boolean;
}

/**
 * Otel detay sayfası için meta + aktif oda tipleri. RLS public-deals'a uyumlu
 * (sadece yayında olan deal'lar için satır döner). Otel olmayan deal'larda
 * her ikisi de boş döner.
 */
export async function getHotelDataForDeal(
  dealId: string,
): Promise<{ meta: HotelMeta | null; rooms: HotelRoom[] }> {
  const supabase = getPublicClient();
  const [{ data: meta }, { data: rooms }] = await Promise.all([
    supabase
      .from('deal_hotel_meta')
      .select('*')
      .eq('deal_id', dealId)
      .maybeSingle(),
    supabase
      .from('deal_room_types')
      .select(
        'id, name, description, capacity_adults, capacity_children, bed_setup, size_sqm, view_type, base_price_per_night, board_basis, cover_image, has_balcony, has_jacuzzi, has_kitchenette, has_minibar, has_safe',
      )
      .eq('deal_id', dealId)
      .eq('is_active', true)
      .order('base_price_per_night', { ascending: true }),
  ]);

  return {
    meta: meta
      ? ({
          ...meta,
          tourism_tax_per_night: Number(meta.tourism_tax_per_night),
          extra_bed_price: meta.extra_bed_price !== null ? Number(meta.extra_bed_price) : null,
          distance_to_airport_km:
            meta.distance_to_airport_km !== null ? Number(meta.distance_to_airport_km) : null,
        } as HotelMeta)
      : null,
    rooms: (rooms ?? []).map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      capacity_adults: r.capacity_adults,
      capacity_children: r.capacity_children,
      bed_setup: r.bed_setup,
      size_sqm: r.size_sqm,
      view_type: r.view_type,
      base_price_per_night: Number(r.base_price_per_night),
      board_basis: r.board_basis,
      cover_image: r.cover_image,
      has_balcony: r.has_balcony,
      has_jacuzzi: r.has_jacuzzi,
      has_kitchenette: r.has_kitchenette,
      has_minibar: r.has_minibar,
      has_safe: r.has_safe,
    })),
  };
}

// ---------------------------------------------------------------------------
// Booking-side hotel extras (room + guests) — odeme / rezervasyonlarim pages
// ---------------------------------------------------------------------------

export interface BookingRoomInfo {
  id: string;
  name: string;
  bed_setup: string | null;
  size_sqm: number | null;
  view_type: string | null;
  board_basis: string;
  capacity_adults: number;
  capacity_children: number;
}

export interface BookingGuest {
  id: string;
  guest_type: 'adult' | 'child';
  guest_index: number;
  first_name: string;
  last_name: string;
  nationality: string;
  national_id: string | null;
  passport_no: string | null;
  birth_date: string;
  gender: string | null;
  phone: string | null;
  email: string | null;
  is_lead: boolean;
}

/**
 * Booking için otel ekleri — seçili oda detayları + misafir listesi. RLS
 * gereği sadece booking sahibi (veya admin/merchant) görebilir; aksi halde
 * her ikisi de null/empty döner.
 */
export async function getHotelExtrasForBooking(
  bookingId: string,
  roomTypeId: string | null,
): Promise<{ room: BookingRoomInfo | null; guests: BookingGuest[] }> {
  const supabase = await getServerClient();
  const [{ data: room }, { data: guests }] = await Promise.all([
    roomTypeId
      ? supabase
          .from('deal_room_types')
          .select(
            'id, name, bed_setup, size_sqm, view_type, board_basis, capacity_adults, capacity_children',
          )
          .eq('id', roomTypeId)
          .maybeSingle()
      : Promise.resolve({ data: null as never }),
    supabase
      .from('booking_guests')
      .select(
        'id, guest_type, guest_index, first_name, last_name, nationality, national_id, passport_no, birth_date, gender, phone, email, is_lead',
      )
      .eq('booking_id', bookingId)
      .order('is_lead', { ascending: false })
      .order('guest_type', { ascending: true })
      .order('guest_index', { ascending: true }),
  ]);

  return {
    room: room
      ? {
          id: room.id,
          name: room.name,
          bed_setup: room.bed_setup,
          size_sqm: room.size_sqm,
          view_type: room.view_type,
          board_basis: room.board_basis,
          capacity_adults: room.capacity_adults,
          capacity_children: room.capacity_children,
        }
      : null,
    guests: ((guests ?? []) as unknown as BookingGuest[]),
  };
}
