'use server';

import { z } from 'zod';
import { getServerClient } from '@/lib/db/server';
import { requireUser } from '@/lib/security/auth';

export type ChatPostState =
  | { ok: true }
  | { ok: false; error: string }
  | null;

const postSchema = z.object({
  bookingCode: z.string().trim().min(4).max(40),
  body: z.string().trim().min(1, 'Boş gönderemezsin').max(500, 'En fazla 500 karakter'),
});

/**
 * Etkinlik sohbet odasına mesaj gönder. RLS policy zaten:
 *   - sender_id = auth.uid()
 *   - kullanıcının o odaya ait booking'i confirmed/used
 * koşullarını zorluyor. Burada room_key'i RPC ile build_event_room_key()
 * üzerinden türetiyoruz; insert sırasında policy yine doğrular.
 */
export async function postEventMessageAction(
  _prev: ChatPostState,
  formData: FormData,
): Promise<ChatPostState> {
  const user = await requireUser();

  const parsed = postSchema.safeParse({
    bookingCode: formData.get('bookingCode'),
    body: formData.get('body'),
  });
  if (!parsed.success) {
    const issue = parsed.error.flatten().fieldErrors;
    return { ok: false, error: issue.body?.[0] ?? 'Geçersiz mesaj.' };
  }

  const supabase = await getServerClient();

  // Booking'i çek → room_key türet
  const { data: booking } = await supabase
    .from('bookings')
    .select('deal_id, selected_date, selected_time, status, user_id')
    .eq('booking_code', parsed.data.bookingCode)
    .maybeSingle();

  if (!booking || booking.user_id !== user.id) {
    return { ok: false, error: 'Rezervasyon bulunamadı.' };
  }
  if (booking.status !== 'confirmed' && booking.status !== 'used') {
    return { ok: false, error: 'Bu rezervasyon henüz onaylı değil.' };
  }

  const { data: roomKey, error: keyErr } = await supabase.rpc('build_event_room_key', {
    p_deal_id: booking.deal_id,
    p_date: booking.selected_date,
    p_time: booking.selected_time,
  });
  if (keyErr || !roomKey) {
    return { ok: false, error: 'Sohbet odası açılamadı.' };
  }

  const { error: insErr } = await supabase.from('event_messages').insert({
    room_key: roomKey,
    sender_id: user.id,
    body: parsed.data.body,
  });
  if (insErr) {
    console.error('[chat] insert failed:', insErr);
    return { ok: false, error: 'Mesaj gönderilemedi.' };
  }

  return { ok: true };
}

export async function deleteEventMessageAction(messageId: string): Promise<{ ok: boolean }> {
  await requireUser();
  if (!/^[0-9a-f-]{36}$/i.test(messageId)) return { ok: false };

  const supabase = await getServerClient();
  // RLS self-delete policy ile kullanıcı yalnız kendi mesajını silebilir.
  const { error } = await supabase
    .from('event_messages')
    .delete()
    .eq('id', messageId);
  return { ok: !error };
}
