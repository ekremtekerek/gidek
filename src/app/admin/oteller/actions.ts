'use server';

import { revalidatePath } from 'next/cache';
import {
  executeHotelDelete,
  executeHotelSave,
  type HotelFormState,
} from '@/lib/admin/hotel-save';
import { getServiceClient } from '@/lib/db/service';
import { requireAdmin } from '@/lib/security/auth';

export async function saveHotelAction(
  _prev: HotelFormState,
  formData: FormData,
): Promise<HotelFormState> {
  await requireAdmin();
  return executeHotelSave(formData, {
    scopedMerchantId: null,
    redirectBase: '/admin/oteller',
  });
}

export async function deleteHotelAction(dealId: string): Promise<void> {
  await requireAdmin();
  await executeHotelDelete(dealId, { redirectBase: '/admin/oteller' });
}

export type BulkAction = 'publish' | 'unpublish' | 'delete';

/**
 * Birden fazla otel/tatil deal'ına aynı anda işlem uygula. Admin'in 1-50
 * deal'ı tek seferde yayına alıp çıkarması ya da silmesi için.
 *
 * - publish: is_active=true + published_at=now()
 * - unpublish: is_active=false
 * - delete: cascade siler (deal_categories/hotel_meta/room_types ON DELETE
 *   CASCADE ile birlikte düşer)
 */
export async function bulkUpdateHotelsAction(
  ids: string[],
  action: BulkAction,
): Promise<{ ok: true; count: number } | { ok: false; error: string }> {
  await requireAdmin();

  if (!Array.isArray(ids) || ids.length === 0) {
    return { ok: false, error: 'Hiç deal seçilmedi' };
  }
  if (ids.length > 50) {
    return { ok: false, error: 'En fazla 50 deal aynı anda işlenebilir' };
  }
  if (!ids.every((id) => /^[0-9a-f-]{36}$/i.test(id))) {
    return { ok: false, error: 'Geçersiz id formatı' };
  }

  const supabase = getServiceClient();
  let count = 0;

  if (action === 'publish') {
    const { count: c, error } = await supabase
      .from('deals')
      .update({ is_active: true, published_at: new Date().toISOString() }, { count: 'exact' })
      .in('id', ids);
    if (error) return { ok: false, error: error.message };
    count = c ?? ids.length;
  } else if (action === 'unpublish') {
    const { count: c, error } = await supabase
      .from('deals')
      .update({ is_active: false }, { count: 'exact' })
      .in('id', ids);
    if (error) return { ok: false, error: error.message };
    count = c ?? ids.length;
  } else if (action === 'delete') {
    const { count: c, error } = await supabase
      .from('deals')
      .delete({ count: 'exact' })
      .in('id', ids);
    if (error) return { ok: false, error: error.message };
    count = c ?? ids.length;
  }

  revalidatePath('/admin/oteller');
  revalidatePath('/tatil');
  return { ok: true, count };
}
