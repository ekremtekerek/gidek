'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getServerClient } from '@/lib/db/server';
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
    .select('id, user_id, status')
    .eq('booking_code', parsed.data.bookingCode)
    .maybeSingle();

  if (bErr || !booking) return { ok: false, error: 'Rezervasyon bulunamadı.' };
  if (booking.user_id !== user.id) return { ok: false, error: 'Bu rezervasyon size ait değil.' };
  if (booking.status === 'cancelled') return { ok: false, error: 'Bu rezervasyon iptal edilmiş.' };

  // Yapay gecikme — "ödeme işleniyor" hissi için.
  await new Promise((r) => setTimeout(r, 1200));

  if (booking.status === 'pending') {
    const { error: uErr } = await supabase
      .from('bookings')
      .update({ status: 'confirmed' })
      .eq('id', booking.id);
    if (uErr) return { ok: false, error: 'Ödeme kaydedilemedi.' };
  }

  revalidatePath('/rezervasyonlarim');
  redirect(withToast(`/rezervasyonlarim/${parsed.data.bookingCode}`, TOAST_KEYS.paymentSuccess));
}
