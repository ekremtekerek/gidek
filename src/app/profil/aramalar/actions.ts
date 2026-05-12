'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getServerClient } from '@/lib/db/server';
import { requireUser } from '@/lib/security/auth';
import { TOAST_KEYS, withToast } from '@/lib/utils/toast';

const saveSchema = z.object({
  query: z.string().trim().min(3).max(300),
  /** Görsel etiket; verilmezse query'nin baş 60 karakteri kullanılır. */
  name: z.string().trim().max(80).optional(),
});

export type SaveSearchState = { ok: false; error: string } | null;

/**
 * Kullanıcının son AI sorgusunu kaydeder. Aynı sorgu daha önce kaydedilmişse
 * (unique index) sessizce başarılı sayar — kullanıcı yine doğrudan profile
 * gönderilir.
 */
export async function saveSearchAction(
  _prev: SaveSearchState,
  formData: FormData,
): Promise<SaveSearchState> {
  const user = await requireUser();
  const parsed = saveSchema.safeParse({
    query: formData.get('query'),
    name: formData.get('name'),
  });
  if (!parsed.success) return { ok: false, error: 'Geçersiz sorgu.' };

  const supabase = await getServerClient();
  const name = parsed.data.name?.length
    ? parsed.data.name
    : parsed.data.query.slice(0, 60);

  const { error } = await supabase
    .from('saved_searches')
    .insert({ user_id: user.id, name, query: parsed.data.query });

  // 23505 = unique violation → "zaten kayıtlı" — kullanıcıya başarı gibi davran
  if (error && error.code !== '23505') {
    return { ok: false, error: 'Arama kaydedilemedi.' };
  }

  revalidatePath('/profil/aramalar');
  redirect(withToast('/profil/aramalar', TOAST_KEYS.searchSaved));
}

const deleteSchema = z.object({
  id: z.string().uuid(),
});

export type DeleteSearchState = { ok: false; error: string } | null;

export async function deleteSearchAction(
  _prev: DeleteSearchState,
  formData: FormData,
): Promise<DeleteSearchState> {
  await requireUser();
  const parsed = deleteSchema.safeParse({ id: formData.get('id') });
  if (!parsed.success) return { ok: false, error: 'Geçersiz ID.' };

  const supabase = await getServerClient();
  const { error } = await supabase.from('saved_searches').delete().eq('id', parsed.data.id);
  if (error) return { ok: false, error: 'Silinemedi.' };

  revalidatePath('/profil/aramalar');
  redirect(withToast('/profil/aramalar', TOAST_KEYS.searchDeleted));
}
