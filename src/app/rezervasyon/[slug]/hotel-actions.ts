'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getServerClient } from '@/lib/db/server';
import { getServiceClient } from '@/lib/db/service';
import { requireUser } from '@/lib/security/auth';
import { isValidTCKimlik } from '@/lib/utils/tc-kimlik';
import { TOAST_KEYS, withToast } from '@/lib/utils/toast';

/**
 * Otel/tatil rezervasyonu — multi-step wizard'ın submit handler'ı. Mevcut
 * `createBookingAction` etkinlik/aktivite için kalır; bu fonksiyon yalnızca
 * tatil/otel deal'larında çağrılır (kategori `tatil-otelleri` / `sehir-otelleri`).
 *
 * Adımlar:
 *   1) Tarihler + yetişkin/çocuk sayısı
 *   2) Oda tipi seçimi
 *   3) Her yetişkin için kimlik bilgisi (TC veya pasaport), her çocuk için
 *      doğum tarihi — KVKK + Konaklama Tesisleri Yönetmeliği uyumu
 *   4) Özet + politikalar onayı + (mock) ödeme
 *
 * Fiyat: room.base_price_per_night × nights + (tourism_tax × adults × nights)
 */

// ----------------------------------------------------------------------------
// Validation
// ----------------------------------------------------------------------------
const guestSchema = z.object({
  guest_type: z.enum(['adult', 'child']),
  guest_index: z.number().int().min(0).max(20),
  first_name: z.string().trim().min(2).max(80),
  last_name: z.string().trim().min(2).max(80),
  nationality: z.string().trim().length(2).default('TR'),
  national_id: z.string().trim().regex(/^[0-9]{11}$/).optional()
    .or(z.literal('').transform(() => undefined)),
  passport_no: z.string().trim().min(4).max(20).optional()
    .or(z.literal('').transform(() => undefined)),
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  gender: z.enum(['M', 'F', 'other']).optional()
    .or(z.literal('').transform(() => undefined)),
  phone: z.string().trim().min(7).max(30).optional()
    .or(z.literal('').transform(() => undefined)),
  email: z.string().email().optional()
    .or(z.literal('').transform(() => undefined)),
  is_lead: z.boolean().default(false),
  room_index: z.number().int().min(0).max(20).optional(),
}).superRefine((g, ctx) => {
  // Yetişkin TR vatandaşı için TC zorunlu + checksum; yabancı için pasaport
  if (g.guest_type === 'adult') {
    if (g.nationality === 'TR') {
      if (!g.national_id) {
        ctx.addIssue({ code: 'custom', path: ['national_id'], message: 'TC kimlik zorunlu (yetişkin)' });
      } else if (!isValidTCKimlik(g.national_id)) {
        ctx.addIssue({ code: 'custom', path: ['national_id'], message: 'Geçersiz TC kimlik (checksum)' });
      }
    }
    if (g.nationality !== 'TR' && !g.passport_no) {
      ctx.addIssue({ code: 'custom', path: ['passport_no'], message: 'Pasaport no zorunlu (yabancı yetişkin)' });
    }
  }
});

