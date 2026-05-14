'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getServerClient } from '@/lib/db/server';
import { requireUser } from '@/lib/security/auth';
import { createBookingSchema } from '@/lib/security/validators';
import { TOAST_KEYS, withToast } from '@/lib/utils/toast';

export type CreateBookingState =
  | {
      ok: false;
      error?: string;
      fieldErrors?: Record<string, string[]>;
    }
  | null;

export async function createBookingAction(
  _prev: CreateBookingState,
  formData: FormData,
): Promise<CreateBookingState> {
  const user = await requireUser();
  const supabase = await getServerClient();

  const parsed = createBookingSchema.safeParse({
    dealId: formData.get('dealId'),
    quantity: formData.get('quantity'),
    selected_date: formData.get('selected_date'),
    selected_time: formData.get('selected_time'),
    notes: formData.get('notes'),
  });

  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { data: deal, error: dErr } = await supabase
    .from('deals')
    .select('id, discounted_price, currency, max_per_user, valid_until, is_active, published_at')
    .eq('id', parsed.data.dealId)
    .maybeSingle();

  if (dErr || !deal) return { ok: false, error: 'Fırsat bulunamadı.' };
  if (!deal.is_active || !deal.published_at || new Date(deal.valid_until) < new Date()) {
    return { ok: false, error: 'Bu fırsat artık geçerli değil.' };
  }
  if (parsed.data.quantity > deal.max_per_user) {
    return { ok: false, error: `En fazla ${deal.max_per_user} adet seçilebilir.` };
  }

  const unitPrice = Number(deal.discounted_price);
  const total = unitPrice * parsed.data.quantity;

  // Kupon, ödeme sayfasında ayrı bir aksiyonla uygulanır — burada her zaman
  // full subtotal'le insert ediyoruz.
  const { data: booking, error: bErr } = await supabase
    .from('bookings')
    .insert({
      user_id: user.id,
      deal_id: deal.id,
      quantity: parsed.data.quantity,
      unit_price: unitPrice,
      total_amount: total,
      currency: deal.currency,
      selected_date: parsed.data.selected_date,
      selected_time: parsed.data.selected_time ?? null,
      notes: parsed.data.notes ?? null,
      status: 'pending', // ödeme adımından sonra 'confirmed'e geçer
    })
    .select('booking_code')
    .single();

  if (bErr || !booking) return { ok: false, error: 'Rezervasyon oluşturulamadı.' };

  revalidatePath('/rezervasyonlarim');
  redirect(withToast(`/odeme/${booking.booking_code}`, TOAST_KEYS.bookingCreated));
}
