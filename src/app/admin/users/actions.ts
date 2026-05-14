'use server';

import { revalidatePath } from 'next/cache';
import { getServiceClient } from '@/lib/db/service';
import { requireAdmin } from '@/lib/security/auth';

/**
 * Kullanıcıyı süresiz banla / banını kaldır. Supabase auth `banned_until`
 * alanını uzak gelecekteki bir tarihe set ederek banlar; null = açık.
 * Ban edilmiş kullanıcı oturum açamaz ve mevcut JWT'leri reddedilir.
 */
export async function toggleUserBanAction(
  _prev: unknown,
  formData: FormData,
): Promise<{ ok: true; banned: boolean } | { ok: false; error: string }> {
  const admin = await requireAdmin();
  const id = String(formData.get('id') ?? '');
  if (!id) return { ok: false, error: 'ID eksik.' };
  if (id === admin.id) return { ok: false, error: 'Kendini banlayamazsın.' };

  const supabase = getServiceClient();
  const { data: u } = await supabase.auth.admin.getUserById(id);
  if (!u?.user) return { ok: false, error: 'Kullanıcı bulunamadı.' };

  const banned = Boolean(
    (u.user as { banned_until?: string | null }).banned_until &&
      new Date((u.user as { banned_until: string }).banned_until) > new Date(),
  );

  // 'none' Supabase'in ban'ı kaldırmak için kabul ettiği sentinel değer.
  const nextDuration = banned ? 'none' : '876000h'; // ~100 yıl
  const { error } = await supabase.auth.admin.updateUserById(id, {
    ban_duration: nextDuration,
  });
  if (error) return { ok: false, error: 'Ban durumu güncellenemedi.' };

  revalidatePath('/admin/users');
  return { ok: true, banned: !banned };
}