const hotelBookingSchema = z.object({
  deal_id: z.string().uuid(),
  room_type_id: z.string().uuid(),
  check_in_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  check_out_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  adult_count: z.coerce.number().int().min(1).max(12),
  child_count: z.coerce.number().int().min(0).max(8),
  guests: z.array(guestSchema).min(1),
  special_requests: z.string().trim().max(500).optional()
    .or(z.literal('').transform(() => undefined)),
  accept_policies: z.literal('on', { message: 'Politikaları onaylamanız gerekiyor' }),
}).superRefine((d, ctx) => {
  const ci = new Date(d.check_in_date);
  const co = new Date(d.check_out_date);
  if (co <= ci) {
    ctx.addIssue({ code: 'custom', path: ['check_out_date'], message: 'Çıkış girişten sonra olmalı' });
  }
  if (ci < new Date(new Date().toISOString().slice(0, 10))) {
    ctx.addIssue({ code: 'custom', path: ['check_in_date'], message: 'Giriş tarihi geçmişte olamaz' });
  }
  const adults = d.guests.filter((g) => g.guest_type === 'adult').length;
  const kids = d.guests.filter((g) => g.guest_type === 'child').length;
  if (adults !== d.adult_count) {
    ctx.addIssue({ code: 'custom', path: ['guests'], message: `${d.adult_count} yetişkin doldurulmalı` });
  }
  if (kids !== d.child_count) {
    ctx.addIssue({ code: 'custom', path: ['guests'], message: `${d.child_count} çocuk doldurulmalı` });
  }
  const leadCount = d.guests.filter((g) => g.is_lead).length;
  if (leadCount !== 1) {
    ctx.addIssue({ code: 'custom', path: ['guests'], message: 'Tam olarak 1 lead misafir olmalı' });
  }
});

export type CreateHotelBookingState =
  | { ok: false; error?: string; fieldErrors?: Record<string, string[]> }
  | null;

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------
function daysBetween(checkIn: string, checkOut: string): number {
  const ci = new Date(checkIn);
  const co = new Date(checkOut);
  return Math.round((co.getTime() - ci.getTime()) / 86_400_000);
}

