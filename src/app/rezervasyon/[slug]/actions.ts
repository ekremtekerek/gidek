'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getServerClient } from '@/lib/db/server';
import { requireUser } from '@/lib/security/auth';
import { createBookingSchema } from '@/lib/security/validators';
import { TOAST_KEYS, withToast } from '@/lib/utils/toast';

export interface BookingConflict {
  bookingCode: string;
  dealTitle: string;
  dealSlug: string;
  selectedDate: string;
  selectedTime: string | null;
}

export type CreateBookingState =
  | {
      ok: false;
      error?: string;
      fieldErrors?: Record<string, string[]>;
    }
  | {
      ok: false;
      warning: 'overlap';
      conflicts: BookingConflict[];
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
    is_gift: formData.get('is_gift'),
    gift_recipient_name: formData.get('gift_recipient_name'),
    gift_recipient_email: formData.get('gift_recipient_email'),
    gift_recipient_phone: formData.get('gift_recipient_phone'),
    gift_message: formData.get('gift_message'),
    insurance: formData.get('insurance'),
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

  // Çakışma kontrolü — aynı tarihte mevcut bir booking varsa kullanıcıyı
  // uyar. Kullanıcı `confirm_overlap=on` ile gönderirse devam edilir
  // (bilinçli ikinci rezervasyon yapıyor olabilir).
  const confirmOverlap = formData.get('confirm_overlap') === 'on';
  if (!confirmOverlap) {
    const { data: existing } = await supabase
      .from('bookings')
      .select(
        'booking_code, selected_date, selected_time, deal:deals ( title, slug )',
      )
      .eq('user_id', user.id)
      .eq('selected_date', parsed.data.selected_date)
      .in('status', ['pending', 'confirmed']);

    if (existing && existing.length > 0) {
      const conflicts = existing.map((b) => {
        const dealRel = b.deal as
          | { title: string; slug: string }
          | { title: string; slug: string }[]
          | null;
        const d = Array.isArray(dealRel) ? dealRel[0] : dealRel;
        return {
          bookingCode: b.booking_code,
          dealTitle: d?.title ?? '—',
          dealSlug: d?.slug ?? '',
          selectedDate: b.selected_date as string,
          selectedTime: b.selected_time as string | null,
        };
      });
      return { ok: false, warning: 'overlap', conflicts };
    }
  }

  const unitPrice = Number(deal.discounted_price);
  const subtotal = unitPrice * parsed.data.quantity;
  // Sigorta primi: subtotal'in %5'i (yuvarlanmış). Opt-in, default 0.
  const insuranceFee = parsed.data.insurance ? Math.round(subtotal * 0.05 * 100) / 100 : 0;
  const total = subtotal + insuranceFee;

  // Kupon, ödeme sayfasında ayrı bir aksiyonla uygulanır — burada her zaman
  // full subtotal+insurance'le insert ediyoruz.
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
      status: 'pending',
      is_gift: parsed.data.is_gift,
      gift_message: parsed.data.is_gift ? (parsed.data.gift_message ?? null) : null,
      guest_name: parsed.data.is_gift ? (parsed.data.gift_recipient_name ?? null) : null,
      guest_email: parsed.data.is_gift ? (parsed.data.gift_recipient_email ?? null) : null,
      guest_phone: parsed.data.is_gift ? (parsed.data.gift_recipient_phone ?? null) : null,
      insurance_purchased: parsed.data.insurance,
      insurance_fee: insuranceFee,
    })
    .select('booking_code')
    .single();

  if (bErr || !booking) return { ok: false, error: 'Rezervasyon oluşturulamadı.' };

  revalidatePath('/rezervasyonlarim');
  redirect(withToast(`/odeme/${booking.booking_code}`, TOAST_KEYS.bookingCreated));
}
