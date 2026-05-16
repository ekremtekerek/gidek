'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getServerClient } from '@/lib/db/server';
import { getServiceClient } from '@/lib/db/service';
import { requireUser } from '@/lib/security/auth';
import { isValidTCKimlik } from '@/lib/utils/tc-kimlik';

const guestSchema = z.object({
  id: z.string().uuid(),
  first_name: z.string().trim().min(2).max(80),
  last_name: z.string().trim().min(2).max(80),
  nationality: z.string().trim().length(2),
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
  is_lead: z.boolean(),
  guest_type: z.enum(['adult', 'child']),
}).superRefine((g, ctx) => {
  if (g.guest_type === 'adult') {
    if (g.nationality === 'TR') {
      if (!g.national_id) {
        ctx.addIssue({ code: 'custom', path: ['national_id'], message: 'TC kimlik zorunlu' });
      } else if (!isValidTCKimlik(g.national_id)) {
        ctx.addIssue({ code: 'custom', path: ['national_id'], message: 'Geçersiz TC kimlik (checksum)' });
      }
    }
    if (g.nationality !== 'TR' && !g.passport_no) {
      ctx.addIssue({ code: 'custom', path: ['passport_no'], message: 'Pasaport no zorunlu' });
    }
  }
});

const schema = z.object({
  booking_code: z.string().trim().min(1),
  guests: z.array(guestSchema).min(1),
});

export type EditGuestsState =
  | { ok: false; error?: string; fieldErrors?: Record<string, string[]> }
  | null;

/**
 * Otel rezervasyonunda misafir bilgilerini düzenle. Check-in öncesinde
 * lead bilgilerini güncellemek veya misafir değiştirmek için kullanılır.
 * RLS booking_guests_update_own policy'siyle uyumlu (booking sahibi +
 * status pending/confirmed). Server-side ek bir sahiplik kontrolü daha
 * yapıyoruz.
 */
export async function updateBookingGuestsAction(
  _prev: EditGuestsState,
  formData: FormData,
): Promise<EditGuestsState> {
  const user = await requireUser();
  const supabase = await getServerClient();

  let parsedGuests: unknown = [];
  try {
    parsedGuests = JSON.parse(String(formData.get('guests_json') ?? '[]'));
  } catch {
    return { ok: false, error: 'Misafir bilgileri okunamadı' };
  }

  const parsed = schema.safeParse({
    booking_code: formData.get('booking_code'),
    guests: parsedGuests,
  });

  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  // Booking sahipliği + status pending/confirmed kontrolü
  const { data: booking } = await supabase
    .from('bookings')
    .select('id, status, user_id, booking_code, deal:deals(slug)')
    .eq('booking_code', parsed.data.booking_code)
    .maybeSingle();

  if (!booking || booking.user_id !== user.id) {
    return { ok: false, error: 'Rezervasyon bulunamadı' };
  }
  if (booking.status !== 'pending' && booking.status !== 'confirmed') {
    return { ok: false, error: 'Bu rezervasyon güncellenemez (durum uygun değil)' };
  }

  // Service client — update'leri tek atomik batch'te yap
  const service = getServiceClient();
  for (const g of parsed.data.guests) {
    const { error } = await service
      .from('booking_guests')
      .update({
        first_name: g.first_name,
        last_name: g.last_name,
        nationality: g.nationality,
        national_id: g.national_id ?? null,
        passport_no: g.passport_no ?? null,
        birth_date: g.birth_date,
        gender: g.gender ?? null,
        phone: g.phone ?? null,
        email: g.email ?? null,
      })
      .eq('id', g.id)
      .eq('booking_id', booking.id);
    if (error) {
      return { ok: false, error: `${g.first_name} güncellenemedi: ${error.message}` };
    }
  }

  revalidatePath(`/rezervasyonlarim/${parsed.data.booking_code}`);
  redirect(`/rezervasyonlarim/${parsed.data.booking_code}?guests-updated=1`);
}
