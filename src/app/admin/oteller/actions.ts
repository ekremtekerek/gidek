'use server';

import {
  executeHotelDelete,
  executeHotelSave,
  type HotelFormState,
} from '@/lib/admin/hotel-save';
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
