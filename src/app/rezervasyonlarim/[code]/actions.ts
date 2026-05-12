'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getServerClient } from '@/lib/db/server';
import { requireUser } from '@/lib/security/auth';

const cancelSchema = z.object({
  bookingId: z.string().uuid('Geçersiz rezervasyon tanımlayıcısı'),
});

export type CancelBookingResult = { ok: true } | { ok: false; error: string };

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
