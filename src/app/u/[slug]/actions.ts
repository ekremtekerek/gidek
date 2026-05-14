'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getServerClient } from '@/lib/db/server';
import { requireUser } from '@/lib/security/auth';

const targetSchema = z.object({
  targetUserId: z.string().uuid(),
});

export type FollowState =
  | { ok: true; following: boolean }
  | { ok: false; error: string }
  | null;

/**
 * Toggle follow — kullanıcı zaten takip ediyorsa unfollow, etmiyorsa follow.
 * Idempotent: aynı kayıt ikinci kez insert/delete edilirse 0 row değişir.
 * Self-follow check constraint (follows_no_self) ile reddedilir.
 */
export async function toggleFollowAction(input: { targetUserId: string }): Promise<FollowState> {
  const user = await requireUser();

  const parsed = targetSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Geçersiz hedef.' };
  if (parsed.data.targetUserId === user.id) {
    return { ok: false, error: 'Kendini takip edemezsin.' };
  }

  const supabase = await getServerClient();
  const target = parsed.data.targetUserId;

  // Mevcut durumu öğren
  const { data: existing } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('follower_id', user.id)
    .eq('followee_id', target)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', user.id)
      .eq('followee_id', target);
    if (error) return { ok: false, error: 'Takipten çıkılamadı.' };
    revalidatePathsForTarget(target);
    return { ok: true, following: false };
  }

  const { error } = await supabase.from('follows').insert({
    follower_id: user.id,
    followee_id: target,
  });
  if (error) return { ok: false, error: 'Takip edilemedi.' };

  revalidatePathsForTarget(target);
  return { ok: true, following: true };
}

function revalidatePathsForTarget(targetUserId: string) {
  // Hedef profilin sayfası ISR; takipçi sayısı güncellensin.
  // public_slug bilmediğimiz için generic path ile tag yerine /u'yu da
  // revalidate edelim.
  revalidatePath('/u');
  void targetUserId; // ileride targeted path için ayrı revalidate
}
