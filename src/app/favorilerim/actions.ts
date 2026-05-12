'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getServerClient } from '@/lib/db/server';
import { requireUser } from '@/lib/security/auth';

const toggleSchema = z.object({
  dealId: z.string().uuid('Geçersiz fırsat tanımlayıcısı'),
});

export type ToggleFavoriteResult = { favorited: boolean } | { error: string };

/**
 * Toggle the caller's favorite for a deal. Idempotent-ish: reads current
 * state, deletes if present, inserts if not. RLS guarantees the caller can
 * only mutate rows where user_id = auth.uid().
 */
export async function toggleFavoriteAction(dealId: string): Promise<ToggleFavoriteResult> {
  const parsed = toggleSchema.safeParse({ dealId });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Geçersiz istek' };

  const user = await requireUser();
  const supabase = await getServerClient();

  const { data: existing, error: readErr } = await supabase
    .from('favorites')
    .select('deal_id')
    .eq('deal_id', parsed.data.dealId)
    .eq('user_id', user.id)
    .maybeSingle();
  if (readErr) return { error: 'Favoriler okunamadı' };

  if (existing) {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('deal_id', parsed.data.dealId);
    if (error) return { error: 'Favoriden çıkarılamadı' };
    revalidatePath('/favorilerim');
    return { favorited: false };
  }

  const { error } = await supabase
    .from('favorites')
    .insert({ user_id: user.id, deal_id: parsed.data.dealId });
  if (error) return { error: 'Favorilere eklenemedi' };
  revalidatePath('/favorilerim');
  return { favorited: true };
}