// ----------------------------------------------------------------------------
// Action
// ----------------------------------------------------------------------------
export async function createHotelBookingAction(
  _prev: CreateHotelBookingState,
  formData: FormData,
): Promise<CreateHotelBookingState> {
  const user = await requireUser();
  const supabase = await getServerClient();

  // guests JSON string olarak gelir
  const guestsRaw = formData.get('guests_json');
  let guestsParsed: unknown = [];
  try {
    guestsParsed = JSON.parse(String(guestsRaw ?? '[]'));
  } catch {
    return { ok: false, error: 'Misafir bilgileri okunamadı' };
  }

  const parsed = hotelBookingSchema.safeParse({
    deal_id: formData.get('deal_id'),
    room_type_id: formData.get('room_type_id'),
    check_in_date: formData.get('check_in_date'),
    check_out_date: formData.get('check_out_date'),
    adult_count: formData.get('adult_count'),
    child_count: formData.get('child_count'),
    guests: guestsParsed,
    special_requests: formData.get('special_requests'),
    accept_policies: formData.get('accept_policies'),
  });

  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const d = parsed.data;

  // Deal + room + meta birlikte çek
  const [{ data: deal }, { data: room }, { data: meta }] = await Promise.all([
    supabase.from('deals').select('id, currency, max_per_user, slug').eq('id', d.deal_id).maybeSingle(),
    supabase.from('deal_room_types')
      .select('id, deal_id, name, capacity_adults, capacity_children, base_price_per_night, board_basis, is_active, total_units')
      .eq('id', d.room_type_id).maybeSingle(),
    supabase.from('deal_hotel_meta')
      .select('tourism_tax_per_night, cancellation_policy, child_policy')
      .eq('deal_id', d.deal_id).maybeSingle(),
  ]);

  if (!deal) return { ok: false, error: 'Deal bulunamadı' };
  if (!room || !room.is_active || room.deal_id !== d.deal_id) {
    return { ok: false, error: 'Geçersiz oda tipi' };
  }
  if (d.adult_count > room.capacity_adults) {
    return { ok: false, fieldErrors: { adult_count: [`Bu oda en fazla ${room.capacity_adults} yetişkin alır`] } };
  }
  if (d.child_count > room.capacity_children) {
    return { ok: false, fieldErrors: { child_count: [`Bu oda en fazla ${room.capacity_children} çocuk alır`] } };
  }

  const nights = daysBetween(d.check_in_date, d.check_out_date);
  if (nights < 1) {
    return { ok: false, fieldErrors: { check_out_date: ['En az 1 gece konaklama olmalı'] } };
  }

  // ---- Overlap (yatak envanteri) kontrolü ----
  // Aynı oda tipi için aktif (pending/confirmed) booking'lerde tarih aralığı
  // çakışan satır sayısı >= total_units ise rezervasyon reject. İki aralık
  // çakışır iff: existing.check_in < new.check_out AND existing.check_out > new.check_in.
  if (room.total_units && room.total_units > 0) {
    const service = getServiceClient();
    const { count: overlapCount, error: overlapErr } = await service
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('room_type_id', room.id)
      .in('status', ['pending', 'confirmed'])
      .lt('check_in_date', d.check_out_date)
      .gt('check_out_date', d.check_in_date);
    if (overlapErr) {
      return { ok: false, error: `Müsaitlik kontrolü başarısız: ${overlapErr.message}` };
    }
    if ((overlapCount ?? 0) >= room.total_units) {
      return {
        ok: false,
        fieldErrors: {
          room_type_id: [
            `Seçtiğin tarihlerde "${room.name}" tipinde müsait oda kalmadı (${room.total_units} ünitenin tamamı dolu). Farklı tarih veya oda dene.`,
          ],
        },
      };
    }
  }

  const unitPrice = Number(room.base_price_per_night);
  const roomSubtotal = Math.round(unitPrice * nights * 100) / 100;
  const taxPerNight = Number(meta?.tourism_tax_per_night ?? 0);
  const tourismTaxTotal = Math.round(taxPerNight * d.adult_count * nights * 100) / 100;
  const total = roomSubtotal + tourismTaxTotal;

  // 1) Booking insert
  const { data: booking, error: bErr } = await supabase
    .from('bookings')
    .insert({
      user_id: user.id,
      deal_id: deal.id,
      quantity: d.adult_count + d.child_count,
      unit_price: unitPrice,
      total_amount: total,
      currency: deal.currency,
      // Otel alanları
      check_in_date: d.check_in_date,
      check_out_date: d.check_out_date,
      nights,
      adult_count: d.adult_count,
      child_count: d.child_count,
      room_type_id: room.id,
      board_basis: room.board_basis,
      tourism_tax_total: tourismTaxTotal,
      // Mevcut alanlar (UYUMLULUK)
      selected_date: d.check_in_date, // mevcut takvim/listeleme için giriş = selected_date
      notes: d.special_requests ?? null,
      status: 'pending',
      is_gift: false,
      insurance_purchased: false,
      insurance_fee: 0,
    })
    .select('id, booking_code')
    .single();

  if (bErr || !booking) {
    return { ok: false, error: `Rezervasyon yazılamadı: ${bErr?.message ?? 'bilinmeyen hata'}` };
  }

  // 2) Misafirleri insert — service client ile (RLS kendi booking için izin
  //    verir ama atomic INSERT'i garantiye almak için server-side service'i
  //    kullanıyoruz; user_id zaten yukarıda doğrulandı).
  const service = getServiceClient();
  const guestRows = d.guests.map((g) => ({
    booking_id: booking.id,
    guest_type: g.guest_type,
    guest_index: g.guest_index,
    first_name: g.first_name,
    last_name: g.last_name,
    national_id: g.national_id ?? null,
    passport_no: g.passport_no ?? null,
    nationality: g.nationality,
    birth_date: g.birth_date,
    gender: g.gender ?? null,
    phone: g.phone ?? null,
    email: g.email ?? null,
    is_lead: g.is_lead,
    room_index: g.room_index ?? null,
  }));
  const { error: gErr } = await service.from('booking_guests').insert(guestRows);
  if (gErr) {
    // Booking insert oldu ama guest fail — booking'i rollback için iptal et
    await service.from('bookings').delete().eq('id', booking.id);
    return { ok: false, error: `Misafir bilgileri yazılamadı: ${gErr.message}` };
  }

  revalidatePath('/rezervasyonlarim');
  redirect(withToast(`/odeme/${booking.booking_code}`, TOAST_KEYS.bookingCreated));
}
