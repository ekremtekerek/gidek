'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getServiceClient } from '@/lib/db/service';
import { requireAdmin } from '@/lib/security/auth';

const codeSchema = z.string().trim().min(4).max(40);

export type AdminBookingState =
  | { ok: true; message?: string }
  | { ok: false; error: string }
  | null;

/**
 * Admin tarafından bir rezervasyonu iptal eder. cancel_booking RPC'si user-only
 * yetki istediği için burada service-role ile doğrudan UPDATE yapıyoruz; aynı
 * sold_count senkron mantığını manuel tekrarlıyoruz.
 */
export async function adminCancelBookingAction(
  _prev: AdminBookingState,
  formData: FormData,
): Promise<AdminBookingState> {
  await requireAdmin();
  const code = codeSchema.safeParse(formData.get('code'));
  if (!code.success) return { ok: false, error: 'Geçersiz kod.' };
  const notes = (formData.get('notes')?.toString() ?? '').trim().slice(0, 500) || null;

  const supabase = getServiceClient();
  const { data: b, error: rErr } = await supabase
    .from('bookings')
    .select('id, status, quantity, deal_id, admin_notes')
    .eq('booking_code', code.data)
    .maybeSingle();
  if (rErr || !b) return { ok: false, error: 'Rezervasyon bulunamadı.' };
  if (b.status === 'cancelled') return { ok: false, error: 'Bu rezervasyon zaten iptal edilmiş.' };

  const wasConfirmed = b.status === 'confirmed';

  const mergedNotes = [b.admin_notes, notes].filter(Boolean).join('\n').trim() || null;
  const { error: uErr } = await supabase
    .from('bookings')
    .update({
      status: 'cancelled',
      cancelled_by_admin_at: new Date().toISOString(),
      admin_notes: mergedNotes,
    })
    .eq('id', b.id);
  if (uErr) return { ok: false, error: 'Güncellenemedi.' };

  if (wasConfirmed) {
    // sold_count'u geri al — kullanıcı RPC'sindeki davranışı mirror'lıyoruz.
    const { data: deal } = await supabase
      .from('deals')
      .select('sold_count')
      .eq('id', b.deal_id)
      .maybeSingle();
    if (deal) {
      const next = Math.max(0, (deal.sold_count ?? 0) - b.quantity);
      await supabase.from('deals').update({ sold_count: next }).eq('id', b.deal_id);
    }
  }

  revalidatePath('/admin/bookings');
  revalidatePath(`/admin/bookings/${code.data}`);
  revalidatePath(`/rezervasyonlarim/${code.data}`);
  return { ok: true, message: 'Rezervasyon iptal edildi.' };
}

/**
 * "Kullanıldı" olarak işaretle — confirmed rezervasyonu used'a alır.
 * sold_count etkilenmez (confirmed→used aynı kovaya sayar).
 */
export async function adminMarkUsedAction(
  _prev: AdminBookingState,
  formData: FormData,
): Promise<AdminBookingState> {
  await requireAdmin();
  const code = codeSchema.safeParse(formData.get('code'));
  if (!code.success) return { ok: false, error: 'Geçersiz kod.' };

  const supabase = getServiceClient();
  const { data: b } = await supabase
    .from('bookings')
    .select('id, status')
    .eq('booking_code', code.data)
    .maybeSingle();
  if (!b) return { ok: false, error: 'Rezervasyon bulunamadı.' };
  if (b.status !== 'confirmed') {
    return { ok: false, error: 'Yalnızca onaylanmış rezervasyon kullanıldıya çevrilebilir.' };
  }

  const { error } = await supabase.from('bookings').update({ status: 'used' }).eq('id', b.id);
  if (error) return { ok: false, error: 'Güncellenemedi.' };

  revalidatePath('/admin/bookings');
  revalidatePath(`/admin/bookings/${code.data}`);
  return { ok: true, message: 'Rezervasyon kullanıldı olarak işaretlendi.' };
}

/**
 * İadeyi mock işaretle — V1'de tahsilat geri çekmesi yok, yalnız operasyon
 * için zaman damgası bırakır. İptal edilmiş rezervasyonlar üzerinde anlamlı.
 */
export async function adminMarkRefundedAction(
  _prev: AdminBookingState,
  formData: FormData,
): Promise<AdminBookingState> {
  await requireAdmin();
  const code = codeSchema.safeParse(formData.get('code'));
  if (!code.success) return { ok: false, error: 'Geçersiz kod.' };

  const supabase = getServiceClient();
  const { data: b } = await supabase
    .from('bookings')
    .select('id, status, refunded_at')
    .eq('booking_code', code.data)
    .maybeSingle();
  if (!b) return { ok: false, error: 'Rezervasyon bulunamadı.' };
  if (b.refunded_at) return { ok: false, error: 'Bu rezervasyon zaten iade işaretli.' };

  const { error } = await supabase
    .from('bookings')
    .update({ refunded_at: new Date().toISOString() })
    .eq('id', b.id);
  if (error) return { ok: false, error: 'Güncellenemedi.' };

  revalidatePath('/admin/bookings');
  revalidatePath(`/admin/bookings/${code.data}`);
  return { ok: true, message: 'İade işaretlendi (mock).' };
}

const notesSchema = z.string().trim().max(1000).optional();

export async function updateAdminNotesAction(
  _prev: AdminBookingState,
  formData: FormData,
): Promise<AdminBookingState> {
  await requireAdmin();
  const code = codeSchema.safeParse(formData.get('code'));
  if (!code.success) return { ok: false, error: 'Geçersiz kod.' };
  const notes = notesSchema.safeParse(formData.get('admin_notes'));
  if (!notes.success) return { ok: false, error: 'Notlar çok uzun.' };

  const supabase = getServiceClient();
  const { error } = await supabase
    .from('bookings')
    .update({ admin_notes: notes.data ?? null })
    .eq('booking_code', code.data);
  if (error) return { ok: false, error: 'Güncellenemedi.' };

  revalidatePath(`/admin/bookings/${code.data}`);
  return { ok: true, message: 'Notlar kaydedildi.' };
}
