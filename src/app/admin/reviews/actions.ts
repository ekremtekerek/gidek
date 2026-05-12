'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getServiceClient } from '@/lib/db/service';
import { requireAdmin } from '@/lib/security/auth';

const idSchema = z.object({ id: z.string().uuid() });

export async function toggleReviewActiveAction(
  _prev: unknown,
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin();
  const parsed = idSchema.safeParse({ id: formData.get('id') });
  if (!parsed.success) return { ok: false, error: 'Geçersiz ID.' };

  const supabase = getServiceClient();
  const { data: current, error: rErr } = await supabase
    .from('reviews')
    .select('is_active')
    .eq('id', parsed.data.id)
    .maybeSingle();
  if (rErr || !current) return { ok: false, error: 'Yorum bulunamadı.' };

  const { error: uErr } = await supabase
    .from('reviews')
    .update({ is_active: !current.is_active })
    .eq('id', parsed.data.id);
  if (uErr) return { ok: false, error: 'Güncellenemedi.' };

  revalidatePath('/admin/reviews');
  return { ok: true };
}

export async function deleteReviewAction(
  _prev: unknown,
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin();
  const parsed = idSchema.safeParse({ id: formData.get('id') });
  if (!parsed.success) return { ok: false, error: 'Geçersiz ID.' };

  const supabase = getServiceClient();
  const { error } = await supabase.from('reviews').delete().eq('id', parsed.data.id);
  if (error) return { ok: false, error: 'Silinemedi.' };

  revalidatePath('/admin/reviews');
  return { ok: true };
}
