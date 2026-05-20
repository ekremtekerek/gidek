'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { quoteBooking, type ConfirmBookingState } from '@/lib/booking/agent-booking';
import { getServerClient } from '@/lib/db/server';
import { requireUser } from '@/lib/security/auth';
import { TOAST_KEYS, withToast } from '@/lib/utils/toast';

/**
 * AI sohbetteki rezervasyon onay kartının submit handler'ı. Kullanıcı kartta
 * "oluştur"a basınca: kimlik doğrula → fırsatı YENİDEN doğrula (kart açıkken
 * fiyat/geçerlilik değişmiş olabilir) → pending booking yaz → ödeme sayfasına
 * yönlendir. Otel fırsatları quoteBooking tarafından zaten reddedilir.
 */
export async function confirmAgentBookingAction(
  _prev: ConfirmBookingState,
  formData: FormData,
): Promise<ConfirmBookingState> {
  const user = await requireUser();

  const dealId = String(formData.get('dealId') ?? '');
  const quantity = Number(formData.get('quantity') ?? '0');
  const date = String(formData.get('date') ?? '');
  const timeRaw = formData.get('time');
  const time = timeRaw && String(timeRaw).length > 0 ? String(timeRaw) : null;

  const quote = await quoteBooking({
    dealId,
    quantity,
    selectedDate: date,
    selectedTime: time,
  });
  if (!quote.ok) {
    return { ok: false, error: quote.message };
  }

  const supabase = await getServerClient();
  const { data: booking, error } = await supabase
    .from('bookings')
    .insert({
      user_id: user.id,
      deal_id: quote.dealId,
      quantity: quote.quantity,
      unit_price: quote.unitPrice,
      total_amount: quote.total,
      currency: quote.currency,
      selected_date: quote.selectedDate,
      selected_time: quote.selectedTime,
      status: 'pending',
      is_gift: false,
      insurance_purchased: false,
      insurance_fee: 0,
    })
    .select('booking_code')
    .single();

  if (error || !booking) {
    return { ok: false, error: 'Rezervasyon oluşturulamadı. Lütfen tekrar dene.' };
  }

  revalidatePath('/rezervasyonlarim');
  redirect(withToast(`/odeme/${booking.booking_code}`, TOAST_KEYS.bookingCreated));
}
