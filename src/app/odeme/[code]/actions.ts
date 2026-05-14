'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getServerClient } from '@/lib/db/server';
import { sendEmail } from '@/lib/email/send';
import { bookingConfirmedEmail } from '@/lib/email/templates';
import { evaluateAndGrantBadges } from '@/lib/gamification/badges';
import { maybeClaimCityBingo } from '@/lib/gamification/bingo';
import { evaluateLoyaltyRewards } from '@/lib/gamification/loyalty-rewards';
import { updateStreak } from '@/lib/gamification/streak';
import { requireUser } from '@/lib/security/auth';
import { TOAST_KEYS, withToast } from '@/lib/utils/toast';

export type PaymentState =
  | {
      ok: false;
      error?: string;
      fieldErrors?: Record<string, string[]>;
    }
  | null;

const luhnDigits = /^[0-9]{13,19}$/;
const expirySchema = z
  .string()
  .trim()
  .regex(/^\d{2}\s*\/\s*\d{2}$/, 'AA / YY formatı')
  .transform((v) => v.replace(/\s/g, ''));

const formSchema = z.object({
  bookingCode: z.string().min(4).max(40),
  cardHolder: z
    .string()
    .trim()
    .min(2, 'En az 2 karakter')
    .max(60, 'En fazla 60 karakter'),
  cardNumber: z
    .string()
    .trim()
    .transform((v) => v.replace(/\s+/g, ''))
    .pipe(z.string().regex(luhnDigits, 'Kart numarası 13-19 hane olmalı')),
  expiry: expirySchema,
  cvv: z
    .string()
    .trim()
    .regex(/^[0-9]{3,4}$/, 'CVV 3-4 hane olmalı'),
});

/**
 * Mock ödeme akışı — kart bilgileri DB'ye yazılmaz, tahsilat yapılmaz.
 * Sadece bekleyen rezervasyonu 'confirmed' durumuna yükseltir.
 * 1.2sn yapay gecikme ile "ödeme işleniyor" hissi.
 */
export async function confirmPaymentAction(
  _prev: PaymentState,
  formData: FormData,
): Promise<PaymentState> {
  const user = await requireUser();

  const parsed = formSchema.safeParse({
    bookingCode: formData.get('bookingCode'),
    cardHolder: formData.get('cardHolder'),
    cardNumber: formData.get('cardNumber'),
    expiry: formData.get('expiry'),
    cvv: formData.get('cvv'),
  });

  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const supabase = await getServerClient();
  const { data: booking, error: bErr } = await supabase
    .from('bookings')
    .select(
      'id, user_id, status, quantity, total_amount, selected_date, selected_time, deal:deals ( title, city )',
    )
    .eq('booking_code', parsed.data.bookingCode)
    .maybeSingle();

  if (bErr || !booking) return { ok: false, error: 'Rezervasyon bulunamadı.' };
  if (booking.user_id !== user.id) return { ok: false, error: 'Bu rezervasyon size ait değil.' };
  if (booking.status === 'cancelled') return { ok: false, error: 'Bu rezervasyon iptal edilmiş.' };
  if (booking.status === 'used') return { ok: false, error: 'Bu rezervasyon kullanılmış.' };

  // Yapay gecikme — "ödeme işleniyor" hissi için.
  await new Promise((r) => setTimeout(r, 1200));

  if (booking.status === 'pending') {
    // bookings tablosunda doğrudan UPDATE RLS policy'si yok; security-definer
    // RPC üzerinden 'pending' → 'confirmed' geçişini yapıyoruz.
    const { error: rpcErr } = await supabase.rpc('confirm_booking_payment', {
      p_booking_id: booking.id,
    });
    if (rpcErr) return { ok: false, error: 'Ödeme kaydedilemedi.' };

    // Streak'i önce güncelle, sonra rozetleri değerlendir — streak_weeks
    // criteria_type=streak_weeks rozetinin kazanımını doğru yakalayalım.
    // Şehir bingosunu da burada tetikliyoruz; idempotent RPC.
    const dealCity = (Array.isArray(booking.deal)
      ? (booking.deal as Array<{ city: string | null }>)[0]?.city
      : (booking.deal as { city: string | null } | null)?.city) ?? null;
    void (async () => {
      try {
        await updateStreak(user.id);
        await evaluateAndGrantBadges(user.id);
        await evaluateLoyaltyRewards(user.id);
        if (dealCity) await maybeClaimCityBingo(user.id, dealCity);
      } catch (err) {
        console.error('[gamification] post-confirm failed:', err);
      }
    })();
  }

  // Onay e-postasını fire-and-forget olarak gönder; kullanıcının akışını
  // bloklamasın, başarısız olursa sessizce log'la.
  const dealRel = booking.deal as { title: string } | { title: string }[] | null;
  const dealTitle = Array.isArray(dealRel) ? dealRel[0]?.title : dealRel?.title;
  if (user.email && dealTitle) {
    const displayName =
      (user.user_metadata as Record<string, unknown> | null)?.display_name?.toString() ??
      user.email.split('@')[0];
    void sendEmail(
      bookingConfirmedEmail({
        to: user.email,
        name: displayName,
        bookingCode: parsed.data.bookingCode,
        dealTitle,
        selectedDate: booking.selected_date,
        selectedTime: booking.selected_time,
        quantity: booking.quantity,
        totalAmount: booking.total_amount,
      }),
    ).catch((err) => console.error('[email] booking confirmed failed:', err));
  }

  revalidatePath('/rezervasyonlarim');
  redirect(withToast(`/rezervasyonlarim/${parsed.data.bookingCode}`, TOAST_KEYS.paymentSuccess));
}

