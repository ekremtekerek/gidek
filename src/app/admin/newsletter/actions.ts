'use server';

import { revalidatePath } from 'next/cache';
import { getServiceClient } from '@/lib/db/service';
import { requireAdmin } from '@/lib/security/auth';

export async function unsubscribeFromAdminAction(
  _prev: unknown,
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin();
  const id = String(formData.get('id') ?? '');
  if (!id) return { ok: false, error: 'ID eksik.' };

  const supabase = getServiceClient();
  const { error } = await supabase
    .from('newsletter_subscribers')
    .update({ unsubscribed_at: new Date().toISOString() })
    .eq('id', Number(id));
  if (error) return { ok: false, error: 'Güncellenemedi.' };

  revalidatePath('/admin/newsletter');
  return { ok: true };
}

export async function deleteSubscriberAction(
  _prev: unknown,
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin();
  const id = String(formData.get('id') ?? '');
  if (!id) return { ok: false, error: 'ID eksik.' };

  const supabase = getServiceClient();
  const { error } = await supabase
    .from('newsletter_subscribers')
    .delete()
    .eq('id', Number(id));
  if (error) return { ok: false, error: 'Silinemedi.' };

  revalidatePath('/admin/newsletter');
  return { ok: true };
}
