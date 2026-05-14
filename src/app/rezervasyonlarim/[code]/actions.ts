'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getServerClient } from '@/lib/db/server';
import { requireUser } from '@/lib/security/auth';

const cancelSchema = z.object({
  bookingId: z.string().uuid('Geçersiz rezervasyon tanımlayıcısı'),
});

export type CancelBookingResult = { ok: true } | { ok: false; error: string };

export type ExtendBookingResult =
  | { ok: true; newQuantity: number; newTotal: number }
  | { ok: false; error: string };

/**
 * Cancel an own booking via the security-definer public.cancel_booking RPC,
 * which enforces ownership + status transition in SQL so the path can't be
 * coerced into mutating other users' data.
 */
export async function cancelBookingAction(bookingId: string): Promise<CancelBookingResult> {
  const parsed = cancelSchema.safeParse({ bookingId });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Geçersiz istek' };
  }

  await requireUser();
  const supabase = await getServerClient();

  const { error } = await supabase.rpc('cancel_booking', {
    p_booking_id: parsed.data.bookingId,
  });
  if (error) {
    return { ok: false, error: 'İptal sırasında bir sorun oluştu.' };
  }

  revalidatePath('/rezervasyonlarim');
  return { ok: true };
}

/**
 * Mevcut booking'e +1 kişi ekle. RPC ownership + max_per_user kontrolünü
 * yapar. Sigortalı rezervasyonlarda sigorta primi yeni subtotal'e göre
 * tekrar hesaplanır.
 */
export async function extendBookingAction(bookingId: string): Promise<ExtendBookingResult> {
  const parsed = cancelSchema.safeParse({ bookingId });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Geçersiz istek' };
  }

  await requireUser();
  const supabase = await getServerClient();

  const { data, error } = await supabase.rpc('extend_booking', {
    p_booking_id: parsed.data.bookingId,
  });
  if (error) {
    if (error.message?.includes('max_per_user_exceeded')) {
      return { ok: false, error: 'Bu fırsat için maksimum kişi sayısına ulaştın.' };
    }
    if (error.message?.includes('not extendable')) {
      return { ok: false, error: 'Bu rezervasyon artık güncellenebilir durumda değil.' };
    }
    return { ok: false, error: 'Kişi eklenemedi.' };
  }

  const row = Array.isArray(data) ? data[0] : data;
  revalidatePath('/rezervasyonlarim');
  revalidatePath(`/rezervasyonlarim/${row?.booking_code ?? ''}`);
  return {
    ok: true,
    newQuantity: row?.quantity ?? 0,
    newTotal: Number(row?.total_amount ?? 0),
  };
}