// ---------------------------------------------------------------------------
// Promo kod uygulama / kaldırma — ödeme sayfasında "pending" booking üzerinde
// çağrılır. apply_coupon_to_booking RPC subtotal'i unit_price * quantity'den
// yeniden hesaplar; daha önce uygulanmış kuponun etkisi temizlenir.
// ---------------------------------------------------------------------------

export type CouponState =
  | { ok: true; message?: string }
  | { ok: false; error: string }
  | null;

const applySchema = z.object({
  bookingCode: z.string().trim().min(4).max(40),
  code: z
    .string()
    .trim()
    .min(2, 'Kupon kodu en az 2 karakter olmalı')
    .max(40, 'Kupon kodu çok uzun'),
});

const removeSchema = z.object({
  bookingCode: z.string().trim().min(4).max(40),
});

function couponReasonLabel(reason: string): string {
  switch (reason) {
    case 'not_found':
      return 'Geçersiz kod';
    case 'inactive':
      return 'Bu kupon artık aktif değil';
    case 'not_started':
      return 'Kupon henüz başlamadı';
    case 'expired':
      return 'Kuponun süresi dolmuş';
    case 'max_uses':
      return 'Kupon kullanım limiti dolmuş';
    case 'min_amount':
      return 'Sepet tutarı bu kupon için yetersiz';
    case 'empty':
      return 'Kod girmelisin';
    default:
      return 'Kupon uygulanamadı';
  }
}

export async function applyCouponAction(
  _prev: CouponState,
  formData: FormData,
): Promise<CouponState> {
  const user = await requireUser();

  const parsed = applySchema.safeParse({
    bookingCode: formData.get('bookingCode'),
    code: formData.get('code'),
  });
  if (!parsed.success) {
    const issue = parsed.error.flatten().fieldErrors;
    return { ok: false, error: issue.code?.[0] ?? 'Geçersiz istek.' };
  }

  const supabase = await getServerClient();
  const { data: booking, error: bErr } = await supabase
    .from('bookings')
    .select('id, user_id, status')
    .eq('booking_code', parsed.data.bookingCode)
    .maybeSingle();

  if (bErr || !booking) return { ok: false, error: 'Rezervasyon bulunamadı.' };
  if (booking.user_id !== user.id) return { ok: false, error: 'Bu rezervasyon size ait değil.' };
  if (booking.status !== 'pending') {
    return { ok: false, error: 'Yalnızca ödenmemiş rezervasyona kupon eklenebilir.' };
  }

  const { error: rpcErr } = await supabase.rpc('apply_coupon_to_booking', {
    p_booking_id: booking.id,
    p_code: parsed.data.code,
  });
  if (rpcErr) {
    // RPC raise exception 'coupon_invalid:<reason>' formatında mesaj atar.
    const match = /coupon_invalid:(\w+)/.exec(rpcErr.message ?? '');
    if (match) return { ok: false, error: couponReasonLabel(match[1]) };
    return { ok: false, error: 'Kupon uygulanamadı.' };
  }

  revalidatePath(`/odeme/${parsed.data.bookingCode}`);
  return { ok: true, message: 'Kupon uygulandı.' };
}

export async function removeCouponAction(
  _prev: CouponState,
  formData: FormData,
): Promise<CouponState> {
  const user = await requireUser();

  const parsed = removeSchema.safeParse({
    bookingCode: formData.get('bookingCode'),
  });
  if (!parsed.success) return { ok: false, error: 'Geçersiz istek.' };

  const supabase = await getServerClient();
  const { data: booking, error: bErr } = await supabase
    .from('bookings')
    .select('id, user_id, status')
    .eq('booking_code', parsed.data.bookingCode)
    .maybeSingle();

  if (bErr || !booking) return { ok: false, error: 'Rezervasyon bulunamadı.' };
  if (booking.user_id !== user.id) return { ok: false, error: 'Bu rezervasyon size ait değil.' };
  if (booking.status !== 'pending') {
    return { ok: false, error: 'Yalnızca ödenmemiş rezervasyondan kupon çıkarılabilir.' };
  }

  const { error: rpcErr } = await supabase.rpc('remove_coupon_from_booking', {
    p_booking_id: booking.id,
  });
  if (rpcErr) return { ok: false, error: 'Kupon kaldırılamadı.' };

  revalidatePath(`/odeme/${parsed.data.bookingCode}`);
  return { ok: true, message: 'Kupon kaldırıldı.' };
}
