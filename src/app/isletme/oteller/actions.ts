'use server';

import {
  executeHotelDelete,
  executeHotelSave,
  type HotelFormState,
} from '@/lib/admin/hotel-save';
import { getServiceClient } from '@/lib/db/service';
import { requireMerchant } from '@/lib/security/auth';

/**
 * İşletme sahibi için otel/tatil deal kaydetme. Admin'in saveHotelAction'ı
 * ile aynı core'u (executeHotelSave) çağırır; form'daki merchant_id
 * caller'ın kendi merchantId'si ile override edilir, UPDATE'te mevcut
 * deal'ın sahipliği kontrol edilir.
 */
export async function saveHotelAsMerchantAction(
  _prev: HotelFormState,
  formData: FormData,
): Promise<HotelFormState> {
  const { merchantId } = await requireMerchant();
  return executeHotelSave(formData, {
    scopedMerchantId: merchantId,
    redirectBase: '/isletme/oteller',
  });
}

/**
 * İşletme sahibi kendi otelini silebilir. Önce sahiplik doğrulanır.
 */
export async function deleteHotelAsMerchantAction(dealId: string): Promise<void> {
  const { merchantId } = await requireMerchant();
  const supabase = getServiceClient();
  const { data: deal } = await supabase
    .from('deals')
    .select('merchant_id')
    .eq('id', dealId)
    .maybeSingle();
  if (!deal || deal.merchant_id !== merchantId) {
    throw new Error('Bu deal sizin işletmenize ait değil');
  }
  await executeHotelDelete(dealId, { redirectBase: '/isletme/oteller' });
}
